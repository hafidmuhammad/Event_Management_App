import { escapeHtml, resolveTemplateVariables } from "@/lib/email-content";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { emailTemplates, emailBroadcasts, emailDeliveries, events, participants, tickets } from "@/db/schema";
import { getDb, type Database } from "@/db";
import { contentSchema, emailTemplateInputSchema, recipientSchema, type EmailContent, type RecipientConfigInput } from "@/lib/validation/email";
import { isEmailDraft, safeEmailLink } from "@/lib/email-delivery";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { toDataURL } from "qrcode";
import nodemailer from "nodemailer";
import { recordActivity } from "./activity";
import { renderRichList, renderRichText } from "@/lib/email-rich-text";
import { contactListEmails } from "./library";

export async function listEmailTemplates(eventId: string, database: Database = getDb()) { return database.select().from(emailTemplates).where(eq(emailTemplates.eventId, eventId)).orderBy(desc(emailTemplates.updatedAt)); }
export async function getEmailTemplate(eventId: string, id: string, database: Database = getDb()) { const [row] = await database.select().from(emailTemplates).where(and(eq(emailTemplates.eventId, eventId), eq(emailTemplates.id, id))).limit(1); return row ?? null; }
export async function saveEmailTemplate(eventId: string, input: unknown, id?: string, database: Database = getDb()) { const parsed = emailTemplateInputSchema.parse(input); if (id) { await database.update(emailTemplates).set({ name: parsed.name, type: parsed.type, subject: parsed.subject, recipientJson: parsed.recipient, contentJson: parsed.content }).where(and(eq(emailTemplates.id, id), eq(emailTemplates.eventId, eventId))); return getEmailTemplate(eventId, id, database); } const newId = crypto.randomUUID(); await database.insert(emailTemplates).values({ id: newId, eventId, name: parsed.name, type: parsed.type, subject: parsed.subject, recipientJson: parsed.recipient, contentJson: parsed.content }); return getEmailTemplate(eventId, newId, database); }
/**
 * Marks a template Ready or Draft. This only flips `deliveryStatus`: it never sends anything.
 * A legacy "[DRAFT]" name prefix also blocks delivery, so it is removed when marking Ready.
 */
