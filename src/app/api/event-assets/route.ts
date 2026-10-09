import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasRole } from "@/lib/auth/access";

const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
export async function POST(request: Request) {
  const session = await auth();
  if (!hasRole(session, "ADMIN", "EVENT_MANAGER")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const kind = form.get("kind") === "award" ? "awards" : form.get("kind") === "prize" ? "prizes" : null;
  if (!(file instanceof File) || !kind) return NextResponse.json({ error: "Image file and asset kind are required" }, { status: 400 });
  const extension = allowed.get(file.type);
  if (!extension) return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 });
  const folder = path.join(process.cwd(), "public", "uploads", kind);
  await mkdir(folder, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(folder, filename), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${kind}/${filename}` });
}
