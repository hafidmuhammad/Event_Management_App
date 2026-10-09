import "@/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { checkins, events, participants, tickets, users } from "@/db/schema";
import { approveParticipant } from "./participants";
import { confirmCheckIn, validateTicket } from "./checkins";

const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url).sequential("ticket and check-in MySQL rules", () => {
  const pool = url ? mysql.createPool(url) : null;
  const db = pool ? drizzle(pool, { schema, mode: "default" }) : null;
  const ids = { user: crypto.randomUUID(), event: crypto.randomUUID(), participant: crypto.randomUUID() };
  beforeAll(async () => { if (!db) return; const now = new Date(); await db.insert(users).values({ id: ids.user, name: "Ticket Admin", email: `${ids.user}@test.local`, passwordHash: "test", role: "ADMIN", status: "ACTIVE" }); await db.insert(events).values({ id: ids.event, name: "Ticket event", status: "PUBLISHED", ticketValidFrom: new Date(now.getTime() - 60_000), ticketValidUntil: new Date(now.getTime() + 60_000), createdBy: ids.user }); await db.insert(participants).values({ id: ids.participant, eventId: ids.event, name: "Ticket Person", company: "Acme", phone: "081200", email: `${ids.participant}@test.local`, status: "PENDING" }); });
  afterAll(async () => { if (!db || !pool) return; await db.delete(checkins).where(eq(checkins.eventId, ids.event)); await db.delete(tickets).where(eq(tickets.eventId, ids.event)); await db.delete(participants).where(eq(participants.eventId, ids.event)); await db.delete(events).where(eq(events.id, ids.event)); await db.delete(users).where(eq(users.id, ids.user)); await pool.end(); });
  it("issues one secure ticket and permits exactly one scoped QR check-in", async () => { if (!db) return; expect((await approveParticipant(ids.event, ids.participant, ids.user, db)).ok).toBe(true); const [ticket] = await db.select().from(tickets).where(eq(tickets.participantId, ids.participant)); expect(ticket.status).toBe("ACTIVE"); expect(ticket.qrToken).not.toContain(ids.participant); expect((await validateTicket(ids.event, ticket.qrToken, db)).state).toBe("VALID"); expect((await validateTicket(crypto.randomUUID(), ticket.qrToken, db)).state).toBe("WRONG_EVENT"); const [first, second] = await Promise.all([confirmCheckIn(ids.event, ticket.qrToken, ids.user, "QR", db), confirmCheckIn(ids.event, ticket.qrToken, ids.user, "QR", db)]); expect([first.state, second.state].sort()).toEqual(["ALREADY_CHECKED_IN", "VALID"]); const rows = await db.select().from(checkins).where(eq(checkins.participantId, ids.participant)); expect(rows).toHaveLength(1); });
});
