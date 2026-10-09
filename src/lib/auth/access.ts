import type { AppRole, AppSession } from "./authorization";

export function hasAuthenticatedSession(session: AppSession | null | undefined): session is AppSession & { user: { id: string; role: AppRole } } {
  return Boolean(session?.user?.id && session.user.role);
}

export function hasRole(session: AppSession | null | undefined, ...roles: AppRole[]): boolean {
  return hasAuthenticatedSession(session) && roles.includes(session.user.role);
}

export function canManageEvents(role: AppRole) {
  return role === "ADMIN" || role === "EVENT_MANAGER";
}

export function canManageCommittee(role: AppRole) {
  return canManageEvents(role);
}

export function canManageParticipants(role: AppRole) {
  return canManageEvents(role);
}

export function canCheckIn(role: AppRole) { return role === "ADMIN" || role === "EVENT_MANAGER" || role === "RECEPTIONIST"; }
