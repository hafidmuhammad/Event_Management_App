import "../src/lib/load-env";
import { closeDb } from "../src/db";
import { runDueSchedules } from "../src/services/email-schedules";

/**
 * Sends every scheduled reminder that is due, then exits.
 * Run it every few minutes: `pnpm reminders:run` (Windows Task Scheduler or cron).
 */
async function main() {
  const summary = await runDueSchedules();
  console.log(`[reminders] ${new Date().toISOString()} checked=${summary.checked} sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped} waiting=${summary.waiting}`);
}

main()
  .catch((error) => { console.error("[reminders] run failed:", error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(async () => { await closeDb(); });
