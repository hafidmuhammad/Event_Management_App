import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRole } from "@/lib/auth/access";
import { searchCheckInParticipants } from "@/services/checkins";
export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) { const session = await auth(); if (!hasRole(session, "ADMIN", "EVENT_MANAGER", "RECEPTIONIST")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const { eventId } = await params; const query = new URL(request.url).searchParams.get("q") ?? ""; return NextResponse.json(await searchCheckInParticipants(eventId, query)); }
