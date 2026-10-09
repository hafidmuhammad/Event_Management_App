import { index, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { events } from "./events";
import { users } from "./users";

export const participantStatus = mysqlEnum("status", [
  "INVITED", "PENDING", "WAITLIST", "APPROVED", "REJECTED", "CANCELLED", "CHECKED_IN", "NO_SHOW",
]);

export const participants = mysqlTable(
  "participants",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 32 }),
    name: varchar("name", { length: 160 }).notNull(),
    company: varchar("company", { length: 160 }),
    jobTitle: varchar("job_title", { length: 160 }),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    participantType: varchar("participant_type", { length: 80 }),
    status: participantStatus.notNull().default("PENDING"),
    registeredAt: timestamp("registered_at", { mode: "date" }),
    approvedAt: timestamp("approved_at", { mode: "date" }),
    approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id),
    rejectedAt: timestamp("rejected_at", { mode: "date" }),
    rejectionReason: varchar("rejection_reason", { length: 500 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    eventIndex: index("participants_event_idx").on(table.eventId),
    statusIndex: index("participants_status_idx").on(table.status),
    emailIndex: index("participants_email_idx").on(table.email),
    phoneIndex: index("participants_phone_idx").on(table.phone),
    eventEmailUnique: uniqueIndex("participants_event_email_unique").on(table.eventId, table.email),
    eventPhoneUnique: uniqueIndex("participants_event_phone_unique").on(table.eventId, table.phone),
  }),
);

export type Participant = typeof participants.$inferSelect;
