import { formatEventDate } from "@/lib/date-time";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { canManageParticipants } from "@/lib/auth/access";
import { getEvent } from "@/services/events";
import { listParticipants } from "@/services/participants";
import { ConfirmActionButton } from "@/components/events/confirm-action-button";
import { approveParticipantAction, waitlistParticipantAction } from "@/app/(dashboard)/events/[eventId]/actions";

import { ModalTrigger } from "@/components/ui/modal";
import { RegistrationFields } from "@/components/events/registration-fields";
import { CopyLinkMenuItem } from "@/components/events/copy-link-button";
import { ParticipantStatusBadge } from "@/components/events/participant-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { OverflowMenu, OverflowMenuFormItem, OverflowMenuItem } from "@/components/ui/overflow-menu";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";

const statuses = ["ALL", "PENDING", "APPROVED", "WAITLIST", "REJECTED", "CANCELLED", "CHECKED_IN"] as const;
const formatDate = formatEventDate;

export default async function ParticipantsPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ search?: string; status?: string; page?: string; notice?: string; error?: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const query = await searchParams;
  const event = await getEvent(eventId);
  if (!event) notFound();
  const status = statuses.includes(query.status as (typeof statuses)[number]) ? query.status as typeof statuses[number] : "ALL";
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const participants = await listParticipants(eventId, { search: query.search, status, page });
  const canManage = canManageParticipants(session.user.role);
  const queryString = `search=${encodeURIComponent(query.search ?? "")}&status=${encodeURIComponent(status)}`;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow"><Link href={`/events/${eventId}`} className="text-link hover:underline">{event.name}</Link> / Participants</p>
          <h1 className="page-title">Participants</h1>
          <p className="page-subtitle">Review registrations and protect event capacity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModalTrigger title="Preview registration form" variant="outline" size="max-w-2xl">
            <div className="space-y-3">
              <Alert variant="info">Preview only. No registration will be submitted. The public form accepts registrations only when this event is published and its registration window is open.</Alert>
              <div><h2 className="section-title">{event.name}</h2><p className="page-subtitle">{formatDate(event.eventStart)} · {event.venue ?? "Venue to be announced"}</p></div>
              <Card asChild>
                <section>
                  <h3 className="section-title">Your details</h3>
                  <RegistrationFields preview />
                  <Button type="button" disabled className="self-start">Submit registration (preview)</Button>
                </section>
              </Card>
              <Button asChild variant="outline"><Link href={`/events/${eventId}/register`} target="_blank" rel="noopener noreferrer">Open public form</Link></Button>
            </div>
          </ModalTrigger>
          <OverflowMenu label="More participant actions">
            <CopyLinkMenuItem path={`/events/${eventId}/register`} label="Copy registration link" />
            <OverflowMenuItem asChild><Link href={`/events/${eventId}`}>Back to overview</Link></OverflowMenuItem>
          </OverflowMenu>
        </div>
      </div>

      {query.notice && <Alert variant="success">{query.notice}</Alert>}
      {query.error && <Alert variant="danger">{query.error}</Alert>}

      <Card asChild className="flex-row flex-wrap items-center gap-2">
        <form>
          <Input name="search" defaultValue={query.search ?? ""} placeholder="Search name, email, phone, company" aria-label="Search participants" className="min-w-[240px] flex-1" />
          <Select name="status" aria-label="Participant status" defaultValue={status} className="w-auto">
            {statuses.map((item) => <option key={item} value={item}>{item === "ALL" ? "All statuses" : item}</option>)}
          </Select>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </Card>

      <Table responsive>
        <Thead><Tr><Th>Name</Th><Th>Company</Th><Th>Contact</Th><Th>Registered</Th><Th>Status</Th><Th className="text-right">Action</Th></Tr></Thead>
        <Tbody>
          {participants.length === 0
            ? <Tr><Td colSpan={6}><EmptyState title={page > 1 ? "No more participants." : "No participants yet."} description="Registration entries will appear here." action={<Link className="text-link hover:underline" href={`/events/${eventId}/register`}>Open public registration form</Link>} /></Td></Tr>
            : participants.map((participant) => {
              const waitlistFormId = `waitlist-${participant.id}`;
              const reviewable = canManage && (participant.status === "PENDING" || participant.status === "WAITLIST");
              return (
                <Tr key={participant.id}>
                  <Td data-label="Name"><Link href={`/events/${eventId}/participants/${participant.id}`} className="font-medium text-link hover:underline">{participant.title ? `${participant.title} ` : ""}{participant.name}</Link></Td>
                  <Td data-label="Company">{participant.company ?? "—"}</Td>
                  <Td data-label="Contact"><span>{participant.email}</span><br /><span className="text-xs text-ink-muted">{participant.phone}</span></Td>
                  <Td data-label="Registered">{formatDate(participant.registeredAt)}</Td>
                  <Td data-label="Status"><ParticipantStatusBadge status={participant.status} /></Td>
                  <Td data-label="Actions" className="text-right">
                    {reviewable
                      ? <div className="flex flex-wrap items-center justify-end gap-1">
                          <form action={approveParticipantAction.bind(null, eventId, participant.id)}><ConfirmActionButton variant="primary" size="sm" message={`Approve ${participant.name} and issue their ticket?`}>Approve</ConfirmActionButton></form>
                          {/* The waitlist form sits outside the menu so its confirm dialog survives the menu closing. */}
                          {participant.status === "PENDING" && <form id={waitlistFormId} action={waitlistParticipantAction.bind(null, eventId, participant.id)} className="hidden" />}
                          <OverflowMenu label={`Actions for ${participant.name}`} size="icon-sm">
                            {participant.status === "PENDING" && <OverflowMenuFormItem formId={waitlistFormId} confirm={{ message: `Move ${participant.name} to the waitlist?`, confirmLabel: "Waitlist" }}>Waitlist</OverflowMenuFormItem>}
                            <OverflowMenuItem asChild><Link href={`/events/${eventId}/participants/${participant.id}`}>Review</Link></OverflowMenuItem>
                          </OverflowMenu>
                        </div>
                      : <Button asChild variant="outline" size="sm"><Link href={`/events/${eventId}/participants/${participant.id}`}>Review</Link></Button>}
                  </Td>
                </Tr>
              );
            })}
        </Tbody>
      </Table>

      <div className="flex items-center justify-between text-body text-ink-muted">
        <span>Page {page}</span>
        <div className="flex gap-2">
          {page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/events/${eventId}/participants?page=${page - 1}&${queryString}`}>Previous</Link></Button>}
          {participants.length === 25 && <Button asChild variant="outline" size="sm"><Link href={`/events/${eventId}/participants?page=${page + 1}&${queryString}`}>Next</Link></Button>}
        </div>
      </div>
    </section>
  );
}
