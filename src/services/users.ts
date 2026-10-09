import { eq } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { users, type User } from "@/db/schema/users";
import { profileSchema } from "@/lib/validation/profile";

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function findUserById(id: string, database: Database = getDb()): Promise<User | undefined> {
  const [row] = await database.select().from(users).where(eq(users.id, id)).limit(1);
  return row;
}

/**
 * Changes the display name of one user. Only the name is writable here: email,
 * role and status are managed elsewhere, so a profile form can never escalate access.
 */
export async function updateUserName(id: string, name: unknown, database: Database = getDb()): Promise<User | undefined> {
  const parsed = profileSchema.parse({ name });
  await database.update(users).set({ name: parsed.name }).where(eq(users.id, id));
  return findUserById(id, database);
}
