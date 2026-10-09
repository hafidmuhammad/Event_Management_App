import "@/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { users, events, participants, tickets, checkins } from "@/db/schema";
import { approveParticipant, getParticipantForEvent, registerParticipant, rejectParticipant, waitlistParticipant } from "./participants";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const shouldRun = Boolean(testDatabaseUrl);

describe.skipIf(!shouldRun).sequential("participant MySQL business rules", () => {
  const pool = testDatabaseUrl ? mysql.createPool(testDatabaseUrl) : null;
  const database = pool ? drizzle(pool, { schema, mode: "default" }) : null;
  const createdUserIds: string[] = [];
  const createdEventIds: string[] = [];

  beforeAll(async () => {
    if (!database) return;
    const userId = crypto.randomUUID();
    createdUserIds.push(userId);
    await database.insert(users).values({ id: userId, name: "Phase 2 Test Admin", email: `${userId}@example.local`, passwordHash: "test", role: "ADMIN", status: "ACTIVE" });
  });

  afterAll(async () => {
    if (!database || !pool) return;
    if (createdEventIds.length) await database.delete(checkins).where(inArray(checkins.eventId, createdEventIds));
    if (createdEventIds.length) await database.delete(tickets).where(inArray(tickets.eventId, createdEventIds));
    if (createdEventIds.length) await database.delete(participants).where(inArray(participants.eventId, createdEventIds));
    if (createdEventIds.length) await database.delete(events).where(inArray(events.id, createdEventIds));
    if (createdUserIds.length) await database.delete(users).where(inArray(users.id, createdUserIds));
    await pool.end();
  });

  it("registers pending, blocks a duplicate in one event, and permits another event", async () => {
    if (!database) return;
    const userId = createdUserIds[0];
    const firstEvent = crypto.randomUUID();
    const secondEvent = crypto.randomUUID();
    createdEventIds.push(firstEvent, secondEvent);
    const open = { status: "PUBLISHED" as const, registrationStart: new Date("2026-01-01T00:00:00Z"), registrationEnd: new Date("2026-12-31T23:59:00Z") };
    await database.insert(events).values([{ id: firstEvent, name: "Registration A", capacity: 10, ...open, createdBy: userId }, { id: secondEvent, name: "Registration B", capacity: 10, ...open, createdBy: userId }]);
    const input = { name: "Person One", company: "Acme", jobTitle: "Guest", phone: "0812 000", email: " PERSON@EXAMPLE.COM " };
    const first = await registerParticipant(firstEvent, input, new Date("2026-10-07T10:00:00Z"), database);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.participant.status).toBe("PENDING");
    const duplicate = await registerParticipant(firstEvent, input, new Date("2026-10-07T10:00:00Z"), database);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.code).toBe("DUPLICATE_REGISTRATION");
    expect((await registerParticipant(secondEvent, input, new Date("2026-10-07T10:00:00Z"), database)).ok).toBe(true);
  });

  it("enforces public registration states and participant lifecycle transitions", async () => {
    if (!database) return;
    const userId = createdUserIds[0];
    const eventIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    createdEventIds.push(...eventIds);
    const now = new Date("2026-10-07T10:00:00Z");
    await database.insert(events).values([
      { id: eventIds[0], name: "Not open", status: "PUBLISHED", registrationStart: new Date("2026-10-08T00:00:00Z"), registrationEnd: new Date("2026-10-09T00:00:00Z"), createdBy: userId },
      { id: eventIds[1], name: "Closed", status: "PUBLISHED", registrationStart: new Date("2026-10-01T00:00:00Z"), registrationEnd: new Date("2026-10-06T00:00:00Z"), createdBy: userId },
      { id: eventIds[2], name: "Draft", status: "DRAFT", createdBy: userId },
      { id: eventIds[3], name: "Cancelled", status: "CANCELLED", createdBy: userId },
    ]);
    const input = { name: "Lifecycle Person", phone: "0812999", email: `lifecycle-${eventIds[0]}@example.local` };
    const notOpen = await registerParticipant(eventIds[0], input, now, database);
    const closed = await registerParticipant(eventIds[1], { ...input, email: `closed-${eventIds[1]}@example.local` }, now, database);
    const draft = await registerParticipant(eventIds[2], { ...input, email: `draft-${eventIds[2]}@example.local` }, now, database);
    const cancelled = await registerParticipant(eventIds[3], { ...input, email: `cancelled-${eventIds[3]}@example.local` }, now, database);
    expect([notOpen, closed, draft, cancelled].map((result) => result.ok ? "OK" : result.code)).toEqual(["REGISTRATION_NOT_OPEN", "REGISTRATION_CLOSED", "EVENT_NOT_PUBLISHED", "EVENT_CANCELLED"]);

    const lifecycleEvent = crypto.randomUUID();
    createdEventIds.push(lifecycleEvent);
    await database.insert(events).values({ id: lifecycleEvent, name: "Lifecycle", capacity: 1, status: "PUBLISHED", registrationStart: new Date("2026-10-01T00:00:00Z"), registrationEnd: new Date("2026-10-10T00:00:00Z"), ticketValidFrom: new Date("2026-10-01T00:00:00Z"), ticketValidUntil: new Date("2026-10-10T00:00:00Z"), createdBy: userId });
    const ids = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    await database.insert(participants).values(ids.map((id, index) => ({ id, eventId: lifecycleEvent, name: `Lifecycle ${index}`, phone: `081277${index}`, email: `lifecycle-${id}@example.local`, status: "PENDING" as const, registeredAt: now })));
    expect((await waitlistParticipant(lifecycleEvent, ids[0], database)).ok).toBe(true);
    const rejected = await rejectParticipant(lifecycleEvent, ids[1], { rejectionReason: "Not eligible" }, database);
    expect(rejected.ok).toBe(true);
    if (rejected.ok) expect(rejected.participant.rejectionReason).toBe("Not eligible");
    expect((await approveParticipant(lifecycleEvent, ids[2], userId, database)).ok).toBe(true);
    expect((await approveParticipant(lifecycleEvent, ids[0], userId, database)).ok).toBe(false);
  });

  it("locks capacity so concurrent approvals cannot exceed one", async () => {
    if (!database) return;
    const userId = createdUserIds[0];
    const eventId = crypto.randomUUID();
    createdEventIds.push(eventId);
    await database.insert(events).values({ id: eventId, name: "Capacity A", capacity: 1, status: "PUBLISHED", registrationStart: new Date("2026-01-01"), registrationEnd: new Date("2026-12-31"), ticketValidFrom: new Date("2026-01-01"), ticketValidUntil: new Date("2026-12-31"), createdBy: userId });
    const participantIds = [crypto.randomUUID(), crypto.randomUUID()];
    await database.insert(participants).values(participantIds.map((id, index) => ({ id, eventId, name: `Pending ${index}`, phone: `0812${index}`, email: `pending-${id}@example.local`, status: "PENDING" as const, registeredAt: new Date() })));
    const [first, second] = await Promise.all(participantIds.map((participantId) => approveParticipant(eventId, participantId, userId, database)));
    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    const approved = await database.select({ id: participants.id }).from(participants).where(and(eq(participants.eventId, eventId), eq(participants.status, "APPROVED")));
    expect(approved).toHaveLength(1);
  });

  it("rejects cross-event participant access", async () => {
    if (!database) return;
    const userId = createdUserIds[0];
    const eventA = crypto.randomUUID();
    const eventB = crypto.randomUUID();
    createdEventIds.push(eventA, eventB);
    await database.insert(events).values([{ id: eventA, name: "Isolation A", status: "PUBLISHED", createdBy: userId }, { id: eventB, name: "Isolation B", status: "PUBLISHED", createdBy: userId }]);
    const participantId = crypto.randomUUID();
    await database.insert(participants).values({ id: participantId, eventId: eventB, name: "Scoped Person", phone: "0899", email: `${participantId}@example.local`, status: "PENDING", registeredAt: new Date() });
    expect(await getParticipantForEvent(eventA, participantId, database)).toBeNull();
    const result = await approveParticipant(eventA, participantId, userId, database);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("PARTICIPANT_NOT_FOUND");
  });
});
