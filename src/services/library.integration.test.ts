import "@/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import * as schema from "@/db/schema";
import { contactLists, emailTemplates, events, participants, users } from "@/db/schema";
import { addContacts, contactListEmails, contactsToCsv, getContactList, saveContactList, saveGlobalTemplate, listGlobalTemplates, deleteGlobalTemplate } from "./library";
import { broadcastTemplate, resolveRecipients } from "./email";

const url = process.env.TEST_DATABASE_URL;
process.env.MAIL_TRANSPORT = "preview";

describe.skipIf(!url).sequential("global library rules", () => {
  const pool = url ? mysql.createPool(url) : null;
  const db = pool ? drizzle(pool, { schema, mode: "default" }) : null;
  const ids = { user: crypto.randomUUID(), event: crypto.randomUUID() };
  let listId = "";
  let templateId = "";

  beforeAll(async () => {
    if (!db) return;
    await db.insert(users).values({ id: ids.user, name: "Library Admin", email: `${ids.user}@test.local`, passwordHash: "test", role: "ADMIN", status: "ACTIVE" });
    await db.insert(events).values({ id: ids.event, name: "Library Event", status: "PUBLISHED", createdBy: ids.user });
    await db.insert(participants).values({ id: crypto.randomUUID(), eventId: ids.event, name: "Approved", phone: "0811", email: `approved-${ids.event}@test.local`, status: "APPROVED" });
    listId = await saveContactList({ name: `Partners ${ids.event}`, description: "Shared partners" }, undefined, ids.user, db);
  });

  afterAll(async () => {
    if (!db || !pool) return;
    if (templateId) await deleteGlobalTemplate(templateId, db);
    await db.delete(contactLists).where(eq(contactLists.id, listId));
    await db.delete(emailTemplates).where(eq(emailTemplates.eventId, ids.event));
    await db.delete(participants).where(inArray(participants.eventId, [ids.event]));
    await db.delete(events).where(eq(events.id, ids.event));
    await db.delete(users).where(eq(users.id, ids.user));
    await pool.end();
  });

  it("imports contacts once and exports them as CSV", async () => {
    if (!db) return;
    const first = await addContacts(listId, { contacts: [{ name: "Ayu", email: `ayu-${ids.event}@test.local`, company: "Dryport" }, { name: "Budi", email: `budi-${ids.event}@test.local`, company: null }] }, db);
    expect(first).toEqual({ added: 2, skipped: 0 });
    const repeat = await addContacts(listId, { contacts: [{ name: "Ayu again", email: `ayu-${ids.event}@test.local`, company: null }] }, db);
    expect(repeat).toEqual({ added: 0, skipped: 1 });
    const list = await getContactList(listId, db);
    expect(list?.contacts).toHaveLength(2);
    expect(contactsToCsv(list!.contacts)).toContain(`"ayu-${ids.event}@test.local"`);
    expect(await contactListEmails([listId], db)).toHaveLength(2);
  });

  it("adds global contact lists to the event audience without replacing the segment", async () => {
    if (!db) return;
    const result = await resolveRecipients(ids.event, { to: { type: "APPROVED", emails: [], contactListIds: [listId] }, cc: [], bcc: [] }, db);
    expect(result.to).toContain(`approved-${ids.event}@test.local`);
    expect(result.to).toContain(`ayu-${ids.event}@test.local`);
    expect(result.to).toHaveLength(3);
  });

  it("delivers to contact-list recipients that have no participant record", async () => {
    if (!db) return;
    const id = crypto.randomUUID();
    await db.insert(emailTemplates).values({ id, eventId: ids.event, name: "Contacts broadcast", type: "CUSTOM", subject: "Hi {{event.name}}", recipientJson: { to: { type: "CUSTOM", emails: [], contactListIds: [listId] }, cc: [], bcc: [], ccContactListIds: [], bccContactListIds: [] }, contentJson: { version: 1, blocks: [{ id: "p", type: "paragraph", data: { text: "Hello {{participant.email}}", align: "left" } }] } });
    const result = await broadcastTemplate(ids.event, id, db);
    expect(result).toMatchObject({ requested: 2, sent: 2, failed: 0 });
  });

  it("stores global templates without an event scope or recipients", async () => {
    if (!db) return;
    const saved = await saveGlobalTemplate({ name: `Blueprint ${ids.event}`, description: "", type: "CUSTOM", subject: "Welcome {{participant.name}}", content: { version: 1, blocks: [] } }, undefined, ids.user, db);
    expect(saved).not.toBeNull();
    templateId = saved!.id;
    expect(Object.keys(saved!)).not.toContain("eventId");
    expect(Object.keys(saved!)).not.toContain("recipientJson");
    const all = await listGlobalTemplates(db);
    expect(all.some((row) => row.id === templateId)).toBe(true);
  });
});