export async function setTemplateDeliveryStatus(eventId: string, id: string, status: "DRAFT" | "READY", database: Database = getDb()) {
  const template = await getEmailTemplate(eventId, id, database);
  if (!template) return null;
  const content = contentSchema.parse(template.contentJson);
  const name = status === "READY" ? template.name.replace(/^\s*\[DRAFT\]\s*/i, "") || template.name : template.name;
  await database.update(emailTemplates).set({ name, contentJson: { ...content, deliveryStatus: status } }).where(and(eq(emailTemplates.id, id), eq(emailTemplates.eventId, eventId)));
  return getEmailTemplate(eventId, id, database);
}export async function resolveRecipients(eventId: string, input: RecipientConfigInput, database: Database = getDb()) {
  const config = recipientSchema.parse(input);
  const rows = config.to.type === "CUSTOM" ? [] : await database.select({ email: participants.email }).from(participants).where(and(eq(participants.eventId, eventId), config.to.type === "ALL_PARTICIPANTS" ? undefined : inArray(participants.status, config.to.type === "APPROVED" ? ["APPROVED", "CHECKED_IN"] : config.to.type === "NOT_CHECKED_IN" ? ["APPROVED"] : [config.to.type])));
  const manual = config.to.type === "CUSTOM" ? config.to.emails : [];
  // Global contact lists are additive: they extend the event-scoped segment.
  const [toContacts, ccContacts, bccContacts] = await Promise.all([
    contactListEmails(config.to.contactListIds, database),
    contactListEmails(config.ccContactListIds, database),
    contactListEmails(config.bccContactListIds, database),
  ]);
  const to = [...new Set([...rows.map((r) => r.email.trim().toLowerCase()), ...manual, ...toContacts])];
  return { to, cc: [...new Set([...config.cc, ...ccContacts])], bcc: [...new Set([...config.bcc, ...bccContacts])] };
}
export { resolveTemplateVariables } from "@/lib/email-content";
function registrationUrl(eventId: string) { return `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/events/${eventId}/register`; }
export function eventVariables(event: typeof events.$inferSelect) { return { "event.name": event.name, "event.venue": event.venue ?? "", "event.event_start": event.eventStart?.toISOString() ?? "", "event.event_end": event.eventEnd?.toISOString() ?? "", "event.registration_url": registrationUrl(event.id) }; }
export async function getPublishInvitationReview(eventId: string, database: Database = getDb()) {
  const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return null;
  const [templates, recipients] = await Promise.all([
    database.select().from(emailTemplates).where(and(eq(emailTemplates.eventId, eventId), eq(emailTemplates.type, "INVITATION"))).orderBy(desc(emailTemplates.updatedAt)),
    database.select({ id: participants.id, name: participants.name, email: participants.email, company: participants.company, phone: participants.phone, jobTitle: participants.jobTitle }).from(participants).where(and(eq(participants.eventId, eventId), eq(participants.status, "INVITED"))).orderBy(asc(participants.name), asc(participants.id)),
  ]);
  const template = templates.find((item) => !isEmailDraft(item)) ?? null;
  let previewHtml = "";
  let previewSubject = "";
  let previewError = "";
  if (template) {
    const recipient = recipients[0];
    const vars = {
      ...eventVariables(event),
      "participant.name": recipient?.name ?? "Sample Participant",
      "participant.company": recipient?.company ?? "Example Company",
      "participant.email": recipient?.email ?? "sample@example.local",
      "participant.phone": recipient?.phone ?? "",
      "participant.job_title": recipient?.jobTitle ?? "Guest",
      "ticket.ticket_number": "",
      "ticket.url": "",
    };
    try {
      previewSubject = resolveTemplateVariables(template.subject, vars);
      previewHtml = await renderEmailAsync(template.contentJson, vars);
    } catch {
      previewError = "The ready invitation template could not be previewed, so it will not be sent during publish.";
    }
  }
  return {
    template: template ? { id: template.id, name: template.name } : null,
    hasInvitationTemplate: templates.length > 0,
    recipients: recipients.map(({ id, name, email }) => ({ id, name, email })),
    previewSubject,
    previewHtml,
    previewError,
  };
}
export function renderEmail(content: EmailContent, vars: Record<string, string>) { return renderParsedEmail(contentSchema.parse(content), vars); }
function renderParsedEmail(content: EmailContent, vars: Record<string, string>) {
  const replace = (value: string) => escapeHtml(resolveTemplateVariables(value, vars));
  return content.blocks.map((block) => {
    if (block.type === "heading") return `<h${block.data.level} style="font-family:Arial,sans-serif;text-align:${block.data.align}">${replace(block.data.text)}</h${block.data.level}>`;
    if (block.type === "paragraph") {
      const runs = block.data.runs ?? [{ text: block.data.text }];
      const resolver = (value: string) => resolveTemplateVariables(value, vars);
      // `{{ticket.url}}` resolves to an app path (/t/token); mail clients need an absolute URL.
      const linkResolver = (value: string) => { const resolved = resolver(value); return resolved.startsWith("/t/") ? new URL(resolved, process.env.APP_URL ?? "http://localhost:3000").href : resolved; };
      const text = block.data.list && block.data.list !== "none" ? renderRichList(runs, resolver, block.data.list, linkResolver) : renderRichText(runs, resolver, linkResolver);
      return `<div style="font:14px/1.6 Arial,sans-serif;text-align:${block.data.align};margin:14px 0">${text}</div>`;
    }
    if (block.type === "image") {
      const source = block.data.src.startsWith("/uploads/email/") ? new URL(block.data.src, process.env.APP_URL ?? "http://localhost:3000").href : block.data.src;
      return `<p style="text-align:${block.data.align}"><img src="${escapeHtml(safeEmailLink(source))}" alt="${escapeHtml(block.data.alt)}" width="${block.data.width}" style="max-width:100%;height:auto;border:0" /></p>`;
    }
    if (block.type === "button") {
      const resolved = resolveTemplateVariables(block.data.url, vars);
      const absolute = resolved.startsWith("/t/") ? new URL(resolved, process.env.APP_URL ?? "http://localhost:3000").href : resolved;
      return `<p style="text-align:${block.data.align}"><a href="${escapeHtml(safeEmailLink(absolute))}" style="display:inline-block;background:#2f81f7;color:#ffffff;padding:12px 20px;border-radius:6px;font:14px Arial,sans-serif;text-decoration:none">${replace(block.data.text)}</a></p>`;
    }
    if (block.type === "table") return `<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font:14px Arial,sans-serif">${block.data.rows.map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #d0d7de">${replace(cell)}</td>`).join("")}</tr>`).join("")}</table>`;
    if (block.type === "divider") return '<hr style="border:0;border-top:1px solid #d0d7de" />';
    if (block.type === "spacer") return `<div style="height:${block.data.height}px;line-height:${block.data.height}px">&nbsp;</div>`;
    return `<div data-qr-id="${escapeHtml(block.id)}">QR</div>`;
  }).join("");
}
export async function renderEmailAsync(content: unknown, vars: Record<string, string>) {
  const parsed = contentSchema.parse(content);
  let result = renderParsedEmail(parsed, vars);
  for (const block of parsed.blocks) {
    if (block.type !== "qr") continue;
    const value = resolveTemplateVariables(block.data.value, vars);
    const image = await toDataURL(value, { margin: 1, width: block.data.size });
    result = result.replace(`<div data-qr-id="${escapeHtml(block.id)}">QR</div>`, `<img src="${image}" width="${block.data.size}" alt="QR code" />`);
  }
  return result;
}

