import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { canManageEvents } from "@/lib/auth/access";
import { getEventOverview } from "@/services/events";
import { PublishReviewButton } from "@/components/events/publish-review-button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DetailList } from "@/components/ui/detail-list";
import { Stat } from "@/components/ui/stat";
import { publishEventAction } from "@/app/(dashboard)/events/actions";
import { listActivity } from "@/services/activity";
import { ActivityList } from "@/components/events/activity-list";
import { validateEventForPublish } from "@/lib/validation/events";
import { formatEventDate } from "@/lib/date-time";
import { getPublishInvitationReview } from "@/services/email";

const formatDate = formatEventDate;

export default async function EventDetailPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const query = await searchParams;
  const overview = await getEventOverview(eventId);
  if (!overview) notFound();
  const { event } = overview;
  const canManage = canManageEvents(session.user.role);
  const publishReview = canManage && event.status === "DRAFT" ? await getPublishInvitationReview(eventId) : null;
  const committee = Array.isArray(event.committeeJson) ? event.committeeJson : [];
  const activity = await listActivity(eventId);
  const publishReady = validateEventForPublish(event).success;
  const readiness = [
    { label: "Schedule and ticket validity", ready: publishReady, href: "settings", hint: "Complete and validate all time windows." },
    { label: "Registration published", ready: event.status !== "DRAFT" && event.status !== "CANCELLED", href: "", hint: "Review the schedule, then publish this event." },
    { label: "Participant approvals", ready: overview.approved + overview.checkedIn > 0, href: "participants?status=PENDING", hint: `${overview.pending} registrations awaiting review; no eligible ticket holders yet.` },
    { label: "Committee", ready: committee.length > 0, href: "committee", hint: "Add the team members for closing credits." },
  ];
  const totals: [string, string | number, string][] = [
    ["Capacity", event.capacity ?? "∞", "settings"],
    ["Registered", overview.registered, "participants"],
    ["Pending", overview.pending, "participants?status=PENDING"],
    ["Approved", overview.approved, "participants?status=APPROVED"],
    ["Waitlist", overview.waitlist, "participants?status=WAITLIST"],
    ["Checked In", overview.checkedIn, "check-in"],
    ["Remaining", overview.remainingCapacity ?? "∞", "participants"],
  ];
  return (
    <section className="space-y-4">
      {query.notice && <Alert variant="success">{query.notice}</Alert>}
      {query.error && <Alert variant="danger">{query.error}</Alert>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Events / Overview</p>
          <div className="flex flex-wrap items-center gap-2"><h1 className="page-title">{event.name}</h1><EventStatusBadge status={event.status} /></div>
          <p className="page-subtitle">{event.venue ?? "Venue not set"} · {formatDate(event.eventStart)}</p>
        </div>
        <div className="flex gap-2">
          {canManage && <>
            <Button asChild variant="outline"><Link href={`/events/${eventId}/settings`}>Settings</Link></Button>
            {event.status === "DRAFT" && publishReview && <PublishReviewButton
              action={publishEventAction.bind(null, eventId)}
              publishReady={publishReady}
              template={publishReview.template}
              hasInvitationTemplate={publishReview.hasInvitationTemplate}
              recipients={publishReview.recipients}
              previewSubject={publishReview.previewSubject}
              previewHtml={publishReview.previewHtml}
              previewError={publishReview.previewError}
              deliveryMode={process.env.MAIL_TRANSPORT === "smtp" ? "SMTP sends email" : "Local preview; no email is sent"}
            />}
          </>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {totals.map(([label, value, section]) => (
          <Link href={`/events/${eventId}/${section}`} key={label} className="group block rounded-md">
            <Stat label={label} value={value} className="transition-colors group-hover:border-sky" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card asChild>
          <section>
            <h2 className="section-title">Schedule &amp; rules</h2>
            <DetailList>
              <dt>Registration</dt><dd>{formatDate(event.registrationStart)} → {formatDate(event.registrationEnd)}</dd>
              <dt>Event</dt><dd>{formatDate(event.eventStart)} → {formatDate(event.eventEnd)}</dd>
              <dt>Ticket validity</dt><dd>{formatDate(event.ticketValidFrom)} → {formatDate(event.ticketValidUntil)}</dd>
              <dt>Description</dt><dd>{event.description ?? "No description."}</dd>
            </DetailList>
            {event.status === "PUBLISHED" && <p className="border-t border-outline pt-3 text-body text-ink-muted">Public registration: <Link href={`/events/${eventId}/register`} className="text-link hover:underline">/events/{eventId}/register</Link></p>}
          </section>
        </Card>

        <Card asChild>
          <section>
            <CardHeader className="items-center"><h2 className="section-title">Committee</h2><Link href={`/events/${eventId}/committee`} className="text-body text-link hover:underline">Open committee</Link></CardHeader>
            {committee.length
              ? <ul className="space-y-2">{committee.slice(0, 3).map((member, index) => <li key={`${member.name}-${index}`} className="rounded-md border border-outline p-2.5"><p className="text-body font-medium text-ink">{member.name}</p><p className="text-body text-ink-muted">{member.position}</p></li>)}</ul>
              : <p className="text-body text-ink-muted">No committee members yet.</p>}
          </section>
        </Card>
      </div>

      <Card asChild>
        <section>
          <div><h2 className="section-title">Event readiness</h2><p className="mt-1 text-xs text-ink-muted">Schedule timezone: Asia/Jakarta (WIB, UTC+07:00).</p></div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {readiness.map((item) => (
              <li key={item.label}>
                <Link href={`/events/${eventId}/${item.href}`} className="block rounded-md border border-outline p-2.5 transition-colors hover:border-outline-strong">
                  <Badge variant={item.ready ? "positive" : "warning"}>{item.ready ? "Ready" : "Needs attention"}</Badge>
                  <p className="mt-2 text-body font-medium text-ink">{item.label}</p>
                  {!item.ready && <p className="mt-1 text-xs text-ink-muted">{item.hint}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Card>

      <ActivityList rows={activity} />
    </section>
  );
}
