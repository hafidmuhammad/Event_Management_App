import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { events, participants, type Participant } from "@/db/schema";
import { participantRegistrationSchema, type ParticipantStatus, normalizeEmail, normalizePhone, registrationWindowState, rejectionSchema } from "@/lib/validation/participants";
import { ensureTicketInTransaction } from "./tickets";

export type ParticipantResult = { ok: true; participant: Participant } | { ok: false; code: string; message: string };

function rowsWereAffected(result: unknown) {
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number } | undefined)?.affectedRows ?? 0) > 0;
}

export async function listParticipants(eventId: string, options: { search?: string; status?: ParticipantStatus | "ALL"; page?: number; pageSize?: number }, database: Database = getDb()) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 25));
  const filters = [eq(participants.eventId, eventId)];
  const search = options.search?.trim();
  if (search) filters.push(or(like(participants.name, `%${search}%`), like(participants.email, `%${search}%`), like(participants.phone, `%${search}%`), like(participants.company, `%${search}%`))!);
  if (options.status && options.status !== "ALL") filters.push(eq(participants.status, options.status));
  const rows = await database.select().from(participants).where(and(...filters)).orderBy(desc(participants.registeredAt), asc(participants.name)).limit(pageSize).offset((page - 1) * pageSize);
  return rows;
}

export async function getParticipantForEvent(eventId: string, participantId: string, database: Database = getDb()) {
  const [participant] = await database.select().from(participants).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId))).limit(1);
  return participant ?? null;
}

export async function registerParticipant(eventId: string, input: unknown, now = new Date(), database: Database = getDb()): Promise<ParticipantResult> {
  const parsed = participantRegistrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Check the registration details." };
  const event = await (async () => { const [row] = await database.select().from(events).where(eq(events.id, eventId)).limit(1); return row ?? null; })();
  if (!event) return { ok: false, code: "EVENT_NOT_FOUND", message: "Event not found." };
  const windowState = registrationWindowState(event, now);
  if (windowState === "NOT_OPEN") return { ok: false, code: "REGISTRATION_NOT_OPEN", message: "Registration is not open yet." };
  if (windowState === "CLOSED") return { ok: false, code: "REGISTRATION_CLOSED", message: "Registration is closed." };
  if (windowState === "CANCELLED") return { ok: false, code: "EVENT_CANCELLED", message: "Registration is unavailable for this event." };
  if (windowState !== "OPEN") return { ok: false, code: "EVENT_NOT_PUBLISHED", message: "Registration is not available for this event." };
  const email = normalizeEmail(parsed.data.email);
  const phone = normalizePhone(parsed.data.phone);
  const [duplicate] = await database.select({ id: participants.id }).from(participants).where(and(eq(participants.eventId, eventId), or(eq(participants.email, email), eq(participants.phone, phone)))).limit(1);
  if (duplicate) return { ok: false, code: "DUPLICATE_REGISTRATION", message: "This email or phone is already registered for this event." };
  const id = crypto.randomUUID();
  await database.insert(participants).values({ id, eventId, title: parsed.data.title || null, name: parsed.data.name, company: parsed.data.company || null, jobTitle: parsed.data.jobTitle || null, phone, email, status: "PENDING", registeredAt: now });
  const participant = await getParticipantForEvent(eventId, id, database);
  return participant ? { ok: true, participant } : { ok: false, code: "REGISTRATION_FAILED", message: "Registration could not be saved." };
}

export async function approveParticipant(eventId: string, participantId: string, actorId: string, database: Database = getDb()): Promise<ParticipantResult> {
  return database.transaction(async (tx) => {
    const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update").limit(1);
    if (!event) return { ok: false, code: "EVENT_NOT_FOUND", message: "Event not found." };
    const [participant] = await tx.select().from(participants).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId))).for("update").limit(1);
    if (!participant) return { ok: false, code: "PARTICIPANT_NOT_FOUND", message: "Participant was not found in this event." };
    if (participant.status !== "PENDING" && participant.status !== "WAITLIST") return { ok: false, code: "INVALID_STATUS", message: "Only pending or waitlisted participants can be approved." };
    const approvedRows = await tx.select({ count: sql<number>`count(*)` }).from(participants).where(and(eq(participants.eventId, eventId), inArray(participants.status, ["APPROVED", "CHECKED_IN"]))).limit(1);
    const approvedCount = Number(approvedRows[0]?.count ?? 0);
    if (event.capacity !== null && approvedCount >= event.capacity) return { ok: false, code: "EVENT_CAPACITY_REACHED", message: "Event capacity has been reached. Move the participant to waitlist instead." };
    await tx.update(participants).set({ status: "APPROVED", approvedAt: new Date(), approvedBy: actorId, rejectedAt: null, rejectionReason: null }).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId)));
    const [updated] = await tx.select().from(participants).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId))).limit(1);
    if (!updated) return { ok: false, code: "APPROVAL_FAILED", message: "Participant approval failed." };
    const ticket = await ensureTicketInTransaction(event, updated, tx);
    return ticket.ok ? { ok: true, participant: updated } : { ok: false, code: ticket.code, message: ticket.message };
  });
}

export async function waitlistParticipant(eventId: string, participantId: string, database: Database = getDb()): Promise<ParticipantResult> {
  const result = await database.update(participants).set({ status: "WAITLIST" }).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId), eq(participants.status, "PENDING")));
  if (!rowsWereAffected(result)) return { ok: false, code: "WAITLIST_FAILED", message: "Only pending participants can be moved to waitlist." };
  const updated = await getParticipantForEvent(eventId, participantId, database);
  return updated ? { ok: true, participant: updated } : { ok: false, code: "PARTICIPANT_NOT_FOUND", message: "Participant was not found in this event." };
}

export async function rejectParticipant(eventId: string, participantId: string, input: unknown, database: Database = getDb()): Promise<ParticipantResult> {
  const parsed = rejectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID_REASON", message: parsed.error.issues[0]?.message ?? "A rejection reason is required." };
  const result = await database.update(participants).set({ status: "REJECTED", rejectedAt: new Date(), rejectionReason: parsed.data.rejectionReason }).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId), inArray(participants.status, ["PENDING", "WAITLIST"])));
  if (!rowsWereAffected(result)) return { ok: false, code: "REJECT_FAILED", message: "Only pending or waitlisted participants can be rejected." };
  const updated = await getParticipantForEvent(eventId, participantId, database);
  return updated ? { ok: true, participant: updated } : { ok: false, code: "PARTICIPANT_NOT_FOUND", message: "Participant was not found in this event." };
}

export async function cancelParticipant(eventId: string, participantId: string, database: Database = getDb()): Promise<ParticipantResult> {
  const result = await database.update(participants).set({ status: "CANCELLED" }).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId), inArray(participants.status, ["PENDING", "WAITLIST", "APPROVED"])));
  if (!rowsWereAffected(result)) return { ok: false, code: "CANCEL_FAILED", message: "This participant cannot be cancelled from the current status." };
  const updated = await getParticipantForEvent(eventId, participantId, database);
  return updated ? { ok: true, participant: updated } : { ok: false, code: "PARTICIPANT_NOT_FOUND", message: "Participant was not found in this event." };
}
