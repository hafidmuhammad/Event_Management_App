import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";
import { getAwards } from "@/services/awards";
import { AwardDisplay } from "@/components/events/award-display";
import { PresentationControls } from "@/components/events/presentation-controls";

export default async function AwardsDisplayPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const [event, awards] = await Promise.all([getEvent(eventId), getAwards(eventId)]);
  if (!event || !awards) notFound();
  const items = [...awards.awards.items].sort((a, b) => a.displayOrder - b.displayOrder).map(({ name, recipientName, subtitle, image }) => ({ name, recipientName, subtitle, image }));
  return <main className="min-h-screen bg-background p-6 text-ink sm:p-10"><div className="mx-auto max-w-4xl space-y-8"><header><p className="eyebrow">Live display</p><h1 className="mt-2 text-display font-semibold">{event.name}</h1><p className="mt-2 text-ink-muted">Awards</p></header><AwardDisplay awards={items} /></div><PresentationControls returnHref={`/events/${eventId}/awards`} /></main>;
}
