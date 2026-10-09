import "../src/lib/load-env";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { contactLists, contacts, globalEmailTemplates, users } from "@/db/schema";

if (process.env.NODE_ENV === "production") throw new Error("Library demo seed is disabled in production.");
const developmentUrl = process.env.DATABASE_URL;
if (!developmentUrl) throw new Error("DATABASE_URL is required.");
const database = new URL(developmentUrl);
if (!/^(localhost|127\.0\.0\.1|::1)$/i.test(database.hostname)) {
  throw new Error("Library demo seed only runs against a local development database.");
}
if (process.env.TEST_DATABASE_URL && new URL(process.env.TEST_DATABASE_URL).pathname === database.pathname) {
  throw new Error("Development and test databases must be different.");
}

const templateData = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    name: "[DUMMY] Participant welcome",
    description: "Reusable registration welcome blueprint. Review and adapt before applying to an event.",
    type: "REGISTRATION_RECEIVED",
    subject: "Welcome to {{event.name}}",
    contentJson: { version: 1, deliveryStatus: "DRAFT", blocks: [
      { id: "dummy-welcome-heading", type: "heading", data: { text: "Welcome aboard", level: 1, align: "left" } },
      { id: "dummy-welcome-copy", type: "paragraph", data: { text: "Hello {{participant.name}}, thanks for your interest in {{event.name}}. We are glad you will be joining us." } },
      { id: "dummy-welcome-details", type: "table", data: { rows: [["Event", "{{event.name}}"], ["Venue", "{{event.venue}}"]] } },
      { id: "dummy-welcome-divider", type: "divider", data: {} },
      { id: "dummy-welcome-footer", type: "paragraph", data: { text: "This is a draft blueprint. Confirm event details before use." } },
    ] },
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    name: "[DUMMY] Event invitation",
    description: "Reusable invitation blueprint with a registration link placeholder. Never sends from the library.",
    type: "INVITATION",
    subject: "You are invited: {{event.name}}",
    contentJson: { version: 1, deliveryStatus: "DRAFT", blocks: [
      { id: "dummy-invite-heading", type: "heading", data: { text: "Save your place", level: 1, align: "center" } },
      { id: "dummy-invite-copy", type: "paragraph", data: { text: "Hello {{participant.name}}, we would love to see you at {{event.name}}. Take a moment to review the event and register." } },
      { id: "dummy-invite-button", type: "button", data: { text: "View registration", url: "{{event.registration_url}}", align: "center" } },
      { id: "dummy-invite-spacer", type: "spacer", data: { height: 16 } },
      { id: "dummy-invite-footer", type: "paragraph", data: { text: "Please verify the date, venue, and registration link before using this draft." } },
    ] },
  },
];

const listData = [
  {
    id: "00000000-0000-4000-8000-000000000211",
    name: "[DUMMY] Speakers and guests",
    description: "Sample speaker and guest contacts for testing Library import and event recipient selection.",
    contacts: [
      { name: "Alya Sample", email: "alya.speaker@example.local", company: "Northstar Demo" },
      { name: "Bima Sample", email: "bima.speaker@example.local", company: "Atlas Demo" },
      { name: "Citra Sample", email: "citra.guest@example.local", company: "Meridian Demo" },
      { name: "Dion Sample", email: "dion.guest@example.local", company: "Harbor Demo" },
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000212",
    name: "[DUMMY] Partners and sponsors",
    description: "Sample partner contacts. All addresses use the reserved local demo domain.",
    contacts: [
      { name: "Eka Sample", email: "eka.partner@example.local", company: "Summit Demo" },
      { name: "Farah Sample", email: "farah.partner@example.local", company: "Bluepeak Demo" },
      { name: "Gilang Sample", email: "gilang.sponsor@example.local", company: "Evergreen Demo" },
      { name: "Hana Sample", email: "hana.sponsor@example.local", company: "Cedar Demo" },
    ],
  },
];

async function seedLibraryDemo() {
  const db = getDb();
  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, "admin@example.local")).limit(1);
  if (!admin) throw new Error("Run npm.cmd run db:seed first so admin@example.local exists.");

  let templatesAdded = 0;
  for (const template of templateData) {
    const [existing] = await db.select({ id: globalEmailTemplates.id }).from(globalEmailTemplates).where(eq(globalEmailTemplates.id, template.id)).limit(1);
    if (existing) continue;
    await db.insert(globalEmailTemplates).values({ ...template, createdBy: admin.id });
    templatesAdded++;
  }

  let listsAdded = 0;
  let contactsAdded = 0;
  for (const list of listData) {
    const [existing] = await db.select({ id: contactLists.id }).from(contactLists).where(eq(contactLists.id, list.id)).limit(1);
    if (!existing) {
      await db.insert(contactLists).values({ id: list.id, name: list.name, description: list.description, createdBy: admin.id });
      listsAdded++;
    }
    for (const contact of list.contacts) {
      const [duplicate] = await db.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.listId, list.id), eq(contacts.email, contact.email))).limit(1);
      if (duplicate) continue;
      await db.insert(contacts).values({ ...contact, listId: list.id });
      contactsAdded++;
    }
  }

  console.log(`Library demo seed complete: ${templatesAdded} templates, ${listsAdded} contact lists, ${contactsAdded} contacts added.`);
  console.log("Existing Library items were preserved. No email was sent or shared.");
}

seedLibraryDemo().catch((error) => { console.error("Library demo seed failed.", error); process.exitCode = 1; }).finally(closeDb);