export type MailMessage = { to: string; cc: string[]; bcc: string[]; subject: string; html: string };
export type MailResult = { ok: true; mode: "smtp"; messageId: string } | { ok: true; mode: "preview"; previewPath: string };
const BROADCAST_BATCH_SIZE = 50;
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const mode = process.env.MAIL_TRANSPORT ?? "preview";
  if (mode === "smtp") {
    const missing = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_CRYPTO", "SMTP_CHARSET", "SMTP_MAILTYPE"]
      .filter((key) => !process.env[key]?.trim());
    if (process.env.SMTP_PROTOCOL !== "smtp") missing.push("SMTP_PROTOCOL=smtp");
    if (missing.length) throw new Error(`SMTP configuration is incomplete: ${missing.join(", ")}`);
    if (process.env.SMTP_MAILTYPE?.toLowerCase() !== "html") throw new Error("SMTP_MAILTYPE must be html.");
    const port = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT must be a valid port number.");
    const crypto = process.env.SMTP_CRYPTO?.toLowerCase();
    if (crypto !== "tls" && crypto !== "ssl") throw new Error("SMTP_CRYPTO must be tls or ssl.");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: crypto === "ssl",
      requireTLS: crypto === "tls",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      html: { content: message.html, contentType: `text/html; charset=${process.env.SMTP_CHARSET}` },
    });
    return { ok: true, mode: "smtp", messageId: result.messageId };
  }
  if (mode !== "preview") throw new Error("MAIL_TRANSPORT must be smtp or preview.");
  const folder = path.join(process.cwd(), ".email-previews"); await mkdir(folder, { recursive: true });
  const safe = `${Date.now()}-${crypto.randomUUID()}.html`; const previewPath = path.join(folder, safe);
  const header = `<meta charset="utf-8"><title>${escapeHtml(message.subject)}</title><p style="font:12px sans-serif;color:#666">TO: ${escapeHtml(message.to)} | CC: ${message.cc.length} | BCC: ${message.bcc.length}</p>`;
  await writeFile(previewPath, `<!doctype html><html><body>${header}${message.html}</body></html>`, "utf8"); return { ok: true, mode: "preview", previewPath };
}

export async function broadcastTemplate(eventId: string, templateId: string, database: Database = getDb(), actorId: string | null = null) {
  const template = await getEmailTemplate(eventId, templateId, database); if (!template) return { requested: 0, sent: 0, failed: 0, errors: ["Template not found."], broadcastId: null as string | null };
  if (isEmailDraft(template)) return { requested: 0, sent: 0, failed: 0, errors: ["Draft templates cannot be broadcast. Review and mark the template ready first."], broadcastId: null as string | null };
  const config = recipientSchema.parse(template.recipientJson); const recipients = await resolveRecipients(eventId, config, database); const rows = config.to.type === "CUSTOM" ? [] : await database.select({ participant: participants, event: events, ticket: tickets }).from(participants).innerJoin(events, eq(events.id, participants.eventId)).leftJoin(tickets, eq(tickets.participantId, participants.id)).where(eq(participants.eventId, eventId));
  const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);
  const audience = new Set(recipients.to);
  const participantRows = rows.filter((row) => audience.has(row.participant.email.toLowerCase()));
  // Addresses from custom lists or global contact lists have no participant record.
  const covered = new Set(participantRows.map((row) => row.participant.email.toLowerCase()));
  const guestRows = recipients.to.filter((email) => !covered.has(email)).map((email) => ({ participant: { name: "Recipient", company: null, email, phone: "", jobTitle: null }, event: event!, ticket: null }));
  const selected = [...participantRows, ...guestRows];
  const results: { sent: number; failed: number; errors: string[] } = { sent: 0, failed: 0, errors: [] };
  const broadcastId = crypto.randomUUID();
  const transport = process.env.MAIL_TRANSPORT ?? "preview";
  await database.insert(emailBroadcasts).values({ id: broadcastId, eventId, templateName: template.name, subject: template.subject, transport, requested: selected.length });
  await recordActivity(eventId, "BROADCAST_STARTED", `Broadcast ${template.name}: ${selected.length} recipients using ${transport}.`, actorId, database);
  for (let offset = 0; offset < selected.length; offset += BROADCAST_BATCH_SIZE) {
    const batch = selected.slice(offset, offset + BROADCAST_BATCH_SIZE);
    for (const row of batch) { const vars = { ...eventVariables(row.event), "participant.name": row.participant.name, "participant.company": row.participant.company ?? "", "participant.email": row.participant.email, "participant.phone": row.participant.phone, "participant.job_title": row.participant.jobTitle ?? "", "ticket.ticket_number": row.ticket?.ticketNumber ?? "", "ticket.url": row.ticket ? `/t/${row.ticket.qrToken}` : "" };
      const subject = resolveTemplateVariables(template.subject, vars);
      await deliverTracked(eventId, { to: row.participant.email, cc: recipients.cc, bcc: recipients.bcc, subject, html: "" }, database, broadcastId, () => renderEmailAsync(template.contentJson, vars))
        .then(() => { results.sent++; }).catch(() => { results.failed++; results.errors.push("Delivery failed. Check transport configuration and the delivery report."); });
      await database.update(emailBroadcasts).set({ sent: results.sent, failed: results.failed }).where(eq(emailBroadcasts.id, broadcastId));
    }
  }
  await database.update(emailBroadcasts).set({ status: results.failed ? "PARTIAL" : "COMPLETE" }).where(eq(emailBroadcasts.id, broadcastId));
  await recordActivity(eventId, "BROADCAST_COMPLETE", `Broadcast ${template.name}: ${results.sent} ${transport === "preview" ? "previews saved" : "sent"}, ${results.failed} failed.`, actorId, database);
  return { requested: selected.length, ...results, broadcastId: broadcastId as string | null };
}

