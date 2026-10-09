"use server";

import { redirect } from "next/navigation";
import { registerParticipant } from "@/services/participants";
import { participantFormDataToInput } from "@/lib/validation/participants";
import { sendTransactionalEmail } from "@/services/email";
import { recordActivity } from "@/services/activity";

export async function registerParticipantAction(eventId: string, formData: FormData) {
  const result = await registerParticipant(eventId, participantFormDataToInput(formData));
  if (!result.ok) redirect(`/events/${eventId}/register?error=${encodeURIComponent(result.message)}`);
  await recordActivity(eventId, "REGISTRATION", "New registration received.");
  try { await sendTransactionalEmail(eventId, "REGISTRATION_RECEIVED", result.participant.id); } catch { /* mail is fail-safe */ }
  redirect(`/events/${eventId}/register?success=1&notice=Registration%20received.%20Your%20registration%20is%20awaiting%20review.`);
}
