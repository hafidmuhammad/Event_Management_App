import { mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { events } from "./events";
import { participants } from "./participants";
import { tickets } from "./tickets";
import { users } from "./users";

export const checkinMethod = mysqlEnum("checkin_method", ["QR", "MANUAL"]);

export const checkins = mysqlTable("checkins", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: varchar("event_id", { length: 36 }).notNull().references(() => events.id, { onDelete: "cascade" }),
  participantId: varchar("participant_id", { length: 36 }).notNull().references(() => participants.id, { onDelete: "cascade" }),
  ticketId: varchar("ticket_id", { length: 36 }).references(() => tickets.id),
  checkinMethod: checkinMethod.notNull(),
  checkedInAt: timestamp("checked_in_at", { mode: "date" }).notNull(),
  checkedInBy: varchar("checked_in_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type Checkin = typeof checkins.$inferSelect;
