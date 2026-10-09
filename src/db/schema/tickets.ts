import { mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { events } from "./events";
import { participants } from "./participants";

export const ticketStatus = mysqlEnum("status", ["ACTIVE", "USED", "EXPIRED", "REVOKED"]);

export const tickets = mysqlTable(
  "tickets",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
    participantId: varchar("participant_id", { length: 36 }).notNull().references(() => participants.id, { onDelete: "cascade" }),
    ticketNumber: varchar("ticket_number", { length: 120 }).notNull(),
    qrToken: varchar("qr_token", { length: 255 }).notNull(),
    status: ticketStatus.notNull().default("ACTIVE"),
    validFrom: timestamp("valid_from", { mode: "date" }).notNull(),
    validUntil: timestamp("valid_until", { mode: "date" }).notNull(),
    issuedAt: timestamp("issued_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    ticketNumberUnique: uniqueIndex("tickets_ticket_number_unique").on(table.ticketNumber),
    qrTokenUnique: uniqueIndex("tickets_qr_token_unique").on(table.qrToken),
  }),
);

export type Ticket = typeof tickets.$inferSelect;
