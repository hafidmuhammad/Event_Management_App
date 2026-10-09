import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), send: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/services/email", () => ({ sendTestEmail: mocks.send }));
import { POST } from "./route";

const eventId = "00000000-0000-4000-8000-000000000001";
const templateId = "00000000-0000-4000-8000-000000000002";
function request() { return new Request("http://localhost/api/events/test/email/test", { method: "POST", body: JSON.stringify({ templateId, email: "test@example.local" }), headers: { "content-type": "application/json" } }); }
describe("test email authorization", () => {
  beforeEach(() => { vi.resetAllMocks(); });
  it("requires a session and never sends anonymously", async () => {
    mocks.auth.mockResolvedValue(null);
    const result = await POST(request(), { params: Promise.resolve({ eventId }) });
    expect(result.status).toBe(401);
    expect((await result.json()).error).toContain("Sign in again");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("returns permission denied, not session expired, for a receptionist", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "reception", role: "RECEPTIONIST" } });
    const result = await POST(request(), { params: Promise.resolve({ eventId }) });
    expect(result.status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["ADMIN", "EVENT_MANAGER"])("allows %s and passes the event and actor to the service", async (role) => {
    mocks.auth.mockResolvedValue({ user: { id: "actor", role } });
    mocks.send.mockResolvedValue({ mode: "preview" });
    const result = await POST(request(), { params: Promise.resolve({ eventId }) });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true, mode: "preview" });
    expect(mocks.send).toHaveBeenCalledWith(eventId, templateId, "test@example.local", "actor");
  });
});
