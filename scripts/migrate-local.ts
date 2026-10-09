import "./verify-test-isolation";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

async function main() {
  const targets = [["development", process.env.DATABASE_URL!], ["test", process.env.TEST_DATABASE_URL!]];
  for (const [, url] of targets) {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) throw new Error("Only local databases are authorized.");
  }
  for (const [label, url] of targets) {
    const connection = await mysql.createConnection(url);
    try { await migrate(drizzle(connection), { migrationsFolder: "drizzle" }); console.log(`Applied additive migrations to local ${label} database.`); }
    finally { await connection.end(); }
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
