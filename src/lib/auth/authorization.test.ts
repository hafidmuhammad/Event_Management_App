import { describe, expect, it } from "vitest";
import { canManageCommittee, canManageEvents, canManageParticipants, hasAuthenticatedSession, hasRole } from "./access";

describe("dashboard authorization", () => {
  it("denies an unauthenticated dashboard session", () => {
    expect(hasAuthenticatedSession(null)).toBe(false);
    expect(hasRole(null, "ADMIN")).toBe(false);
  });

  it("recognizes an authenticated session and its role", () => {
    const session = { user: { id: "user-1", name: "Ari", email: "ari@example.local", role: "ADMIN" as const } };
    expect(hasAuthenticatedSession(session)).toBe(true);
    expect(hasRole(session, "ADMIN")).toBe(true);
    expect(hasRole(session, "RECEPTIONIST")).toBe(false);
  });

  it("allows only admin and event manager to change Phase 2 operations", () => {
    expect(canManageEvents("ADMIN")).toBe(true);
    expect(canManageEvents("EVENT_MANAGER")).toBe(true);
    expect(canManageParticipants("EVENT_MANAGER")).toBe(true);
    expect(canManageCommittee("ADMIN")).toBe(true);
    expect(canManageEvents("RECEPTIONIST")).toBe(false);
    expect(canManageParticipants("RECEPTIONIST")).toBe(false);
    expect(canManageCommittee("RECEPTIONIST")).toBe(false);
  });
});
