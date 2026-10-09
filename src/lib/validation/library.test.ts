import { describe, expect, it } from "vitest";
import { parseContactRows } from "./library";

describe("parseContactRows", () => {
  it("accepts name/email/company rows and bare addresses", () => {
    const { valid, invalid } = parseContactRows("Name, Email, Company\nAyu Lestari, ayu@example.com, Dryport\nbudi@example.com\n");
    expect(invalid).toEqual([]);
    expect(valid).toEqual([
      { name: "Ayu Lestari", email: "ayu@example.com", company: "Dryport" },
      { name: "budi", email: "budi@example.com", company: null },
    ]);
  });

  it("deduplicates addresses and reports rows without a valid email", () => {
    const { valid, invalid } = parseContactRows("ayu@example.com\nAYU@example.com\nnot-an-email\n");
    expect(valid).toHaveLength(1);
    expect(invalid).toEqual(["not-an-email"]);
  });
});
