"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { createEvent, publishEvent, saveCommittee, updateEvent } from "@/services/events";
import { getPublishInvitationReview, sendTransactionalEmail } from "@/services/email";
import { eventFormDataToInput, committeeSchema, eventInputSchema, type EventFormState } from "@/lib/validation/events";
import { recordActivity } from "@/services/activity";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please check the form and try again.";
}

function invalidEventState(formData: FormData): { data?: ReturnType<typeof eventInputSchema.parse>; state?: EventFormState } {
  const result = eventInputSchema.safeParse(eventFormDataToInput(formData));
  if (result.success) return { data: result.data };
  return { state: { formError: "Check the highlighted fields.", fieldErrors: result.error.flatten().fieldErrors } };
}

export async function createEventAction(_previousState: EventFormState, formData: FormData): Promise<EventFormState> {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const parsed = invalidEventState(formData);
  if (parsed.state) return parsed.state;
  let eventId: string;
  try {
    const event = await createEvent(parsed.data, session.user.id);
    if (!event) return { formError: "Event could not be created." };
    eventId = event.id;
    await recordActivity(event.id, "EVENT_CREATED", "Event draft created.", session.user.id);
  } catch (error) {
    return { formError: errorMessage(error) };
  }
  revalidatePath("/events");
  redirect(`/events/${eventId}?notice=Event%20created.`);
}

export async function updateEventAction(eventId: string, _previousState: EventFormState, formData: FormData): Promise<EventFormState> {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const parsed = invalidEventState(formData);
  if (parsed.state) return parsed.state;
  try {
    const event = await updateEvent(eventId, parsed.data);
    if (!event) return { formError: "Event was not found." };
    await recordActivity(eventId, "SETTINGS_UPDATED", "Event settings updated.", session.user.id);
  } catch (error) {
    return { formError: errorMessage(error) };
  }
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}?notice=Event%20updated.`);
}

export async function publishEventAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  let reviewedInvitees: unknown;
  try { reviewedInvitees = JSON.parse(String(formData.get("reviewedInvitees") ?? "")); } catch { redirect(`/events/${eventId}?error=Open%20the%20publish%20review%20before%20publishing.`); }
  if (!Array.isArray(reviewedInvitees) || reviewedInvitees.some((id) => typeof id !== "string")) redirect(`/events/${eventId}?error=Open%20the%20publish%20review%20before%20publishing.`);
  const review = await getPublishInvitationReview(eventId);
  if (!review) redirect(`/events/${eventId}?error=Event%20not%20found.`);
  const reviewedTemplateId = String(formData.get("invitationTemplateId") ?? "");
  const currentInvitees = review.recipients.map((recipient) => recipient.id);
  if (reviewedTemplateId !== (review.template?.id ?? "") || JSON.stringify(reviewedInvitees) !== JSON.stringify(currentInvitees)) {
    redirect(`/events/${eventId}?error=Invitation%20details%20changed.%20Review%20the%20publish%20email%20again.`);
  }
  const result = await publishEvent(eventId);
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  if (!result.ok) redirect(`/events/${eventId}?error=${encodeURIComponent(result.message)}`);
  await recordActivity(eventId, "EVENT_PUBLISHED", "Event published.", session.user.id);
  let notice: string;
  if (!review.template) {
    notice = review.hasInvitationTemplate
      ? "Event published. Invitation templates are still Draft, so no invitation emails were sent."
      : "Event published. No Ready INVITATION template is configured, so no invitation emails were sent.";
  } else if (review.previewError) {
    notice = "Event published. The invitation preview was unavailable, so no invitation emails were sent.";
  } else if (!review.recipients.length) {
    notice = "Event published. There are no invited participants to email.";
  } else {
    let sent = 0;
    let previews = 0;
    let failed = 0;
    let skipped = 0;
    for (const recipient of review.recipients) {
      try {
        const delivery = await sendTransactionalEmail(eventId, "INVITATION", recipient.id, undefined, review.template.id);
        if (!delivery.ok) failed++;
        else if ("skipped" in delivery && delivery.skipped) skipped++;
        else if (delivery.mode === "preview") previews++;
        else sent++;
      } catch { failed++; }
    }
    notice = process.env.MAIL_TRANSPORT === "smtp"
      ? `Event published. Invitation email results: ${sent} sent, ${failed} failed${skipped ? `, ${skipped} skipped` : ""}.`
      : `Event published. ${previews} invitation previews saved locally; no email was sent${failed ? `, ${failed} failed` : ""}${skipped ? `, ${skipped} skipped` : ""}.`;
  }
  revalidatePath(`/events/${eventId}/email`);
  redirect(`/events/${eventId}?notice=${encodeURIComponent(notice)}`);
}

export async function saveCommitteeAction(eventId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  try {
    const committee = committeeSchema.parse(JSON.parse(String(formData.get("committeeJson") ?? "[]")));
    await saveCommittee(eventId, committee);
    await recordActivity(eventId, "COMMITTEE_SAVED", `Committee saved: ${committee.length} members.`, session.user.id);
  } catch (error) {
    redirect(`/events/${eventId}/committee?error=${encodeURIComponent(errorMessage(error))}`);
  }
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}/committee?notice=Committee%20saved.`);
}
