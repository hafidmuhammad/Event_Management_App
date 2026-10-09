import "@/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { events, users } from "@/db/schema";
import { createEvent, getEvent, publishEvent, saveCommittee, updateEvent } from "./events";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

describe.skipIf(!testDatabaseUrl).sequential("event MySQL business rules", () => {
  const pool = testDatabaseUrl ? mysql.createPool(testDatabaseUrl) : null;
  const database = pool ? drizzle(pool, { schema, mode: "default" }) : null;
  const createdUserIds: string[] = [];
  const createdEventIds: string[] = [];

  beforeAll(async () => {
    if (!database) return;
    const userId = crypto.randomUUID();
    createdUserIds.push(userId);
    await database.insert(users).values({ id: userId, name: "Phase 2 Event Admin", email: `${userId}@example.local`, passwordHash: "test", role: "ADMIN", status: "ACTIVE" });
  });

  afterAll(async () => {
    if (!database || !pool) return;
    if (createdEventIds.length) await database.delete(events).where(inArray(events.id, createdEventIds));
    if (createdUserIds.length) await database.delete(users).where(inArray(users.id, createdUserIds));
    await pool.end();
  });

  it("creates drafts, publishes valid events, rejects invalid publish, and reloads committee JSON", async () => {
    if (!database) return;
    const userId = createdUserIds[0];
    const valid = { name: "Operations Summit", venue: "Grand Ballroom", capacity: 100, registrationStart: new Date("2026-10-01T09:00:00Z"), registrationEnd: new Date("2026-10-10T09:00:00Z"), eventStart: new Date("2026-10-11T09:00:00Z"), eventEnd: new Date("2026-10-11T17:00:00Z"), ticketValidFrom: new Date("2026-10-11T08:00:00Z"), ticketValidUntil: new Date("2026-10-11T18:00:00Z") };
    const created = await createEvent(valid, userId, database);
    expect(created?.status).toBe("DRAFT");
    if (!created) return;
    createdEventIds.push(created.id);
    const published = await publishEvent(created.id, database);
    expect(published.ok).toBe(true);
    const committee = [{ name: "Andi Saputra", position: "Event Manager", phone: "08123456789", email: "andi@example.com" }];
    await saveCommittee(created.id, committee, database);
    expect((await getEvent(created.id, database))?.committeeJson).toEqual(committee);
    await updateEvent(created.id, { ...valid, name: "Operations Summit Updated" }, database);
    expect((await getEvent(created.id, database))?.name).toBe("Operations Summit Updated");
    await expect(saveCommittee(created.id, [{ name: "", position: "Bad", phone: "", email: "" }], database)).rejects.toThrow();

    const invalid = await createEvent({ name: "Missing schedule", capacity: 10 }, userId, database);
    expect(invalid?.status).toBe("DRAFT");
    if (!invalid) return;
    createdEventIds.push(invalid.id);
    const rejected = await publishEvent(invalid.id, database);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.code).toBe("INVALID_EVENT");
  });
});
