/* eslint-disable @next/next/no-img-element -- display accepts validated local or curated image URLs. */
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";
import { getDoorprize, listWinnerParticipants } from "@/services/doorprize";
import { Gift } from "lucide-react";
import { badgeVariants } from "@/components/ui/badge";

export default async function DoorprizeDisplayPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const [event, doorprize] = await Promise.all([getEvent(eventId), getDoorprize(eventId)]);
  if (!event || !doorprize) notFound();
  const participants = await listWinnerParticipants(eventId, doorprize.doorprize);
  // Presentation routes intentionally live outside the dashboard layout.
  return <main className="min-h-screen bg-surface-sunken p-6 text-ink sm:p-10"><div className="mx-auto max-w-5xl space-y-8"><header><p className="eyebrow">Live display</p><h1 className="mt-2 text-display font-semibold">{event.name}</h1><p className="mt-2 text-ink-muted">Doorprize winners</p></header><div className="grid gap-6 md:grid-cols-2">{doorprize.doorprize.prizes.map((prize) => <section key={prize.id} className="overflow-hidden rounded-2xl border border-outline bg-surface shadow-lg"><div className="flex gap-4 bg-gradient-to-br from-hero-start to-hero-end p-6">{prize.image && <img src={prize.image} alt="" className="h-24 w-24 rounded-xl object-cover" />}{!prize.image && <div className="grid h-24 w-24 place-items-center rounded-xl bg-sky-soft"><Gift className="size-10 text-link" aria-hidden="true" /></div>}<div><span className={badgeVariants({ variant: "neutral" })}>{prize.category}</span><h2 className="mt-2 text-title font-semibold">{prize.name}</h2><p className="mt-1 text-body text-ink-muted">{prize.winners.length} / {prize.quantity} winners</p></div></div><div className="space-y-3 p-6">{prize.winners.map((winner) => { const participant = participants.get(winner.participantId); return <div key={`${prize.id}-${winner.participantId}`} className="rounded-xl border border-outline bg-surface-sunken p-4"><p className="text-title font-semibold">{participant?.name ?? "Participant unavailable"}</p>{participant?.company && <p className="mt-1 text-ink-muted">{participant.company}</p>}</div>; })}{!prize.winners.length && <p className="rounded-xl border border-dashed border-outline p-5 text-center text-ink-muted">Waiting for the draw.</p>}</div></section>)}{!doorprize.doorprize.prizes.length && <p className="text-ink-muted">No prizes configured.</p>}</div></div></main>;
}
