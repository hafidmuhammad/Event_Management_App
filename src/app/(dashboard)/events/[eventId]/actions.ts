"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/authorization";
import { approveParticipant, cancelParticipant, rejectParticipant, waitlistParticipant } from "@/services/participants";
import { sendTransactionalEmail } from "@/services/email";
import { recordActivity } from "@/services/activity";

function feedback(eventId: string, message: string): never {
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/participants`);
  redirect(`/events/${eventId}/participants?error=${encodeURIComponent(message)}`);
}

export async function approveParticipantAction(eventId: string, participantId: string) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const result = await approveParticipant(eventId, participantId, session.user.id);
  if (!result.ok) feedback(eventId, result.message);
  await recordActivity(eventId, "PARTICIPANT_APPROVED", `${result.participant.name} approved.`, session.user.id);
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/participants`);
  try {
    const ticketEmail = await sendTransactionalEmail(eventId, "TICKET", participantId);
    if ("skipped" in ticketEmail && ticketEmail.skipped) await sendTransactionalEmail(eventId, "APPROVED", participantId);
  } catch { /* mail is fail-safe */ }
  redirect(`/events/${eventId}/participants?notice=Participant%20approved.`);
}

export async function waitlistParticipantAction(eventId: string, participantId: string) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const result = await waitlistParticipant(eventId, participantId);
  if (!result.ok) feedback(eventId, result.message);
  await recordActivity(eventId, "PARTICIPANT_WAITLISTED", `${result.participant.name} moved to waitlist.`, session.user.id);
  revalidatePath(`/events/${eventId}/participants`);
  try { await sendTransactionalEmail(eventId, "WAITLIST", participantId); } catch { /* mail is fail-safe */ }
  redirect(`/events/${eventId}/participants?notice=Participant%20moved%20to%20waitlist.`);
}

export async function rejectParticipantAction(eventId: string, participantId: string, formData: FormData) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const result = await rejectParticipant(eventId, participantId, { rejectionReason: String(formData.get("rejectionReason") ?? "") });
  if (!result.ok) feedback(eventId, result.message);
  await recordActivity(eventId, "PARTICIPANT_REJECTED", `${result.participant.name} rejected.`, session.user.id);
  revalidatePath(`/events/${eventId}/participants`);
  try { await sendTransactionalEmail(eventId, "REJECTED", participantId); } catch { /* mail is fail-safe */ }
  redirect(`/events/${eventId}/participants?notice=Participant%20rejected.`);
}

export async function cancelParticipantAction(eventId: string, participantId: string) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER");
  const result = await cancelParticipant(eventId, participantId);
  if (!result.ok) feedback(eventId, result.message);
  await recordActivity(eventId, "PARTICIPANT_CANCELLED", `${result.participant.name} cancelled.`, session.user.id);
  revalidatePath(`/events/${eventId}/participants`);
  redirect(`/events/${eventId}/participants?notice=Participant%20cancelled.`);
}
