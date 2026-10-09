import { notFound } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { updateEventAction } from "@/app/(dashboard)/events/actions";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();
  const query = await searchParams;
  return <section className="mx-auto max-w-4xl space-y-4"><div><p className="eyebrow">Events / Edit</p><h1 className="page-title">Edit event</h1><p className="page-subtitle">Keep the operational details current.</p></div><EventForm action={updateEventAction.bind(null, eventId)} submitLabel="Save changes" cancelHref={`/events/${eventId}`} error={query.error} initialValues={event} /></section>;
}
