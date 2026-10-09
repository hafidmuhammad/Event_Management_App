import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runDueSchedules } from "@/services/email-schedules";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null;
  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7) : "");
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Sends every reminder that is due. Call it every few minutes from a scheduler
 * (Windows Task Scheduler, cron, or a hosting cron job) with
 * `Authorization: Bearer <CRON_SECRET>`. Without `CRON_SECRET` the endpoint is off.
 */
async function handle(request: Request) {
  const allowed = authorized(request);
  if (allowed === null) return NextResponse.json({ error: "CRON_SECRET is not configured on the server." }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...await runDueSchedules() });
  } catch {
    return NextResponse.json({ error: "Reminder run failed. Check the server log." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
