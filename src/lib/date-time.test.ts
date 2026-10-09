import { describe, expect, it } from "vitest";
import { eventDateInput, formatEventDate, jakartaInput } from "./date-time";
describe("event timezone", () => {
  it("uses explicit WIB independent of the server timezone", () => {
    expect(eventDateInput(new Date("2026-10-08T02:30:00Z"))).toBe("2026-10-08T09:30");
    expect(new Date(jakartaInput("2026-10-08T09:30")).toISOString()).toBe("2026-10-08T02:30:00.000Z");
    expect(formatEventDate("2026-10-08T02:30:00Z")).toContain("09:30 WIB");
  });
});
