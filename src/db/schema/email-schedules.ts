import { index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { emailTemplates } from "./email-templates";
import { events } from "./events";

/**
 * Scheduled reminder: send one event email template a fixed number of minutes
 * before the event starts. The send time is never stored; it is always
 * `events.event_start - offset_minutes`, so moving the event moves its reminders.
 *
 * Status: PENDING -> RUNNING -> SENT | FAILED. A reminder can also end as
 * SKIPPED (the event was cancelled, finished, or already started).
 * RUNNING that never finishes means the process stopped mid-send: check the
 * delivery report before sending again, to avoid duplicate emails.
 */
export const emailSchedules = mysqlTable("email_schedules", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
  templateId: varchar("template_id", { length: 36 }).notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
  offsetMinutes: int("offset_minutes").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("PENDING"),
  broadcastId: varchar("broadcast_id", { length: 36 }),
  lastError: varchar("last_error", { length: 500 }),
  startedAt: timestamp("started_at", { mode: "date" }),
  finishedAt: timestamp("finished_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("email_schedules_event_idx").on(table.eventId),
  index("email_schedules_status_idx").on(table.status),
]);

export type EmailSchedule = typeof emailSchedules.$inferSelect;
