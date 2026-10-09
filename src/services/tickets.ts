import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb, type Database } from "@/db";
import { events, participants, tickets, type Event, type Participant, type Ticket } from "@/db/schema";

type TicketExecutor = Pick<Database, "select" | "insert">;
export type TicketResult = { ok: true; ticket: Ticket } | { ok: false; code: string; message: string };

function ticketNumber() { return `EVT-${new Date().getUTCFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`; }
function token() { return randomBytes(32).toString("base64url"); }

export async function ensureTicketInTransaction(event: Event, participant: Participant, database: TicketExecutor): Promise<TicketResult> {
  if (participant.status !== "APPROVED" && participant.status !== "CHECKED_IN") return { ok: false, code: "NOT_APPROVED", message: "Only approved participants can receive tickets." };
  const [existing] = await database.select().from(tickets).where(and(eq(tickets.eventId, event.id), eq(tickets.participantId, participant.id))).limit(1);
  if (existing) return { ok: true, ticket: existing };
  if (!event.ticketValidFrom || !event.ticketValidUntil) return { ok: false, code: "TICKET_VALIDITY_MISSING", message: "Set ticket validity before approving participants." };
  const id = crypto.randomUUID();
  await database.insert(tickets).values({ id, eventId: event.id, participantId: participant.id, ticketNumber: ticketNumber(), qrToken: token(), status: "ACTIVE", validFrom: event.ticketValidFrom, validUntil: event.ticketValidUntil, issuedAt: new Date() });
  const [created] = await database.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return created ? { ok: true, ticket: created } : { ok: false, code: "TICKET_FAILED", message: "Ticket could not be created." };
}

export async function ensureTicketForParticipant(eventId: string, participantId: string, database: Database = getDb()): Promise<TicketResult> {
  return database.transaction(async (tx) => {
    const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update").limit(1);
    const [participant] = await tx.select().from(participants).where(and(eq(participants.id, participantId), eq(participants.eventId, eventId))).for("update").limit(1);
    if (!event || !participant) return { ok: false, code: "NOT_FOUND", message: "Event or participant was not found." };
    return ensureTicketInTransaction(event, participant, tx);
  });
}

export async function getTicketByToken(qrToken: string, database: Database = getDb()) {
  const [row] = await database.select({ ticket: tickets, event: events, participant: participants }).from(tickets).innerJoin(events, eq(events.id, tickets.eventId)).innerJoin(participants, eq(participants.id, tickets.participantId)).where(eq(tickets.qrToken, qrToken)).limit(1);
  return row ?? null;
}

export async function listTickets(eventId: string, page = 1, database: Database = getDb()) {
  return database.select({ ticket: tickets, participant: participants }).from(tickets).innerJoin(participants, eq(participants.id, tickets.participantId)).where(eq(tickets.eventId, eventId)).orderBy(tickets.issuedAt).limit(25).offset((Math.max(1, page) - 1) * 25);
}
