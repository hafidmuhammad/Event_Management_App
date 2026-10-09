import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

type Database = MySql2Database<typeof schema>;
let database: Database | undefined;
let pool: mysql.Pool | undefined;

export function getDb(): Database {
  if (database) return database;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required to use the database.");

  pool = mysql.createPool(databaseUrl);
  database = drizzle(pool, { schema, mode: "default" });
  return database;
}

export async function closeDb() {
  await pool?.end();
  pool = undefined;
  database = undefined;
}

export type { Database };
