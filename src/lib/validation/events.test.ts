import { describe, expect, it } from "vitest";
import { committeeSchema, eventInputSchema, validateEventForPublish } from "./events";

const valid = {
  name: "Operations Summit",
  capacity: 100,
  registrationStart: "2026-10-01T09:00",
  registrationEnd: "2026-10-10T09:00",
  eventStart: "2026-10-11T09:00",
  eventEnd: "2026-10-11T17:00",
  ticketValidFrom: "2026-10-11T08:00",
  ticketValidUntil: "2026-10-11T18:00",
};

describe("event validation", () => {
  it("rejects invalid registration, event, and ticket ranges", () => {
    const result = eventInputSchema.safeParse({ ...valid, registrationEnd: "2026-09-01T09:00", eventEnd: "2026-10-10T09:00", ticketValidUntil: "2026-10-10T09:00" });
    expect(result.success).toBe(false);
    expect(result.success ? [] : result.error.issues.map((issue) => issue.path.join("."))).toEqual(expect.arrayContaining(["registrationEnd", "eventEnd", "ticketValidUntil"]));
  });

  it("requires all schedule windows before publish", () => {
    const result = validateEventForPublish({ name: "Draft", capacity: 10, registrationStart: null, registrationEnd: null, eventStart: null, eventEnd: null, ticketValidFrom: null, ticketValidUntil: null });
    expect(result.success).toBe(false);
  });

  it("accepts and validates the committee JSON contract", () => {
    expect(committeeSchema.parse([{ name: "Andi Saputra", position: "Event Manager", phone: "0812", email: "andi@example.com" }])).toHaveLength(1);
    expect(committeeSchema.safeParse([{ name: "", position: "Event Manager", phone: "", email: "" }]).success).toBe(false);
  });
});
