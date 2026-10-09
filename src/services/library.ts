import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { contactLists, contacts, globalEmailTemplates } from "@/db/schema";
import { getDb, type Database } from "@/db";
import { contactBulkSchema, contactListInputSchema, globalTemplateInputSchema } from "@/lib/validation/library";

/* ---------------------------------------------------------------- templates */

export async function listGlobalTemplates(database: Database = getDb()) {
  return database.select().from(globalEmailTemplates).orderBy(desc(globalEmailTemplates.updatedAt));
}

export async function getGlobalTemplate(id: string, database: Database = getDb()) {
  const [row] = await database.select().from(globalEmailTemplates).where(eq(globalEmailTemplates.id, id)).limit(1);
  return row ?? null;
}

export async function saveGlobalTemplate(input: unknown, id?: string, createdBy?: string, database: Database = getDb()) {
  const parsed = globalTemplateInputSchema.parse(input);
  const values = { name: parsed.name, description: parsed.description, type: parsed.type, subject: parsed.subject, contentJson: parsed.content };
  if (id) {
    await database.update(globalEmailTemplates).set(values).where(eq(globalEmailTemplates.id, id));
    return getGlobalTemplate(id, database);
  }
  const newId = crypto.randomUUID();
  await database.insert(globalEmailTemplates).values({ id: newId, createdBy: createdBy ?? null, ...values });
  return getGlobalTemplate(newId, database);
}

export async function deleteGlobalTemplate(id: string, database: Database = getDb()) {
  await database.delete(globalEmailTemplates).where(eq(globalEmailTemplates.id, id));
}

/* ------------------------------------------------------------------ contacts */

export async function listContactLists(database: Database = getDb()) {
  const lists = await database.select().from(contactLists).orderBy(asc(contactLists.name));
  if (!lists.length) return [] as (typeof lists[number] & { contactCount: number })[];
  const totals = await database
    .select({ listId: contacts.listId, total: count() })
    .from(contacts)
    .where(inArray(contacts.listId, lists.map((list) => list.id)))
    .groupBy(contacts.listId);
  const byList = new Map(totals.map((row) => [row.listId, Number(row.total)]));
  return lists.map((list) => ({ ...list, contactCount: byList.get(list.id) ?? 0 }));
}

export async function getContactList(id: string, database: Database = getDb()) {
  const [list] = await database.select().from(contactLists).where(eq(contactLists.id, id)).limit(1);
  if (!list) return null;
  const members = await database.select().from(contacts).where(eq(contacts.listId, id)).orderBy(asc(contacts.name));
  return { ...list, contacts: members };
}

export async function saveContactList(input: unknown, id?: string, createdBy?: string, database: Database = getDb()) {
  const parsed = contactListInputSchema.parse(input);
  if (id) {
    await database.update(contactLists).set({ name: parsed.name, description: parsed.description }).where(eq(contactLists.id, id));
    return id;
  }
  const newId = crypto.randomUUID();
  await database.insert(contactLists).values({ id: newId, name: parsed.name, description: parsed.description, createdBy: createdBy ?? null });
  return newId;
}

export async function deleteContactList(id: string, database: Database = getDb()) {
  await database.delete(contactLists).where(eq(contactLists.id, id));
}

/** Adds contacts, skipping addresses already present in the list. */
export async function addContacts(listId: string, input: unknown, database: Database = getDb()) {
  const parsed = contactBulkSchema.parse(input);
  const existing = await database.select({ email: contacts.email }).from(contacts).where(eq(contacts.listId, listId));
  const known = new Set(existing.map((row) => row.email));
  const rows = parsed.contacts.filter((contact) => !known.has(contact.email));
  if (rows.length) {
    await database.insert(contacts).values(rows.map((contact) => ({ id: crypto.randomUUID(), listId, name: contact.name, email: contact.email, company: contact.company })));
  }
  return { added: rows.length, skipped: parsed.contacts.length - rows.length };
}

export async function deleteContact(listId: string, contactId: string, database: Database = getDb()) {
  await database.delete(contacts).where(and(eq(contacts.listId, listId), eq(contacts.id, contactId)));
}

/** Resolves de-duplicated lowercase addresses for the given global contact lists. */
export async function contactListEmails(listIds: string[], database: Database = getDb()) {
  if (!listIds.length) return [] as string[];
  const rows = await database.select({ email: contacts.email }).from(contacts).where(inArray(contacts.listId, listIds));
  return [...new Set(rows.map((row) => row.email.trim().toLowerCase()).filter(Boolean))];
}

/** Builds a CSV export for a contact list. Values are quoted and escaped. */
export function contactsToCsv(rows: { name: string; email: string; company: string | null }[]) {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return ["Name,Email,Company", ...rows.map((row) => [row.name, row.email, row.company ?? ""].map(cell).join(","))].join("\r\n");
}
