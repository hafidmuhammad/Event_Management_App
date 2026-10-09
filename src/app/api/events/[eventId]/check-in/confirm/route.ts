import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRole } from "@/lib/auth/access";
import { confirmCheckIn, manualCheckIn } from "@/services/checkins";
export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) { const session = await auth(); if (!hasRole(session, "ADMIN", "EVENT_MANAGER", "RECEPTIONIST")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const actorId = (session as { user: { id: string } }).user.id; const body = await request.json().catch(() => null) as { token?: string; participantId?: string } | null; const { eventId } = await params; const result = body?.participantId ? await manualCheckIn(eventId, body.participantId, actorId) : body?.token ? await confirmCheckIn(eventId, body.token, actorId) : { state: "INVALID" as const }; return NextResponse.json(result); }
