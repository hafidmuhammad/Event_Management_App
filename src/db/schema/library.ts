import { index, json, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Global (event-independent) email template library. Templates stored here are
 * reusable blueprints: they never carry an event scope and are never broadcast
 * directly. Applying one copies its content into an event-scoped template.
 */
export const globalEmailTemplates = mysqlTable("global_email_templates", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }),
  type: varchar("type", { length: 80 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  contentJson: json("content_json").$type<Record<string, unknown>>().notNull(),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
}, (table) => [index("global_template_name_idx").on(table.name)]);

/** Global contact list (address book) usable by any event. */
export const contactLists = mysqlTable("contact_lists", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
}, (table) => [index("contact_list_name_idx").on(table.name)]);

export const contacts = mysqlTable("contacts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  listId: varchar("list_id", { length: 36 }).notNull().references(() => contactLists.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 160 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [uniqueIndex("contact_list_email_unique").on(table.listId, table.email)]);

export type GlobalEmailTemplate = typeof globalEmailTemplates.$inferSelect;
export type ContactList = typeof contactLists.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
