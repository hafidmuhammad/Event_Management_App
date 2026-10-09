import { describe, expect, it } from "vitest";
import { routeFeedback } from "./feedback";

describe("process feedback", () => {
  it("turns server action redirects into success and error notifications", () => {
    expect(routeFeedback(new URLSearchParams("notice=Template%20saved&error=Delivery%20failed"))).toEqual([{ message: "Template saved", tone: "success" }, { message: "Delivery failed", tone: "error" }]);
  });
  it("ignores empty feedback and never treats a search query as a notification", () => {
    expect(routeFeedback(new URLSearchParams("notice=%20&search=participant&status=PENDING"))).toEqual([]);
  });
});
