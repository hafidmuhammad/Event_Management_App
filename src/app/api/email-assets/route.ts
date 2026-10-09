import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { hasRole } from "@/lib/auth/access";
const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
export async function POST(request: Request) { const session = await auth(); if (!hasRole(session, "ADMIN", "EVENT_MANAGER")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: "Image file required" }, { status: 400 }); const ext = allowed.get(file.type); if (!ext) return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed" }, { status: 400 }); if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 }); const folder = path.join(process.cwd(), "public", "uploads", "email"); await mkdir(folder, { recursive: true }); const name = `${randomUUID()}.${ext}`; await writeFile(path.join(folder, name), Buffer.from(await file.arrayBuffer())); return NextResponse.json({ url: `/uploads/email/${name}` }); }
