import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasAuthenticatedSession } from "./access";

export type AppRole = "ADMIN" | "EVENT_MANAGER" | "RECEPTIONIST";
export type AppSession = { user?: { id?: string; name?: string | null; email?: string | null; role?: AppRole } };

export async function requireAuth(getSession: () => Promise<AppSession | null> = auth): Promise<AppSession & { user: { id: string; role: AppRole } }> {
  const session = await getSession();
  if (!hasAuthenticatedSession(session)) redirect("/login");
  return session as AppSession & { user: { id: string; role: AppRole } };
}

export async function requireRole(...roles: AppRole[]): Promise<AppSession & { user: { id: string; role: AppRole } }> {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) redirect("/dashboard");
  return session;
}
