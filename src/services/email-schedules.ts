import { and, asc, eq, ne } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { emailSchedules, emailTemplates, events } from "@/db/schema";
import { isEmailDraft } from "@/lib/email-delivery";
import { formatOffset, reminderContent, reminderScheme, scheduleInputSchema, scheduledSendAt } from "@/lib/email-schedule";
import { recordActivity } from "./activity";
import { broadcastTemplate } from "./email";

export async function listSchedules(eventId: string, database: Database = getDb()) {
  const rows = await database
    .select({ schedule: emailSchedules, template: emailTemplates })
    .from(emailSchedules)
    .innerJoin(emailTemplates, eq(emailTemplates.id, emailSchedules.templateId))
    .where(eq(emailSchedules.eventId, eventId))
    .orderBy(asc(emailSchedules.offsetMinutes));
  // Largest lead time first: the earliest reminder is at the top.
  return rows.sort((a, b) => b.schedule.offsetMinutes - a.schedule.offsetMinutes).map(({ schedule, template }) => ({
    ...schedule,
    templateName: template.name,
    templateDraft: isEmailDraft(template),
  }));
}

/** Adds one reminder. The template must belong to the event, and the same template cannot have two reminders at the same time. */
export async function createSchedule(eventId: string, input: unknown, actorId: string | null = null, database: Database = getDb()) {
  const parsed = scheduleInputSchema.parse(input);
  const [template] = await database.select().from(emailTemplates).where(and(eq(emailTemplates.id, parsed.templateId), eq(emailTemplates.eventId, eventId))).limit(1);
  if (!template) throw new Error("Template not found for this event.");
  const [duplicate] = await database.select({ id: emailSchedules.id }).from(emailSchedules).where(and(eq(emailSchedules.eventId, eventId), eq(emailSchedules.templateId, parsed.templateId), eq(emailSchedules.offsetMinutes, parsed.offsetMinutes), ne(emailSchedules.status, "CANCELLED"))).limit(1);
  if (duplicate) throw new Error("This template already has a reminder at that time.");
  const id = crypto.randomUUID();
  await database.insert(emailSchedules).values({ id, eventId, templateId: parsed.templateId, offsetMinutes: parsed.offsetMinutes });
  await recordActivity(eventId, "REMINDER_SCHEDULED", `Reminder scheduled: ${template.name}, ${formatOffset(parsed.offsetMinutes)}.`, actorId, database);
  return id;
}

/** Removes a reminder that is not sending right now. A reminder in RUNNING state is kept so its delivery can be reviewed. */
export async function removeSchedule(eventId: string, id: string, actorId: string | null = null, database: Database = getDb()) {
  const [row] = await database.select().from(emailSchedules).where(and(eq(emailSchedules.id, id), eq(emailSchedules.eventId, eventId))).limit(1);
  if (!row) throw new Error("Reminder not found.");
  if (row.status === "RUNNING") throw new Error("This reminder is sending now. Check the delivery report first.");
  await database.delete(emailSchedules).where(eq(emailSchedules.id, id));
  await recordActivity(eventId, "REMINDER_REMOVED", `Reminder removed: ${formatOffset(row.offsetMinutes)}.`, actorId, database);
}

/**
 * Creates the 3-step reminder series (7 days, 1 day and 3 hours before) as draft
 * templates plus their schedules. Steps whose template name already exists in the
 * event are skipped, so pressing it twice never duplicates anything.
 */