async function deliverTracked(eventId: string, message: MailMessage, database: Database, broadcastId?: string, render?: () => Promise<string>) {
  const id = crypto.randomUUID();
  await database.insert(emailDeliveries).values({ id, eventId, broadcastId, recipient: message.to, subject: message.subject.slice(0, 255), transport: process.env.MAIL_TRANSPORT ?? "preview", status: "PENDING" });
  let result: MailResult;
  try { result = await sendMail({ ...message, html: render ? await render() : message.html }); }
  catch (error) { await database.update(emailDeliveries).set({ status: "FAILED" }).where(eq(emailDeliveries.id, id)); throw error; }
  await database.update(emailDeliveries).set({ status: result.mode === "preview" ? "PREVIEW" : "SENT" }).where(eq(emailDeliveries.id, id));
  return result;
}

export async function sendTestEmail(eventId: string, templateId: string, recipient: string, actorId: string, database: Database = getDb()) {
  const template = await getEmailTemplate(eventId, templateId, database);
  const [event] = await database.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!template || !event) throw new Error("Template or event not found.");
  const vars = { ...eventVariables(event), "participant.name": "Test Participant", "participant.email": recipient, "participant.company": "Example Company", "participant.phone": "", "participant.job_title": "Guest", "ticket.ticket_number": "TEST-TICKET", "ticket.url": `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/t/sample` };
  const result = await deliverTracked(eventId, { to: recipient, cc: [], bcc: [], subject: resolveTemplateVariables(template.subject, vars), html: "" }, database, undefined, () => renderEmailAsync(template.contentJson, vars));
  await recordActivity(eventId, "TEST_EMAIL", `Test email ${result.mode === "preview" ? "preview saved" : "sent"}: ${template.name}.`, actorId, database);
  return result;
}

export async function sendTransactionalEmail(eventId: string, type: string, participantId: string, database: Database = getDb(), templateId?: string) {
  const templates = await database.select().from(emailTemplates).where(and(eq(emailTemplates.eventId, eventId), eq(emailTemplates.type, type), templateId ? eq(emailTemplates.id, templateId) : undefined)).orderBy(desc(emailTemplates.updatedAt));
  const template = templates.find((item) => !isEmailDraft(item));
  if (!template) return { ok: true as const, skipped: true as const };
  const [row] = await database.select({ participant: participants, event: events, ticket: tickets }).from(participants).innerJoin(events, eq(events.id, participants.eventId)).leftJoin(tickets, eq(tickets.participantId, participants.id)).where(and(eq(participants.eventId, eventId), eq(participants.id, participantId))).limit(1); if (!row) return { ok: false as const, error: "Participant not found" };
  const vars = { ...eventVariables(row.event), "participant.name": row.participant.name, "participant.company": row.participant.company ?? "", "participant.email": row.participant.email, "participant.phone": row.participant.phone, "participant.job_title": row.participant.jobTitle ?? "", "ticket.ticket_number": row.ticket?.ticketNumber ?? "", "ticket.url": row.ticket ? `/t/${row.ticket.qrToken}` : "" };
  try {
    const result = await deliverTracked(eventId, { to: row.participant.email, cc: [], bcc: [], subject: resolveTemplateVariables(template.subject, vars), html: await renderEmailAsync(template.contentJson, vars) }, database);
    await recordActivity(eventId, "AUTOMATIC_EMAIL", `${type} email ${result.mode === "preview" ? "preview saved" : "sent"}.`, null, database);
    return result;
  } catch (error) { await recordActivity(eventId, "EMAIL_FAILED", `${type} email delivery failed.`, null, database); throw error; }
}
