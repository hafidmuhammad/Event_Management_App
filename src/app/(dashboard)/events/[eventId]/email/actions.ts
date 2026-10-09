"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { saveEmailTemplate, broadcastTemplate, getEmailTemplate, setTemplateDeliveryStatus } from "@/services/email";
import { createReminderScheme, createSchedule, removeSchedule } from "@/services/email-schedules";
import { saveGlobalTemplate } from "@/services/library";
import { recordActivity } from "@/services/activity";
export async function saveTemplateAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try {
    const content = JSON.parse(String(formData.get("content") ?? '{"version":1,"blocks":[]}'));
    const recipient = JSON.parse(String(formData.get("recipient") ?? '{"to":{"type":"APPROVED","emails":[]},"cc":[],"bcc":[]}'));
    const template = await saveEmailTemplate(eventId, { name: formData.get("name"), type: formData.get("type"), subject: formData.get("subject"), content, recipient }, String(formData.get("id") ?? "") || undefined);
    if (!template) throw new Error("Template not found.");
    await recordActivity(eventId, "TEMPLATE_SAVED", `Email template saved: ${template.name}.`, session.user.id);
  } catch { return { ok: false, error: "Unable to save template. Check required fields and links." }; }
  revalidatePath(`/events/${eventId}/email`); return { ok: true };
}
export async function broadcastAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  if (formData.get("confirmed") !== "yes") redirect(`/events/${eventId}/email?error=Review%20and%20confirm%20the%20broadcast%20first`);
  let result: Awaited<ReturnType<typeof broadcastTemplate>>;
  try { result = await broadcastTemplate(eventId, String(formData.get("templateId")), undefined, session.user.id); }
  catch { redirect(`/events/${eventId}/email?error=Broadcast%20interrupted.%20Inspect%20the%20delivery%20report%20before%20retrying.`); }
  revalidatePath(`/events/${eventId}/email`);
  const summary = `Broadcast complete: ${result.requested} requested, ${result.sent} ${process.env.MAIL_TRANSPORT === "smtp" ? "sent" : "previews saved (no email sent)"}, ${result.failed} failed.`;
  redirect(`/events/${eventId}/email?${result.errors.length ? "error" : "notice"}=${encodeURIComponent(result.errors.length ? `${summary} ${result.errors[0]}` : summary)}`);
}

/**
 * Copies an event template's subject and body into the global library. The
 * recipient configuration is intentionally not copied: global templates are
 * event-independent blueprints and must never carry an audience.
 */
export async function saveEventTemplateToLibraryAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const template = await getEmailTemplate(eventId, String(formData.get("templateId") ?? ""));
  if (!template) return { ok: false, error: "Template not found." };
  try {
    await saveGlobalTemplate({ name: template.name, description: "Saved from an event template.", type: template.type, subject: template.subject, content: template.contentJson }, undefined, session.user.id);
  } catch {
    return { ok: false, error: "Unable to save this template to the global library. Check the template content." };
  }
  revalidatePath("/library/email-templates");
  return { ok: true, notice: "Saved to the global template library. No email was sent." };
}

/** Marks a template Ready so it can be broadcast. Changing status never sends mail. */
export async function markTemplateReadyAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try {
    const template = await setTemplateDeliveryStatus(eventId, String(formData.get("templateId") ?? ""), "READY");
    if (!template) return { ok: false, error: "Template not found." };
    await recordActivity(eventId, "TEMPLATE_READY", `Email template marked ready: ${template.name}.`, session.user.id);
  } catch { return { ok: false, error: "Unable to mark this template ready. Open it and check the content and links." }; }
  revalidatePath(`/events/${eventId}/email`);
  return { ok: true, notice: "Template is ready. No email was sent. You can send it now." };
}

export async function createScheduleAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try {
    await createSchedule(eventId, { templateId: formData.get("templateId"), when: formData.get("when"), amount: formData.get("amount") || undefined, unit: formData.get("unit") || undefined }, session.user.id);
  } catch (error) { return { ok: false, error: error instanceof Error && error.name !== "ZodError" ? error.message : "Choose a template and a time between 5 minutes and 90 days before the event." }; }
  revalidatePath(`/events/${eventId}/email`);
  return { ok: true, notice: "Reminder scheduled. It sends automatically once the scheduler runs." };
}

export async function removeScheduleAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try { await removeSchedule(eventId, String(formData.get("scheduleId") ?? ""), session.user.id); }
  catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to remove this reminder." }; }
  revalidatePath(`/events/${eventId}/email`);
  return { ok: true, notice: "Reminder removed." };
}

export async function createReminderSchemeAction(eventId: string) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  let created: number;
  try { created = await createReminderScheme(eventId, session.user.id); }
  catch { return { ok: false, error: "Unable to create the reminder scheme." }; }
  revalidatePath(`/events/${eventId}/email`);
  return { ok: true, notice: created ? `Created ${created} draft reminder template${created === 1 ? "" : "s"} with schedules. Review each one, then mark it Ready.` : "The reminder scheme already exists for this event." };
}