export async function createReminderScheme(eventId: string, actorId: string | null = null, database: Database = getDb()) {
  const existing = await database.select({ name: emailTemplates.name }).from(emailTemplates).where(eq(emailTemplates.eventId, eventId));
  const names = new Set(existing.map((row) => row.name));
  let created = 0;
  for (const step of reminderScheme) {
    if (names.has(step.name)) continue;
    const templateId = crypto.randomUUID();
    await database.insert(emailTemplates).values({
      id: templateId,
      eventId,
      name: step.name,
      type: "REMINDER",
      subject: step.subject,
      recipientJson: { to: { type: step.audience, emails: [], contactListIds: [] }, cc: [], bcc: [], ccContactListIds: [], bccContactListIds: [] },
      contentJson: reminderContent(step),
    });
    await database.insert(emailSchedules).values({ eventId, templateId, offsetMinutes: step.offsetMinutes });
    created += 1;
  }
  if (created) await recordActivity(eventId, "REMINDER_SCHEME", `Reminder scheme created: ${created} draft template${created === 1 ? "" : "s"} with schedules.`, actorId, database);
  return created;
}

export type ReminderRunSummary = { checked: number; sent: number; failed: number; skipped: number; waiting: number };

/**
 * Sends every reminder that is due. Safe to call often (every few minutes) and
 * from more than one process: a reminder is claimed with a conditional update, so
 * only one caller sends it.
 *
 * - Not due yet, or event still a draft: left PENDING.
 * - Template still a draft: left PENDING ("waiting"), so marking it Ready later still works.
 * - Event cancelled/finished, or already started: SKIPPED.
 */
export async function runDueSchedules(now: Date = new Date(), database: Database = getDb()): Promise<ReminderRunSummary> {
  const summary: ReminderRunSummary = { checked: 0, sent: 0, failed: 0, skipped: 0, waiting: 0 };
  const pending = await database
    .select({ schedule: emailSchedules, template: emailTemplates, event: events })
    .from(emailSchedules)
    .innerJoin(emailTemplates, eq(emailTemplates.id, emailSchedules.templateId))
    .innerJoin(events, eq(events.id, emailSchedules.eventId))
    .where(eq(emailSchedules.status, "PENDING"));

  for (const { schedule, template, event } of pending) {
    const sendAt = scheduledSendAt(event.eventStart, schedule.offsetMinutes);
    if (!sendAt || now < sendAt) continue;
    summary.checked += 1;

    const skipReason = event.status === "CANCELLED" || event.status === "FINISHED" ? `Event is ${event.status.toLowerCase()}.` : event.eventStart && now >= event.eventStart ? "The event had already started." : null;
    if (skipReason) {
      await database.update(emailSchedules).set({ status: "SKIPPED", lastError: skipReason, finishedAt: now }).where(and(eq(emailSchedules.id, schedule.id), eq(emailSchedules.status, "PENDING")));
      summary.skipped += 1;
      continue;
    }
    if (event.status === "DRAFT" || isEmailDraft(template)) { summary.waiting += 1; continue; }

    const [claim] = await database.update(emailSchedules).set({ status: "RUNNING", startedAt: now, lastError: null }).where(and(eq(emailSchedules.id, schedule.id), eq(emailSchedules.status, "PENDING")));
    if (!claim.affectedRows) continue;

    try {
      const result = await broadcastTemplate(schedule.eventId, schedule.templateId, database, null);
      const failed = result.failed > 0 || result.requested === 0;
      const message = result.errors[0] ?? (result.requested === 0 ? "No recipients matched this reminder." : null);
      await database.update(emailSchedules).set({ status: failed ? "FAILED" : "SENT", broadcastId: result.broadcastId, lastError: failed ? (message ?? "Some deliveries failed.").slice(0, 500) : null, finishedAt: new Date() }).where(eq(emailSchedules.id, schedule.id));
      await recordActivity(schedule.eventId, failed ? "REMINDER_FAILED" : "REMINDER_SENT", `Reminder ${template.name}: ${result.sent} of ${result.requested} delivered.`, null, database);
      if (failed) summary.failed += 1; else summary.sent += 1;
    } catch {
      await database.update(emailSchedules).set({ status: "FAILED", lastError: "Sending was interrupted. Check the delivery report before sending again.", finishedAt: new Date() }).where(eq(emailSchedules.id, schedule.id));
      summary.failed += 1;
    }
  }
  return summary;
}
