import { describe, expect, it } from "vitest";
import { authenticateCredentials, type AuthUserRecord } from "./authenticate";
import { hashPassword } from "./password";

const activeUser: AuthUserRecord = {
  id: "user-1",
  name: "Ari Admin",
  email: "admin@example.local",
  passwordHash: "",
  role: "ADMIN",
  status: "ACTIVE",
};

describe("authenticateCredentials", () => {
  it("allows a valid active user", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");
    const user = { ...activeUser, passwordHash };
    await expect(authenticateCredentials({ email: user.email, password: "correct horse battery staple" }, async () => user)).resolves.toMatchObject({ id: "user-1", role: "ADMIN" });
  });

  it("rejects an invalid password", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");
    const user = { ...activeUser, passwordHash };
    await expect(authenticateCredentials({ email: user.email, password: "wrong" }, async () => user)).resolves.toBeNull();
  });

  it("rejects an inactive user", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");
    const user = { ...activeUser, passwordHash, status: "INACTIVE" as const };
    await expect(authenticateCredentials({ email: user.email, password: "correct horse battery staple" }, async () => user)).resolves.toBeNull();
  });

  it("rejects invalid login input", async () => {
    await expect(authenticateCredentials({ email: "not-an-email", password: "" }, async () => activeUser)).resolves.toBeNull();
  });
});
