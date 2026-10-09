import "../src/lib/load-env";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

/**
 * Applies pending Drizzle migrations to TEST_DATABASE_URL only. It never
 * touches the development database and never drops or truncates anything.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required to migrate the test database.");

async function run() {
  const pool = mysql.createPool(url!);
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.log("Test database migrations applied.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Test database migration failed.", error);
  process.exitCode = 1;
});
