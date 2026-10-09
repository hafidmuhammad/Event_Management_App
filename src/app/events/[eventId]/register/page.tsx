import { formatEventDate } from "@/lib/date-time";
import { notFound } from "next/navigation";
import { getEvent } from "@/services/events";
import { registrationWindowState } from "@/lib/validation/participants";
import { registerParticipantAction } from "./actions";

import { RegistrationFields } from "@/components/events/registration-fields";
import { Button } from "@/components/ui/button";

const formatDate = formatEventDate;

export default async function PublicRegistrationPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { eventId } = await params;
  const query = await searchParams;
  const event = await getEvent(eventId);
  if (!event) notFound();
  const state = registrationWindowState(event);
  return <main className="min-h-screen bg-background px-4 py-8 text-ink sm:px-6"><div className="mx-auto max-w-2xl space-y-4"><div><p className="eyebrow">Public registration</p><h1 className="page-title">{event.name}</h1><p className="page-subtitle">{formatDate(event.eventStart)} · {event.venue ?? "Venue to be announced"}</p></div>{query.success ? <section className="rounded-md border border-success/50 bg-success-soft p-6 text-success-ink"><h2 className="text-xl font-semibold text-ink">Registration Received</h2><p className="mt-2 text-sm text-ink-muted">Your registration is pending review. The event team will confirm your status.</p></section> : state !== "OPEN" ? <section className="rounded-md border border-outline bg-surface p-6"><h2 className="text-lg font-semibold">{state === "NOT_OPEN" ? "Registration Not Open Yet" : state === "CLOSED" ? "Registration Closed" : state === "CANCELLED" ? "Registration Unavailable" : "Registration Not Available"}</h2><p className="mt-2 text-sm text-ink-muted">{state === "NOT_OPEN" ? `Registration opens ${formatDate(event.registrationStart)}.` : state === "CLOSED" ? "The registration window has ended." : "This event is not accepting registrations."}</p></section> : <form action={registerParticipantAction.bind(null, eventId)} className="rounded-md border border-outline bg-surface p-4"><h2 className="section-title">Your details</h2>{query.error && <p role="alert" className="mt-3 rounded-md border border-danger/50 bg-danger-soft px-3 py-2 text-sm text-danger-ink">{query.error}</p>}<RegistrationFields /><Button type="submit" variant="primary" className="mt-4 w-full sm:w-auto">Submit registration</Button></form>}<p className="text-xs text-ink-muted">Registration status: <strong>{state === "OPEN" ? "Open" : state.replaceAll("_", " ")}</strong></p></div></main>;
}
