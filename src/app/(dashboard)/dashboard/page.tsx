import Link from "next/link";
import { BadgeCheck, ClipboardList, ScanLine } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { getDashboardSummary, listEvents } from "@/services/events";
import { failedEmailCount, listActivity } from "@/services/activity";
import { ActivityList } from "@/components/events/activity-list";
import { formatEventDate } from "@/lib/date-time";

const workflow = [
  { step: 1, icon: ClipboardList, title: "Prepare", description: "Set registration and ticket validity before publishing." },
  { step: 2, icon: BadgeCheck, title: "Approve", description: "Approved participants receive one secure ticket." },
  { step: 3, icon: ScanLine, title: "Check in", description: "Receptionists scan QR or use manual search." },
];

export default async function DashboardPage() {
  const [summary, rows, failedEmails, activity] = await Promise.all([getDashboardSummary(), listEvents({ pageSize: 5 }), failedEmailCount(), listActivity()]);
  return (
    <div className="space-y-section">
      <Card asChild className="items-start p-5">
        <section>
          <StatusPill>{summary.pending ? `${summary.pending} awaiting approval` : "Event operations"}</StatusPill>
          <h1 className="max-w-2xl text-xl font-semibold leading-tight tracking-tight text-ink">Keep every event moving.</h1>
          <p className="max-w-2xl text-sm leading-6 text-ink-muted">Create an event, approve participants, issue tickets, and run check-in from one focused workspace.</p>
          <Button asChild variant="primary"><Link href="/events">Manage events</Link></Button>
        </section>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Live workspace totals">
        {[["Events", summary.totalEvents], ["Active events", summary.activeEvents], ["Pending approval", summary.pending], ["Checked in", summary.checkedIn]].map(([label, value]) => <Stat key={label} label={label} value={value} />)}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">Event workspace</h2>
          <Link href="/events" className="text-body text-link hover:underline">View all events</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ event, participantCount }) => (
            <Card key={event.id} asChild className="gap-1.5 transition-colors hover:border-sky">
              <Link href={`/events/${event.id}`}>
                <CardHeader className="flex-wrap gap-2"><CardTitle>{event.name}</CardTitle><StatusPill>{event.status}</StatusPill></CardHeader>
                <p className="text-body text-ink-muted">{event.venue ?? "Venue not set"} · {participantCount} registered</p>
                <p className="text-xs text-ink-muted">{event.eventStart ? formatEventDate(event.eventStart) : "Schedule not set"}</p>
              </Link>
            </Card>
          ))}
          {!rows.length && <EmptyState className="sm:col-span-2" title="No events yet" description="Open Events to create your first draft." />}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Stat label="Failed email deliveries" value={failedEmails} hint={failedEmails ? "Open the event Email tab to inspect its delivery report." : "No failed deliveries recorded."} />
        <Stat label="Readiness warnings in recent events" value={rows.filter(({ event }) => !event.eventStart || !event.ticketValidFrom || event.status === "DRAFT").length} hint="Open an event overview to complete its readiness checklist." />
      </section>

      <ActivityList rows={activity} />

      <section aria-labelledby="getting-started-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your workspace</p>
            <h2 id="getting-started-heading" className="mt-1 text-base font-semibold text-ink">Operational workflow</h2>
          </div>
          <StatusPill>Ticketing ready</StatusPill>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {workflow.map(({ step, icon: Icon, title, description }) => (
            <Card key={title} asChild className="gap-1.5">
              <article>
                <div className="mb-1 grid size-7 place-items-center rounded-md bg-sky-soft text-link [&_svg]:size-[var(--icon-size)]" aria-hidden="true"><Icon /></div>
                <h3 className="text-sm font-semibold text-ink"><span className="sr-only">Step {step}: </span>{title}</h3>
                <p className="text-body leading-5 text-ink-muted">{description}</p>
              </article>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
