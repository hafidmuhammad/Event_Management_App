import { z } from "zod";

/** Longest lead time a reminder may have: 90 days before the event. */
export const MAX_OFFSET_MINUTES = 90 * 24 * 60;
export const MIN_OFFSET_MINUTES = 5;

/** Quick choices in the Add reminder form, in minutes before the event starts. */
export const reminderPresets = [
  { minutes: 7 * 24 * 60, label: "7 days before" },
  { minutes: 3 * 24 * 60, label: "3 days before" },
  { minutes: 24 * 60, label: "1 day before" },
  { minutes: 3 * 60, label: "3 hours before" },
  { minutes: 60, label: "1 hour before" },
] as const;

const unitMinutes = { minutes: 1, hours: 60, days: 24 * 60 } as const;
export type OffsetUnit = keyof typeof unitMinutes;

/** "10080" -> "7 days before". Exact multiples use the largest unit that fits. */
export function formatOffset(minutes: number) {
  const plural = (value: number, unit: string) => `${value} ${unit}${value === 1 ? "" : "s"} before`;
  if (minutes % unitMinutes.days === 0) return plural(minutes / unitMinutes.days, "day");
  if (minutes % unitMinutes.hours === 0) return plural(minutes / unitMinutes.hours, "hour");
  return plural(minutes, "minute");
}

/** When a reminder goes out. `null` while the event has no start time. */
export function scheduledSendAt(eventStart: Date | null | undefined, offsetMinutes: number) {
  return eventStart ? new Date(eventStart.getTime() - offsetMinutes * 60_000) : null;
}

/**
 * The form posts either a preset (`when=10080`) or `when=custom` with an amount
 * and a unit. Both end up as whole minutes inside the allowed range.
 */
export const scheduleInputSchema = z.object({
  templateId: z.string().trim().min(1).max(36),
  when: z.string().trim().min(1),
  amount: z.coerce.number().int().positive().optional(),
  unit: z.enum(["minutes", "hours", "days"]).optional(),
}).transform((value, context) => {
  const minutes = value.when === "custom" ? (value.amount ?? 0) * unitMinutes[value.unit ?? "hours"] : Number(value.when);
  if (!Number.isInteger(minutes) || minutes < MIN_OFFSET_MINUTES || minutes > MAX_OFFSET_MINUTES) {
    context.addIssue({ code: "custom", message: "Choose between 5 minutes and 90 days before the event.", path: ["when"] });
    return z.NEVER;
  }
  return { templateId: value.templateId, offsetMinutes: minutes };
});

/** Three-step reminder series offered by "Use 3-step scheme". All templates start as drafts. */
export const reminderScheme = [
  {
    offsetMinutes: 7 * 24 * 60,
    name: "Reminder: 7 days before",
    subject: "{{event.name}} is one week away",
    heading: "One week to go, {{participant.name}}",
    body: "{{event.name}} takes place at {{event.venue}} next week. Please keep your ticket ready: you will show it at the entrance.",
    audience: "APPROVED",
  },
  {
    offsetMinutes: 24 * 60,
    name: "Reminder: 1 day before",
    subject: "Tomorrow: {{event.name}}",
    heading: "See you tomorrow, {{participant.name}}",
    body: "{{event.name}} starts tomorrow at {{event.venue}}. Open your ticket below and arrive a little early for check-in.",
    audience: "APPROVED",
  },
  {
    offsetMinutes: 3 * 60,
    name: "Reminder: 3 hours before",
    subject: "{{event.name}} starts soon",
    heading: "Almost time, {{participant.name}}",
    body: "{{event.name}} starts in a few hours at {{event.venue}}. Your ticket is one tap away.",
    audience: "NOT_CHECKED_IN",
  },
] as const;

/** Content for one scheme step, in the shape `contentSchema` stores. */
export function reminderContent(step: (typeof reminderScheme)[number]) {
  return {
    version: 1 as const,
    deliveryStatus: "DRAFT" as const,
    blocks: [
      { id: crypto.randomUUID(), type: "heading" as const, data: { text: step.heading, level: 2 as const, align: "left" as const } },
      { id: crypto.randomUUID(), type: "paragraph" as const, data: { text: step.body, align: "left" as const, runs: [{ text: step.body }] } },
      { id: crypto.randomUUID(), type: "button" as const, data: { text: "View my ticket", url: "{{ticket.url}}", align: "left" as const } },
    ],
  };
}
