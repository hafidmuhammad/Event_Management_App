import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone, participantRegistrationSchema, registrationWindowState } from "./participants";

describe("participant registration validation", () => {
  it("normalizes duplicate keys without making them global", () => {
    expect(normalizeEmail("  PERSON@Example.COM ")).toBe("person@example.com");
    expect(normalizePhone("00 62 (812)-123")).toBe("+62812123");
  });

  it("models public registration windows", () => {
    const start = new Date("2026-10-10T09:00:00Z");
    const end = new Date("2026-10-20T09:00:00Z");
    const event = { status: "PUBLISHED", registrationStart: start, registrationEnd: end };
    expect(registrationWindowState(event, new Date("2026-10-09T09:00:00Z"))).toBe("NOT_OPEN");
    expect(registrationWindowState(event, new Date("2026-10-15T09:00:00Z"))).toBe("OPEN");
    expect(registrationWindowState(event, new Date("2026-10-21T09:00:00Z"))).toBe("CLOSED");
    expect(registrationWindowState({ ...event, status: "DRAFT" }, new Date("2026-10-15T09:00:00Z"))).toBe("NOT_PUBLISHED");
  });

  it("requires contact details", () => {
    expect(participantRegistrationSchema.safeParse({ name: "Ari", phone: "", email: "bad" }).success).toBe(false);
  });
});
