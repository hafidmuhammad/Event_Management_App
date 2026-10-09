import { describe, expect, it } from "vitest";
import { renderRichList, renderRichText, richRunSchema } from "./email-rich-text";
describe("safe rich text email", () => {
  it("escapes variables while retaining structured formatting", () => {
    const html = renderRichText([{ text: "{{name}}", bold: true, italic: true, url: "https://example.com/register" }], (value) => value.replace("{{name}}", "<script>"));
    expect(html).toBe('<a href="https://example.com/register"><em><strong>&lt;script&gt;</strong></em></a>');
  });
  it("rejects unsafe inline links", () => {
    expect(richRunSchema.safeParse({ text: "Open", url: "javascript:alert(1)" }).success).toBe(false);
  });
  it("keeps multi-line list formatting balanced", () => {
    expect(renderRichList([{ text: "One\nTwo", bold: true }], (value) => value, "bullet")).toBe('<ul style="padding-left:24px"><li><strong>One</strong></li><li><strong>Two</strong></li></ul>');
  });
});
