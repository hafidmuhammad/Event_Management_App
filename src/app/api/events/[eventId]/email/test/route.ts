import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { hasAuthenticatedSession, hasRole } from "@/lib/auth/access";
import { sendTestEmail } from "@/services/email";
const input = z.object({ templateId: z.string().uuid(), email: z.string().email() });
export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!hasAuthenticatedSession(session)) return NextResponse.json({ error: "Your session has expired. Sign in again before sending a test email." }, { status: 401 });
  if (!hasRole(session, "ADMIN", "EVENT_MANAGER")) return NextResponse.json({ error: "Only an Admin or Event Manager can send test emails." }, { status: 403 });
  const body = input.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Valid template and test email are required" }, { status: 400 });
  const { eventId } = await params;
  try {
    const result = await sendTestEmail(eventId, body.data.templateId, body.data.email.toLowerCase(), session.user.id);
    return NextResponse.json({ ok: true, mode: result.mode });
  } catch { return NextResponse.json({ error: "Test email failed. Check the template and mail transport settings." }, { status: 503 }); }
}
