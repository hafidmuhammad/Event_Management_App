import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { events } from "./events";

export const activityLogs = mysqlTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id", { length: 36 }),
  action: varchar("action", { length: 80 }).notNull(),
  summary: varchar("summary", { length: 500 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [index("activity_event_time_idx").on(table.eventId, table.createdAt)]);

export const emailBroadcasts = mysqlTable("email_broadcasts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
  templateName: varchar("template_name", { length: 160 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  transport: varchar("transport", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("RUNNING"),
  requested: int("requested").notNull().default(0),
  sent: int("sent").notNull().default(0),
  failed: int("failed").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [index("broadcast_event_time_idx").on(table.eventId, table.createdAt)]);

export const emailDeliveries = mysqlTable("email_deliveries", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
  broadcastId: varchar("broadcast_id", { length: 36 }).references(() => emailBroadcasts.id, { onDelete: "cascade" }),
  recipient: varchar("recipient", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  transport: varchar("transport", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [index("delivery_event_status_idx").on(table.eventId, table.status)]);
