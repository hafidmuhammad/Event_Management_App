import "../lib/load-env";
import { closeDb, getDb } from "@/db";
import { users } from "@/db/schema/users";
import { hashPassword } from "@/lib/auth/password";

if (process.env.NODE_ENV === "production") throw new Error("Development seed is disabled in production.");

const developmentPassword = "SkylearnDev!2026";

async function seed() {
  const db = getDb();
  const passwordHash = await hashPassword(developmentPassword);
  const accounts = [
    { name: "Ari Admin", email: "admin@example.local", role: "ADMIN" as const },
    { name: "Maya Manager", email: "manager@example.local", role: "EVENT_MANAGER" as const },
    { name: "Raka Reception", email: "reception@example.local", role: "RECEPTIONIST" as const },
  ];

  for (const account of accounts) {
    await db.insert(users).values({ ...account, passwordHash, status: "ACTIVE" }).onDuplicateKeyUpdate({
      set: { name: account.name, passwordHash, role: account.role, status: "ACTIVE" },
    });
  }

  console.log(`Seeded ${accounts.length} development users.`);
}

seed()
  .catch((error) => {
    console.error("Development seed failed.", error);
    process.exitCode = 1;
  })
  .finally(closeDb);
