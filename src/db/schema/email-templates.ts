import { json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { events } from "./events";

export const emailTemplates = mysqlTable("email_templates", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 80 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  recipientJson: json("recipient_json").$type<Record<string, unknown>>().notNull(),
  contentJson: json("content_json").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
