import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { checkins, participants, tickets } from "@/db/schema";
import { ensureTicketForParticipant } from "./tickets";
import { recordActivity } from "./activity";

export type ValidationState = "VALID" | "INVALID" | "EXPIRED" | "REVOKED" | "WRONG_EVENT" | "ALREADY_CHECKED_IN" | "NOT_YET_VALID" | "NOT_APPROVED";
export type Validation = { state: ValidationState; ticket?: typeof tickets.$inferSelect; participant?: typeof participants.$inferSelect; checkedInAt?: Date; method?: "QR" | "MANUAL" };

async function validationForTicket(ticket: typeof tickets.$inferSelect, participant: typeof participants.$inferSelect, eventId: string, database: Pick<Database, "select">, now = new Date()): Promise<Validation> {
  if (ticket.eventId !== eventId) return { state: "WRONG_EVENT" };
  const [existing] = await database.select().from(checkins).where(and(eq(checkins.eventId, eventId), eq(checkins.participantId, participant.id))).limit(1);
  if (existing) return { state: "ALREADY_CHECKED_IN", ticket, participant, checkedInAt: existing.checkedInAt, method: existing.checkinMethod };
  if (ticket.status === "REVOKED") return { state: "REVOKED", ticket, participant };
  if (ticket.status !== "ACTIVE") return { state: "INVALID", ticket, participant };
  if (now > ticket.validUntil) return { state: "EXPIRED", ticket, participant };
  if (now < ticket.validFrom) return { state: "NOT_YET_VALID", ticket, participant };
  if (participant.status !== "APPROVED" && participant.status !== "CHECKED_IN") return { state: "NOT_APPROVED", ticket, participant };
  return { state: "VALID", ticket, participant };
}

export async function validateTicket(eventId: string, qrToken: string, database: Database = getDb()): Promise<Validation> {
  const [row] = await database.select({ ticket: tickets, participant: participants }).from(tickets).innerJoin(participants, eq(participants.id, tickets.participantId)).where(eq(tickets.qrToken, qrToken)).limit(1);
  return row ? validationForTicket(row.ticket, row.participant, eventId, database) : { state: "INVALID" };
}

export async function confirmCheckIn(eventId: string, qrToken: string, actorId: string, method: "QR" | "MANUAL" = "QR", database: Database = getDb()): Promise<Validation> {
  return database.transaction(async (tx) => {
    const [ticket] = await tx.select().from(tickets).where(eq(tickets.qrToken, qrToken)).for("update").limit(1);
    if (!ticket) return { state: "INVALID" };
    const [participant] = await tx.select().from(participants).where(eq(participants.id, ticket.participantId)).for("update").limit(1);
    if (!participant) return { state: "INVALID" };
    const validation = await validationForTicket(ticket, participant, eventId, tx);
    if (validation.state !== "VALID") return validation;
    const now = new Date();
    await tx.insert(checkins).values({ id: crypto.randomUUID(), eventId, participantId: participant.id, ticketId: ticket.id, checkinMethod: method, checkedInAt: now, checkedInBy: actorId });
    await tx.update(participants).set({ status: "CHECKED_IN" }).where(eq(participants.id, participant.id));
    await tx.update(tickets).set({ status: "USED" }).where(eq(tickets.id, ticket.id));
    await recordActivity(eventId, "CHECK_IN", `${participant.name} checked in via ${method}.`, actorId, tx);
    return { state: "VALID", ticket: { ...ticket, status: "USED" }, participant: { ...participant, status: "CHECKED_IN" } };
  });
}

export async function manualCheckIn(eventId: string, participantId: string, actorId: string, database: Database = getDb()): Promise<Validation> {
  const ensured = await ensureTicketForParticipant(eventId, participantId, database);
  if (!ensured.ok) return { state: ensured.code === "NOT_APPROVED" ? "NOT_APPROVED" : "INVALID" };
  return confirmCheckIn(eventId, ensured.ticket.qrToken, actorId, "MANUAL", database);
}

export async function searchCheckInParticipants(eventId: string, query: string, database: Database = getDb()) {
  const term = query.trim();
  if (!term) return [];
  return database.select().from(participants).where(and(eq(participants.eventId, eventId), or(like(participants.name, `%${term}%`), like(participants.email, `%${term}%`), like(participants.phone, `%${term}%`)), inArray(participants.status, ["APPROVED", "CHECKED_IN"]))).limit(12);
}

export async function recentCheckins(eventId: string, database: Database = getDb()) { return database.select({ checkin: checkins, participant: participants }).from(checkins).innerJoin(participants, eq(participants.id, checkins.participantId)).where(eq(checkins.eventId, eventId)).orderBy(desc(checkins.checkedInAt)).limit(20); }
export async function checkinCount(eventId: string, database: Database = getDb()) { const [r] = await database.select({ checkedIn: sql<number>`sum(case when ${participants.status} = 'CHECKED_IN' then 1 else 0 end)`, eligible: sql<number>`sum(case when ${participants.status} in ('APPROVED', 'CHECKED_IN') then 1 else 0 end)` }).from(participants).where(eq(participants.eventId, eventId)); return { checkedIn: Number(r?.checkedIn ?? 0), eligible: Number(r?.eligible ?? 0) }; }
