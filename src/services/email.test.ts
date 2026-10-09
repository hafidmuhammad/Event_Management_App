import { afterEach, describe, expect, it, vi } from "vitest";
import { contentSchema, recipientSchema } from "@/lib/validation/email";
const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: "office365-message-id" });
  return { sendMailMock, createTransportMock: vi.fn(() => ({ sendMail: sendMailMock })) };
});
vi.mock("nodemailer", () => ({ default: { createTransport: createTransportMock } }));
import { renderEmail, renderEmailAsync, resolveTemplateVariables, sendMail } from "./email";
import { isEmailDraft } from "@/lib/email-delivery";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  sendMailMock.mockResolvedValue({ messageId: "office365-message-id" });
});

describe("email contracts and renderer", () => {
  it("blocks explicit and legacy drafts without blocking reviewed templates", () => {
    expect(isEmailDraft({ name: "Invitation", contentJson: { deliveryStatus: "DRAFT" } })).toBe(true);
    expect(isEmailDraft({ name: "[DRAFT] Demo", contentJson: { deliveryStatus: "READY" } })).toBe(true);
    expect(isEmailDraft({ name: "Invitation", contentJson: { deliveryStatus: "READY" } })).toBe(false);
  });
  it("rejects unsafe protocols after resolving a variable", () => {
    const content = contentSchema.parse({ version: 1, blocks: [{ id: "button", type: "button", data: { text: "Open", url: "{{ticket.url}}" } }] });
    expect(() => renderEmail(content, { "ticket.url": "javascript:alert(1)" })).toThrow("absolute HTTP or HTTPS");
  });
  it("renders local ticket paths as absolute links", () => {
    vi.stubEnv("APP_URL", "https://events.example.com");
    const content = contentSchema.parse({ version: 1, blocks: [{ id: "button", type: "button", data: { text: "Open", url: "{{ticket.url}}" } }] });
    expect(renderEmail(content, { "ticket.url": "/t/token" })).toContain('href="https://events.example.com/t/token"');
  });
  it("accepts uploaded email assets and renders absolute image URLs", () => {
    vi.stubEnv("APP_URL", "https://events.example.com");
    const content = contentSchema.parse({ version: 1, blocks: [{ id: "image", type: "image", data: { src: "/uploads/email/abc-123.png", alt: "Logo", width: 200 } }] });
    expect(renderEmail(content, {})).toContain('src="https://events.example.com/uploads/email/abc-123.png"');
    expect(() => contentSchema.parse({ version: 1, blocks: [{ id: "image", type: "image", data: { src: "javascript:alert(1)", alt: "Logo", width: 200 } }] })).toThrow();
  });
  it("renders QR from the original value and requested size", async () => {
    const content = contentSchema.parse({ version: 1, blocks: [{ id: "qr", type: "qr", data: { value: "{{ticket.url}}", size: 240 } }] });
    const html = await renderEmailAsync(content, { "ticket.url": "https://events.example.com/t/x?a=1&b=2" });
    expect(html).toContain('width="240"');
    expect(html).toContain("data:image/png;base64,");
    expect(html).not.toContain("data-qr-id");
  });
  it("normalizes custom recipients and deduplicates addresses", () => { const value = recipientSchema.parse({ to: { type: "CUSTOM", emails: [" A@EXAMPLE.COM ", "a@example.com"] }, cc: [], bcc: [] }); expect(value.to.emails).toEqual(["a@example.com"]); });
  it("validates supported blocks and escapes variables", () => { const content = contentSchema.parse({ version: 1, blocks: [{ id: "x", type: "paragraph", data: { text: "Hi {{participant.name}}" , align: "left" } }, { id: "b", type: "button", data: { text: "Open", url: "{{ticket.url}}", align: "center" } }] }); const html = renderEmail(content, { "participant.name": "<script>alert(1)</script>", "ticket.url": "https://example.com/ticket" }); expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>alert"); expect(html).toContain("https://example.com/ticket"); });
  it("rejects unsafe button protocols", () => { expect(() => contentSchema.parse({ version: 1, blocks: [{ id: "b", type: "button", data: { text: "bad", url: "javascript:alert(1)", align: "left" } }] })).toThrow(); });
  it("resolves variables in personalized subjects", () => { expect(resolveTemplateVariables("Welcome {{participant.name}} to {{event.name}}", { "participant.name": "Ada", "event.name": "Summit" })).toBe("Welcome Ada to Summit"); });
  it("supports the customer registration link variable", () => { const content = contentSchema.parse({ version: 1, blocks: [{ id: "b", type: "button", data: { text: "Register", url: "{{event.registration_url}}", align: "center" } }] }); expect(renderEmail(content, { "event.registration_url": "http://localhost:3000/events/demo/register" })).toContain("http://localhost:3000/events/demo/register"); });
  it("sends HTML mail through the configured Office 365 STARTTLS transport", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "smtp");
    vi.stubEnv("SMTP_PROTOCOL", "smtp");
    vi.stubEnv("SMTP_HOST", "smtp.office365.com");
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_USER", "mailer@example.com");
    vi.stubEnv("SMTP_PASS", "test-password");
    vi.stubEnv("SMTP_CRYPTO", "tls");
    vi.stubEnv("SMTP_CHARSET", "utf-8");
    vi.stubEnv("SMTP_MAILTYPE", "html");
    const result = await sendMail({ to: "recipient@example.com", cc: [], bcc: [], subject: "Hello", html: "<p>Hi</p>" });
    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.office365.com", port: 587, secure: false, requireTLS: true }));
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ from: "mailer@example.com", to: "recipient@example.com", html: { content: "<p>Hi</p>", contentType: "text/html; charset=utf-8" } }));
    expect(result).toEqual({ ok: true, mode: "smtp", messageId: "office365-message-id" });
  });
  it("rejects incomplete SMTP settings instead of silently saving a preview", async () => {
    vi.stubEnv("MAIL_TRANSPORT", "smtp");
    await expect(sendMail({ to: "recipient@example.com", cc: [], bcc: [], subject: "Hello", html: "<p>Hi</p>" })).rejects.toThrow("SMTP configuration is incomplete");
    expect(createTransportMock).not.toHaveBeenCalled();
  });
});
