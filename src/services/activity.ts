import { desc, eq, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { activityLogs, emailBroadcasts, emailDeliveries } from "@/db/schema";

export async function recordActivity(eventId: string, action: string, summary: string, actorId: string | null = null, database: Pick<Database, "insert"> = getDb()) {
  await database.insert(activityLogs).values({ eventId, actorId, action, summary: summary.slice(0, 500) });
}
export function listActivity(eventId?: string, database: Database = getDb()) {
  return database.select().from(activityLogs).where(eventId ? eq(activityLogs.eventId, eventId) : undefined).orderBy(desc(activityLogs.createdAt)).limit(20);
}
export function listBroadcasts(eventId: string, database: Database = getDb()) {
  return database.select().from(emailBroadcasts).where(eq(emailBroadcasts.eventId, eventId)).orderBy(desc(emailBroadcasts.createdAt)).limit(20);
}
export function listDeliveries(eventId: string, database: Database = getDb()) {
  return database.select().from(emailDeliveries).where(eq(emailDeliveries.eventId, eventId)).orderBy(desc(emailDeliveries.createdAt)).limit(100);
}
export async function failedEmailCount(database: Database = getDb()) {
  const [row] = await database.select({ count: sql<number>`count(*)` }).from(emailDeliveries).where(eq(emailDeliveries.status, "FAILED"));
  return Number(row?.count ?? 0);
}
