import { mysqlEnum, mysqlTable, timestamp, varchar, text, int, json, index } from "drizzle-orm/mysql-core";
import { users } from "./users";

export type CommitteeMember = { name: string; position: string; phone: string; email: string; division?: string };
export type DoorprizeWinner = { participantId: string; drawnAt: string };
export type DoorprizePrize = { id: string; name: string; category: string; quantity: number; image?: string; winners: DoorprizeWinner[] };
export type DoorprizeConfig = { version: 1; settings: { eligibleStatus: "CHECKED_IN"; allowMultipleWin: boolean }; prizes: DoorprizePrize[] };
export type AwardItem = { id: string; name: string; participantId: string | null; recipientName: string; subtitle?: string; image?: string; displayOrder: number };
export type AwardConfig = { version: 1; items: AwardItem[] };

export const eventStatus = mysqlEnum("status", ["DRAFT", "PUBLISHED", "ONGOING", "FINISHED", "CANCELLED"]);

export const events = mysqlTable(
  "events",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: varchar("organization_id", { length: 36 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    venue: varchar("venue", { length: 255 }),
    capacity: int("capacity"),
    registrationStart: timestamp("registration_start", { mode: "date" }),
    registrationEnd: timestamp("registration_end", { mode: "date" }),
    eventStart: timestamp("event_start", { mode: "date" }),
    eventEnd: timestamp("event_end", { mode: "date" }),
    ticketValidFrom: timestamp("ticket_valid_from", { mode: "date" }),
    ticketValidUntil: timestamp("ticket_valid_until", { mode: "date" }),
    committeeJson: json("committee_json").$type<CommitteeMember[] | null>(),
    doorprizeJson: json("doorprize_json").$type<DoorprizeConfig | null>(),
    awardJson: json("award_json").$type<AwardConfig | null>(),
    banner: varchar("banner", { length: 500 }),
    status: eventStatus.notNull().default("DRAFT"),
    createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({ createdByIndex: index("events_created_by_idx").on(table.createdBy) }),
);

export type Event = typeof events.$inferSelect;
