import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.QA_BASE_URL ?? "http://localhost:3101";
const eventId = "00000000-0000-4000-8000-000000000001";
const seed = await readFile(new URL("../src/db/seed.ts", import.meta.url), "utf8");
const password = process.env.QA_PASSWORD ?? seed.match(/const developmentPassword = "([^"]+)"/)?.[1];
assert(password, "Provide QA_PASSWORD for the development accounts.");

async function login(email, expectedRole) {
  const cookies = new Map();
  async function call(path, options = {}) {
    const response = await fetch(base + path, { ...options, redirect: "manual", headers: { ...options.headers, cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join("; ") } });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0]; const position = pair.indexOf("=");
      cookies.set(pair.slice(0, position), pair.slice(position + 1));
    }
    return response;
  }
  const csrf = await (await call("/api/auth/csrf")).json();
  await call("/api/auth/callback/credentials", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, callbackUrl: base + "/dashboard" }) });
  const session = await (await call("/api/auth/session")).json();
  assert.equal(session.user?.role, expectedRole, "Development login must have the expected role.");
  return call;
}

const publicPage = await fetch(`${base}/events/${eventId}/register`, { redirect: "manual" });
assert.equal(publicPage.status, 200);
assert.equal(publicPage.headers.get("location"), null);
assert.match(await publicPage.text(), /Public registration/);
console.log("Anonymous registration link: 200, no login redirect");

const receptionist = await login("reception@example.local", "RECEPTIONIST");
const settings = await receptionist(`/events/${eventId}/settings`);
assert.equal(settings.status, 200);
assert.match(await settings.text(), /read-only access/);
console.log("Receptionist Settings: 200, read-only, no Dashboard redirect");
const participants = await receptionist(`/events/${eventId}/participants`);
assert.equal(participants.status, 200);
assert.match(await participants.text(), /Preview registration form/);
console.log("Participants: registration preview button available");
const emailPage = await receptionist(`/events/${eventId}/email`);
assert.equal(emailPage.status, 200);
const html = await emailPage.text();
assert.match(html, /Only an Admin or Event Manager can send test emails/);
assert.doesNotMatch(html, /SendTestForm/);
console.log("Receptionist email preview: no Send Test control");
const endpoint = `/api/events/${eventId}/email/test`;
const denied = await receptionist(endpoint, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
assert.equal(denied.status, 403);
console.log("Receptionist Send Test API: 403");
const anonymous = await fetch(base + endpoint, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
assert.equal(anonymous.status, 401);
console.log("Anonymous Send Test API: 401");
for (const [email, role] of [["admin@example.local", "ADMIN"], ["manager@example.local", "EVENT_MANAGER"]]) {
  const call = await login(email, role);
  const response = await call(endpoint, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
  assert.equal(response.status, 400, "Authorized request must reach input validation, without sending email.");
  const settings = await call(`/events/${eventId}/settings`);
  assert.equal(settings.status, 200);
  assert.match(await settings.text(), /Save settings/);
  console.log(`${role}: Settings editable; Send Test reaches input validation (400)`);
}
