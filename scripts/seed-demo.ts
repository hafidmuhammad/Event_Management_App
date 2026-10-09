import "../src/lib/load-env";
import { and, eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import { emailTemplates, events, participants, users } from "@/db/schema";

if (process.env.NODE_ENV === "production") throw new Error("Demo seed is disabled in production.");

const demoEventId = "00000000-0000-4000-8000-000000000001";
const demoParticipantIds = [
  "00000000-0000-4000-8000-000000000011",
  "00000000-0000-4000-8000-000000000012",
  "00000000-0000-4000-8000-000000000013",
];
const demoTemplateIds = [
  "00000000-0000-4000-8000-000000000101",
  "00000000-0000-4000-8000-000000000102",
  "00000000-0000-4000-8000-000000000103",
  "00000000-0000-4000-8000-000000000104",
];

const start = new Date("2026-11-18T09:00:00.000Z");
const end = new Date("2026-11-18T17:00:00.000Z");
const registrationStart = new Date("2026-10-01T00:00:00.000Z");
const registrationEnd = new Date("2026-11-17T23:59:59.000Z");
const demoCommittee = [
  { name: "Alya Rahma", position: "Event Director", phone: "", email: "" },
  { name: "Bima Pratama", position: "Program & Content Lead", phone: "", email: "" },
  { name: "Citra Lestari", position: "Operations Manager", phone: "", email: "" },
  { name: "Dion Wijaya", position: "Guest Experience Lead", phone: "", email: "" },
  { name: "Eka Saputra", position: "Registration & Check-in", phone: "", email: "" },
  { name: "Farah Nabila", position: "Partnerships & Sponsorship", phone: "", email: "" },
  { name: "Gilang Mahesa", position: "Production & Stage", phone: "", email: "" },
  { name: "Hana Putri", position: "Creative & Visual", phone: "", email: "" },
  { name: "Iqbal Ramadhan", position: "Logistics & Venue", phone: "", email: "" },
  { name: "Jihan Anindita", position: "Documentation & Media", phone: "", email: "" },
];

const paragraph = (id: string, text: string) => ({ id, type: "paragraph", data: { text, align: "left" } });
const heading = (id: string, text: string) => ({ id, type: "heading", data: { text, level: 2, align: "left" } });

async function seedDemo() {
  const db = getDb();
  const [admin] = await db.select().from(users).where(eq(users.email, "admin@example.local")).limit(1);
  if (!admin) throw new Error("Run npm run db:seed first so admin@example.local exists.");

  await db.insert(events).values({
    id: demoEventId,
    name: "[DRAFT] Product Summit 2026",
    description: "Dummy event for reviewing the event, participant, ticket, and email management flows.",
    venue: "Jakarta Convention Center",
    capacity: 250,
    registrationStart,
    registrationEnd,
    eventStart: start,
    eventEnd: end,
    ticketValidFrom: start,
    ticketValidUntil: end,
    committeeJson: demoCommittee,
    doorprizeJson: { version: 1, settings: { eligibleStatus: "CHECKED_IN", allowMultipleWin: false }, prizes: [{ id: "demo-prize-01", name: "Demo Gift Card", category: "Grand Prize", quantity: 1, winners: [] }] },
    awardJson: { version: 1, items: [{ id: "demo-award-01", name: "Demo Innovation Award", participantId: null, recipientName: "Demo Organization", subtitle: "Draft display item", displayOrder: 1 }] },
    status: "DRAFT",
    createdBy: admin.id,
  }).onDuplicateKeyUpdate({
    set: { name: "[DRAFT] Product Summit 2026", description: "Dummy event for reviewing the event, participant, ticket, and email management flows.", venue: "Jakarta Convention Center", capacity: 250, registrationStart, registrationEnd, eventStart: start, eventEnd: end, ticketValidFrom: start, ticketValidUntil: end, committeeJson: demoCommittee, doorprizeJson: { version: 1, settings: { eligibleStatus: "CHECKED_IN", allowMultipleWin: false }, prizes: [{ id: "demo-prize-01", name: "Demo Gift Card", category: "Grand Prize", quantity: 1, winners: [] }] }, awardJson: { version: 1, items: [{ id: "demo-award-01", name: "Demo Innovation Award", participantId: null, recipientName: "Demo Organization", subtitle: "Draft display item", displayOrder: 1 }] }, status: "DRAFT" },
  });

  const demoParticipants = [
    { id: demoParticipantIds[0], eventId: demoEventId, title: "Ms", name: "Nadia Pratama", company: "Northstar Labs", jobTitle: "Product Manager", phone: "0800000001", email: "nadia.demo@example.local", participantType: "GENERAL", status: "PENDING" as const, registeredAt: new Date("2026-10-12T08:00:00.000Z") },
    { id: demoParticipantIds[1], eventId: demoEventId, title: "Mr", name: "Bima Santoso", company: "Atlas Works", jobTitle: "Operations Lead", phone: "0800000002", email: "bima.demo@example.local", participantType: "VIP", status: "WAITLIST" as const, registeredAt: new Date("2026-10-13T08:30:00.000Z") },
    { id: demoParticipantIds[2], eventId: demoEventId, title: "Dr", name: "Sari Wijaya", company: "Meridian Group", jobTitle: "Director", phone: "0800000003", email: "sari.demo@example.local", participantType: "SPEAKER", status: "PENDING" as const, registeredAt: new Date("2026-10-14T09:15:00.000Z") },
  ];
  for (const participant of demoParticipants) {
    await db.insert(participants).values(participant).onDuplicateKeyUpdate({ set: { name: participant.name, company: participant.company, jobTitle: participant.jobTitle, phone: participant.phone, email: participant.email, participantType: participant.participantType, status: participant.status, registeredAt: participant.registeredAt } });
  }

  const templates = [
    { id: demoTemplateIds[0], name: "[DRAFT] Registration received", type: "REGISTRATION_RECEIVED", subject: "We received your registration for {{event.name}}", recipientJson: { to: { type: "PENDING", emails: [] }, cc: [], bcc: [] }, contentJson: { version: 1, blocks: [heading("registration-heading", "Registration received"), paragraph("registration-copy", "Hi {{participant.name}}, we received your registration for {{event.name}}. The event team will review it shortly.")] } },
    { id: demoTemplateIds[1], name: "[DRAFT] Approval and ticket", type: "TICKET", subject: "Your ticket for {{event.name}}", recipientJson: { to: { type: "APPROVED", emails: [] }, cc: [], bcc: [] }, contentJson: { version: 1, blocks: [heading("ticket-heading", "Your ticket is ready"), paragraph("ticket-copy", "Hi {{participant.name}}, your ticket number is {{ticket.ticket_number}}."), { id: "ticket-button", type: "button", data: { text: "View ticket", url: "{{ticket.url}}", align: "center" } }, { id: "ticket-qr", type: "qr", data: { value: "{{ticket.url}}", size: 180 } }] } },
    { id: demoTemplateIds[2], name: "[DRAFT] Rejection notice", type: "REJECTED", subject: "Update on your {{event.name}} registration", recipientJson: { to: { type: "CUSTOM", emails: ["reviewer.demo@example.local"] }, cc: [], bcc: [] }, contentJson: { version: 1, blocks: [heading("rejected-heading", "Registration update"), paragraph("rejected-copy", "This is a draft rejection message for {{participant.name}}. Do not send before approval.")] } },
    { id: demoTemplateIds[3], name: "[DRAFT] Event announcement", type: "CUSTOM", subject: "Save the date: {{event.name}}", recipientJson: { to: { type: "CUSTOM", emails: ["preview.demo@example.local"] }, cc: ["cc.demo@example.local"], bcc: ["bcc.demo@example.local"] }, contentJson: { version: 1, blocks: [heading("announcement-heading", "Save the date"), paragraph("announcement-copy", "{{event.name}} takes place at {{event.venue}} on {{event.event_start}}."), { id: "announcement-divider", type: "divider", data: {} }, { id: "announcement-spacer", type: "spacer", data: { height: 24 } }] } },
  ];
  for (const template of templates) {
    await db.insert(emailTemplates).values({ eventId: demoEventId, ...template }).onDuplicateKeyUpdate({ set: { name: template.name, type: template.type, subject: template.subject, recipientJson: template.recipientJson, contentJson: template.contentJson } });
  }

  const [storedEvent] = await db.select({ id: events.id }).from(events).where(eq(events.id, demoEventId)).limit(1);
  const storedTemplates = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(and(eq(emailTemplates.eventId, demoEventId)));
  console.log(`Seeded demo event ${storedEvent?.id ?? demoEventId} with ${demoParticipants.length} draft participants, ${storedTemplates.length} draft email templates, ${demoCommittee.length} committee members, 1 draft prize, and 1 draft award.`);
  console.log("No email was sent, previewed, broadcast, or shared.");
}

seedDemo().catch((error) => { console.error("Demo seed failed.", error); process.exitCode = 1; }).finally(closeDb);
