import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { verifyPassword } from "./password";

export type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "ADMIN" | "EVENT_MANAGER" | "RECEPTIONIST";
  status: "ACTIVE" | "INACTIVE";
};

export type AuthenticatedUser = Pick<AuthUserRecord, "id" | "name" | "email" | "role">;
export type FindUser = (email: string) => Promise<AuthUserRecord | undefined>;

export async function authenticateCredentials(input: LoginInput, findUser: FindUser): Promise<AuthenticatedUser | null> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;

  const user = await findUser(parsed.data.email.toLowerCase());
  if (!user || user.status !== "ACTIVE") return null;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
