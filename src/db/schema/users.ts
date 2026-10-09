import { mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const userRole = mysqlEnum("role", ["ADMIN", "EVENT_MANAGER", "RECEPTIONIST"]);
export const userStatus = mysqlEnum("status", ["ACTIVE", "INACTIVE"]);

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: varchar("organization_id", { length: 36 }),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRole.notNull().default("RECEPTIONIST"),
    status: userStatus.notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({ emailUnique: uniqueIndex("users_email_unique").on(table.email) }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
