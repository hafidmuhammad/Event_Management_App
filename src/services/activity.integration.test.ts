import "@/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { events, users } from "@/db/schema";
import { listActivity, listBroadcasts, listDeliveries, recordActivity } from "./activity";
import { broadcastTemplate, saveEmailTemplate } from "./email";

const { deliver } = vi.hoisted(() => ({ deliver: vi.fn().mockResolvedValue({ messageId: "test-only" }) }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: deliver }) } }));
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url).sequential("persistent activity and broadcast reporting", () => {
  const pool = url ? mysql.createPool(url) : null;
  const db = pool ? drizzle(pool, { schema, mode: "default" }) : null;
  const userId = crypto.randomUUID(), eventA = crypto.randomUUID(), eventB = crypto.randomUUID();
  beforeAll(async () => {
    if (!db) return;
    await db.insert(users).values({ id: userId, name: "Audit test", email: `${userId}@test.local`, passwordHash: "test", role: "ADMIN", status: "ACTIVE" });
    await db.insert(events).values([{ id: eventA, name: "Audit A", createdBy: userId }, { id: eventB, name: "Audit B", createdBy: userId }]);
    for (const [key, value] of Object.entries({ MAIL_TRANSPORT: "smtp", SMTP_PROTOCOL: "smtp", SMTP_HOST: "test.invalid", SMTP_PORT: "587", SMTP_USER: "test@example.local", SMTP_PASS: "test-only", SMTP_CRYPTO: "tls", SMTP_CHARSET: "utf-8", SMTP_MAILTYPE: "html" })) vi.stubEnv(key, value);
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    if (!db || !pool) return;
    await db.delete(events).where(inArray(events.id, [eventA, eventB]));
    await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  });
  it("persists audit entries without crossing event boundaries", async () => {
    if (!db) return;
    await recordActivity(eventA, "SETTINGS_UPDATED", "Settings saved.", userId, db);
    expect((await listActivity(eventA, db))[0]).toMatchObject({ actorId: userId, action: "SETTINGS_UPDATED" });
    expect(await listActivity(eventB, db)).toEqual([]);
  });
  it("records individual success and failure and protects drafts", async () => {
    if (!db) return;
    const template = await saveEmailTemplate(eventA, { name: "Report test", type: "CUSTOM", subject: "Welcome {{event.name}}", recipient: { to: { type: "CUSTOM", emails: ["one@example.local", "two@example.local"] }, cc: [], bcc: [] }, content: { version: 1, deliveryStatus: "READY", blocks: [{ id: "p", type: "paragraph", data: { text: "Hello" } }] } }, undefined, db);
    deliver.mockResolvedValueOnce({ messageId: "test-one" }).mockRejectedValueOnce(new Error("test delivery failure"));
    const result = await broadcastTemplate(eventA, template!.id, db, userId);
    expect(result).toMatchObject({ requested: 2, sent: 1, failed: 1 });
    expect((await listBroadcasts(eventA, db))[0]).toMatchObject({ status: "PARTIAL", sent: 1, failed: 1 });
    expect((await listDeliveries(eventA, db)).map((row) => row.status).sort()).toEqual(["FAILED", "SENT"]);
    expect(await listBroadcasts(eventB, db)).toEqual([]);
    expect(await listDeliveries(eventB, db)).toEqual([]);
    await saveEmailTemplate(eventA, { name: "Draft", type: "CUSTOM", subject: "Draft", recipient: template!.recipientJson, content: { version: 1, deliveryStatus: "DRAFT", blocks: [] } }, template!.id, db);
    expect((await broadcastTemplate(eventA, template!.id, db)).requested).toBe(0);
    expect(await listBroadcasts(eventA, db)).toHaveLength(1);
  });
});
