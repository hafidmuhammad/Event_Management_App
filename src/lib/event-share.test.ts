import { describe, expect, it } from "vitest";
import { decryptEventId, encryptEventId } from "./event-share";

describe("event share tokens", () => {
  it("encrypts and decrypts an event id without exposing the id", () => {
    const eventId = "00000000-0000-4000-8000-000000000001";
    const token = encryptEventId(eventId);
    expect(token).not.toContain(eventId);
    expect(decryptEventId(token)).toBe(eventId);
  });

  it("rejects tampered tokens", () => {
    const token = encryptEventId("event-1");
    const tampered = `${token.startsWith("a") ? "b" : "a"}${token.slice(1)}`;
    expect(decryptEventId(tampered)).toBeNull();
  });
});
