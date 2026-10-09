import { notFound } from "next/navigation";
import { CommitteeCredits } from "@/components/events/committee-credits";
import { decryptEventId } from "@/lib/event-share";
import { getEvent } from "@/services/events";

export default async function CommitteeDisplayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const eventId = decryptEventId(token);
  if (!eventId) notFound();
  const event = await getEvent(eventId);
  if (!event) notFound();
  const members = Array.isArray(event.committeeJson) ? event.committeeJson.map(({ name, position }) => ({ name, position })) : [];
  return <CommitteeCredits eventName={event.name} members={members} />;
}
