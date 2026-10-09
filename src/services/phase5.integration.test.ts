import "@/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import * as schema from "@/db/schema";
import { emailTemplates, events, participants, users } from "@/db/schema";
import { addAward, getAwards, reorderAwards } from "./awards";
import { drawPrize, getDoorprizeCandidates, getDoorprizeEligibleCount, saveDoorprize } from "./doorprize";

const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url).sequential("Phase 5 doorprize and award rules", () => {
  const pool = url ? mysql.createPool(url) : null;
  const db = pool ? drizzle(pool, { schema, mode: "default" }) : null;
  const ids = { user: crypto.randomUUID(), eventA: crypto.randomUUID(), eventB: crypto.randomUUID(), participantA: crypto.randomUUID(), participantB: crypto.randomUUID(), participantOther: crypto.randomUUID() };
  beforeAll(async () => { if (!db) return; await db.insert(users).values({ id: ids.user, name: "Phase 5 Admin", email: `${ids.user}@test.local`, passwordHash: "test", role: "ADMIN", status: "ACTIVE" }); await db.insert(events).values([{ id: ids.eventA, name: "Phase 5 A", status: "PUBLISHED", createdBy: ids.user }, { id: ids.eventB, name: "Phase 5 B", status: "PUBLISHED", createdBy: ids.user }]); await db.insert(participants).values([{ id: ids.participantA, eventId: ids.eventA, name: "Checked In A", phone: "0851", email: `${ids.participantA}@test.local`, status: "CHECKED_IN" }, { id: ids.participantB, eventId: ids.eventA, name: "Checked In B", phone: "0852", email: `${ids.participantB}@test.local`, status: "CHECKED_IN" }, { id: ids.participantOther, eventId: ids.eventB, name: "Other Event", phone: "0853", email: `${ids.participantOther}@test.local`, status: "CHECKED_IN" }]); });
  afterAll(async () => { if (!db || !pool) return; await db.delete(emailTemplates).where(inArray(emailTemplates.eventId, [ids.eventA, ids.eventB])); await db.delete(participants).where(inArray(participants.eventId, [ids.eventA, ids.eventB])); await db.delete(events).where(inArray(events.id, [ids.eventA, ids.eventB])); await db.delete(users).where(eq(users.id, ids.user)); await pool.end(); });
  it("draws only checked-in participants and prevents duplicate winners", async () => { if (!db) return; const prizeId = crypto.randomUUID(); await saveDoorprize(ids.eventA, { version: 1, settings: { eligibleStatus: "CHECKED_IN", allowMultipleWin: false }, prizes: [{ id: prizeId, name: "Demo Prize", quantity: 2, winners: [] }] }, db); const first = await drawPrize(ids.eventA, prizeId, db); expect(first.ok).toBe(true); if (!first.ok) return; expect([ids.participantA, ids.participantB]).toContain(first.winner.participantId); const second = await drawPrize(ids.eventA, prizeId, db); expect(second.ok).toBe(true); if (!second.ok) return; expect(second.winner.participantId).not.toBe(first.winner.participantId); });
  it("keeps concurrent draws within prize quantity", async () => { if (!db) return; const prizeId = crypto.randomUUID(); await saveDoorprize(ids.eventA, { version: 1, settings: { eligibleStatus: "CHECKED_IN", allowMultipleWin: false }, prizes: [{ id: prizeId, name: "Concurrent Prize", quantity: 1, winners: [] }] }, db); const results = await Promise.all([drawPrize(ids.eventA, prizeId, db), drawPrize(ids.eventA, prizeId, db)]); expect(results.filter((result) => result.ok)).toHaveLength(1); const stored = await db.select({ doorprizeJson: events.doorprizeJson }).from(events).where(eq(events.id, ids.eventA)).limit(1); const prize = stored[0]?.doorprizeJson?.prizes.find((item) => item.id === prizeId); expect(prize?.winners).toHaveLength(1); });
  it("rejects an award participant from another event", async () => { if (!db) return; await expect(addAward(ids.eventA, { name: "Wrong event", recipientName: "Other", participantId: ids.participantOther }, db)).rejects.toThrow("must belong to this event"); });
  it("reviews only eligible event-scoped candidates without contact fields", async () => {
    if (!db) return;
    const config = { version: 1 as const, settings: { eligibleStatus: "CHECKED_IN" as const, allowMultipleWin: false }, prizes: [] };
    const candidates = await getDoorprizeCandidates(ids.eventB, config, db);
    expect(candidates.map((row) => row.id)).toEqual([ids.participantOther]);
    expect(Object.keys(candidates[0]).sort()).toEqual(["company", "id", "name"]);
    expect(await getDoorprizeEligibleCount(ids.eventB, config, db)).toBe(1);
  });
  it("saves external awards and reorders event-scoped items", async () => { if (!db) return; const first = await addAward(ids.eventA, { name: "External award", recipientName: "Partner Org", participantId: null, subtitle: "Partner", image: "/uploads/awards/demo.webp" }, db); expect(first.ok).toBe(true); if (!first.ok) return; const second = await addAward(ids.eventA, { name: "Participant award", recipientName: "Checked In A", participantId: ids.participantA }, db); expect(second.ok).toBe(true); if (!second.ok) return; const saved = await getAwards(ids.eventA, db); expect(saved?.awards.items).toHaveLength(2); const reordered = await reorderAwards(ids.eventA, [second.item.id, first.item.id], db); expect(reordered.ok).toBe(true); const reloaded = await getAwards(ids.eventA, db); expect(reloaded?.awards.items[0]?.id).toBe(second.item.id); });
  it("returns no eligible state without checked-in participants", async () => { if (!db) return; const prizeId = crypto.randomUUID(); const eventId = crypto.randomUUID(); await db.insert(events).values({ id: eventId, name: "No eligible", status: "PUBLISHED", createdBy: ids.user }); await saveDoorprize(eventId, { version: 1, settings: { eligibleStatus: "CHECKED_IN", allowMultipleWin: false }, prizes: [{ id: prizeId, name: "Empty", quantity: 1, winners: [] }] }, db); const result = await drawPrize(eventId, prizeId, db); expect(result).toMatchObject({ ok: false, code: "NO_ELIGIBLE_PARTICIPANT" }); await db.delete(events).where(eq(events.id, eventId)); });
});
