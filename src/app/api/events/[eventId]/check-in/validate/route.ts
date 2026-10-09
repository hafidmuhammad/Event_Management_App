import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRole } from "@/lib/auth/access";
import { validateTicket } from "@/services/checkins";
export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) { const session = await auth(); if (!hasRole(session, "ADMIN", "EVENT_MANAGER", "RECEPTIONIST")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json().catch(() => null) as { token?: string } | null; if (!body?.token || body.token.length > 255) return NextResponse.json({ state: "INVALID" }); const { eventId } = await params; return NextResponse.json(await validateTicket(eventId, body.token)); }
