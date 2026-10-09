import { notFound } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { Card } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { updateEventAction } from "@/app/(dashboard)/events/actions";
import { requireRole } from "@/lib/auth/authorization";
import { canManageEvents } from "@/lib/auth/access";
import { formatEventDate } from "@/lib/date-time";
import { getEvent } from "@/services/events";

export default async function EventSettingsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();
  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div><p className="eyebrow">Events / Settings</p><h1 className="page-title">{event.name}</h1><p className="page-subtitle">Update event information, schedule, and registration rules.</p></div>
      {canManageEvents(session.user.role)
        ? <EventForm action={updateEventAction.bind(null, eventId)} submitLabel="Save settings" cancelHref={`/events/${eventId}`} initialValues={event} />
        : <Card asChild>
            <section>
              <p role="status" className="text-body text-ink-muted">You have read-only access. An Admin or Event Manager can change event settings.</p>
              <DetailList>
                <dt>Venue</dt><dd>{event.venue ?? "Not set"}</dd>
                <dt>Capacity</dt><dd>{event.capacity ?? "Unlimited"}</dd>
                <dt>Description</dt><dd>{event.description ?? "Not set"}</dd>
                <dt>Registration</dt><dd>{formatEventDate(event.registrationStart)} → {formatEventDate(event.registrationEnd)}</dd>
                <dt>Event schedule</dt><dd>{formatEventDate(event.eventStart)} → {formatEventDate(event.eventEnd)}</dd>
                <dt>Ticket validity</dt><dd>{formatEventDate(event.ticketValidFrom)} → {formatEventDate(event.ticketValidUntil)}</dd>
              </DetailList>
            </section>
          </Card>}
    </section>
  );
}
