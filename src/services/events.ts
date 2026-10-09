import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { events, participants, type CommitteeMember } from "@/db/schema";
import { getDb, type Database } from "@/db";
import { committeeSchema, eventInputSchema, type EventInput, validateEventForPublish } from "@/lib/validation/events";

export type EventStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "FINISHED" | "CANCELLED";

export async function getEvent(eventId: string, database: Database = getDb()) {
  const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);
  return event ?? null;
}

export async function getDashboardSummary(database: Database = getDb()) {
  const [eventCounts, participantCounts] = await Promise.all([
    database.select({ status: events.status, count: sql<number>`count(*)` }).from(events).groupBy(events.status),
    database.select({ status: participants.status, count: sql<number>`count(*)` }).from(participants).groupBy(participants.status),
  ]);
  const byEvent = Object.fromEntries(eventCounts.map((row) => [row.status, Number(row.count)]));
  const byParticipant = Object.fromEntries(participantCounts.map((row) => [row.status, Number(row.count)]));
  return {
    totalEvents: eventCounts.reduce((total, row) => total + Number(row.count), 0),
    activeEvents: (byEvent.PUBLISHED ?? 0) + (byEvent.ONGOING ?? 0),
    pending: byParticipant.PENDING ?? 0,
    checkedIn: byParticipant.CHECKED_IN ?? 0,
  };
}

export async function listEvents(options: { search?: string; status?: EventStatus | "ALL"; page?: number; pageSize?: number }, database: Database = getDb()) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));
  const search = options.search?.trim();
  const filters = [];
  if (search) filters.push(or(like(events.name, `%${search}%`), like(events.venue, `%${search}%`)));
  if (options.status && options.status !== "ALL") filters.push(eq(events.status, options.status));
  const where = filters.length ? and(...filters) : undefined;
  const rows = await database.select().from(events).where(where).orderBy(desc(events.eventStart), desc(events.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
  const ids = rows.map((row) => row.id);
  const counts = ids.length
    ? await database.select({ eventId: participants.eventId, count: sql<number>`count(*)` }).from(participants).where(inArray(participants.eventId, ids)).groupBy(participants.eventId)
    : [];
  const countMap = new Map(counts.map((row) => [row.eventId, Number(row.count)]));
  return rows.map((event) => ({ event, participantCount: countMap.get(event.id) ?? 0 }));
}

export async function getEventOverview(eventId: string, database: Database = getDb()) {
  const event = await getEvent(eventId, database);
  if (!event) return null;
  const statusCounts = await database.select({ status: participants.status, count: sql<number>`count(*)` }).from(participants).where(eq(participants.eventId, eventId)).groupBy(participants.status);
  const counts = Object.fromEntries(statusCounts.map((row) => [row.status, Number(row.count)]));
  const registered = Object.values(counts).reduce((total, value) => total + value, 0);
  const approved = counts.APPROVED ?? 0;
  const checkedIn = counts.CHECKED_IN ?? 0;
  const accepted = approved + checkedIn;
  return { event, counts, registered, approved, checkedIn, pending: counts.PENDING ?? 0, waitlist: counts.WAITLIST ?? 0, remainingCapacity: event.capacity === null ? null : Math.max(event.capacity - accepted, 0) };
}

function toInsertValues(input: EventInput, createdBy: string) {
  return {
    name: input.name,
    description: input.description || null,
    venue: input.venue || null,
    capacity: input.capacity ?? null,
    banner: input.banner || null,
    registrationStart: input.registrationStart ?? null,
    registrationEnd: input.registrationEnd ?? null,
    eventStart: input.eventStart ?? null,
    eventEnd: input.eventEnd ?? null,
    ticketValidFrom: input.ticketValidFrom ?? null,
    ticketValidUntil: input.ticketValidUntil ?? null,
    status: "DRAFT" as const,
    createdBy,
  };
}

export async function createEvent(input: unknown, createdBy: string, database: Database = getDb()) {
  const parsed = eventInputSchema.parse(input);
  const id = crypto.randomUUID();
  await database.insert(events).values({ id, ...toInsertValues(parsed, createdBy) });
  return getEvent(id, database);
}

export async function updateEvent(eventId: string, input: unknown, database: Database = getDb()) {
  const parsed = eventInputSchema.parse(input);
  await database.update(events).set({
    name: parsed.name,
    description: parsed.description || null,
    venue: parsed.venue || null,
    capacity: parsed.capacity ?? null,
    banner: parsed.banner || null,
    registrationStart: parsed.registrationStart ?? null,
    registrationEnd: parsed.registrationEnd ?? null,
    eventStart: parsed.eventStart ?? null,
    eventEnd: parsed.eventEnd ?? null,
    ticketValidFrom: parsed.ticketValidFrom ?? null,
    ticketValidUntil: parsed.ticketValidUntil ?? null,
  }).where(eq(events.id, eventId));
  return getEvent(eventId, database);
}

export async function publishEvent(eventId: string, database: Database = getDb()) {
  const event = await getEvent(eventId, database);
  if (!event) return { ok: false as const, code: "EVENT_NOT_FOUND", message: "Event not found." };
  if (event.status !== "DRAFT") return { ok: false as const, code: "INVALID_STATUS", message: "Only draft events can be published." };
  const result = validateEventForPublish(event);
  if (!result.success) return { ok: false as const, code: "INVALID_EVENT", message: typeof result.error === "string" ? result.error : result.error.issues[0]?.message ?? "Complete all required event fields." };
  await database.update(events).set({ status: "PUBLISHED" }).where(and(eq(events.id, eventId), eq(events.status, "DRAFT")));
  return { ok: true as const, event: await getEvent(eventId, database) };
}

export async function saveCommittee(eventId: string, committee: unknown, database: Database = getDb()) {
  const parsed = committeeSchema.parse(committee) as CommitteeMember[];
  await database.update(events).set({ committeeJson: parsed }).where(eq(events.id, eventId));
  return parsed;
}

export async function deleteCommitteeMember(eventId: string, index: number, database: Database = getDb()) {
  const event = await getEvent(eventId, database);
  if (!event) return null;
  const committee = committeeSchema.parse(event.committeeJson ?? []);
  committee.splice(index, 1);
  return saveCommittee(eventId, committee, database);
}
