import "../src/lib/load-env";
import mysql from "mysql2/promise";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required for migration verification.");

const expectedTables = ["users", "events", "participants", "tickets", "checkins", "email_templates", "activity_logs", "email_broadcasts", "email_deliveries", "global_email_templates", "contact_lists", "contacts"];
async function verifyMigration() {
  const connection = await mysql.createConnection(url);
  try {
    const [rows] = await connection.query<Record<string, string>[]>("SHOW TABLES");
    const tables = new Set(rows.map((row) => Object.values(row)[0]));
    const missing = expectedTables.filter((table) => !tables.has(table));
    if (missing.length) throw new Error(`Missing domain tables: ${missing.join(", ")}`);

    const [indexes] = await connection.query<{ Key_name: string }[]>("SHOW INDEX FROM participants");
    const indexNames = new Set(indexes.map((index) => index.Key_name));
    for (const name of ["participants_event_idx", "participants_status_idx", "participants_email_idx", "participants_phone_idx"]) {
      if (!indexNames.has(name)) throw new Error(`Missing participant index: ${name}`);
    }

    const [uniqueRows] = await connection.query<{ TABLE_NAME: string; COLUMN_NAME: string }[]>(
      "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND NON_UNIQUE = 0",
    );
    const uniqueColumns = new Set(uniqueRows.map((row) => `${row.TABLE_NAME}.${row.COLUMN_NAME}`));
    for (const column of ["users.email", "tickets.ticket_number", "tickets.qr_token", "participants.email", "participants.phone"]) {
      if (!uniqueColumns.has(column)) throw new Error(`Missing unique constraint: ${column}`);
    }

    const [jsonRows] = await connection.query<{ TABLE_NAME: string; COLUMN_NAME: string }[]>(
      "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'json'",
    );
    const jsonColumns = new Set(jsonRows.map((row) => `${row.TABLE_NAME}.${row.COLUMN_NAME}`));
    for (const column of ["events.committee_json", "events.doorprize_json", "events.award_json", "email_templates.recipient_json", "email_templates.content_json", "global_email_templates.content_json"]) {
      if (!jsonColumns.has(column)) throw new Error(`Missing JSON column: ${column}`);
    }

    const [foreignKeys] = await connection.query<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL",
    );
    if (Number(foreignKeys[0]?.count ?? 0) < 14) throw new Error("Expected domain foreign keys are incomplete.");
    console.log(`Verified ${expectedTables.length} domain tables, ${foreignKeys[0].count} foreign keys, 5 unique keys, 5 JSON columns, and participant indexes in TEST_DATABASE_URL.`);
  } finally {
    await connection.end();
  }
}

verifyMigration().catch((error) => {
  console.error("Migration verification failed.", error);
  process.exitCode = 1;
});
