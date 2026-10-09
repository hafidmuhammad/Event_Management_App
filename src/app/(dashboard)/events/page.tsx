import { formatEventDate } from "@/lib/date-time";
import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { canManageEvents } from "@/lib/auth/access";
import { listEvents, type EventStatus } from "@/services/events";
import { EventForm } from "@/components/events/event-form";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { ModalTrigger } from "@/components/ui/modal";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { createEventAction } from "./actions";

const statuses: Array<EventStatus | "ALL"> = ["ALL", "DRAFT", "PUBLISHED", "ONGOING", "FINISHED", "CANCELLED"];
const formatDate = formatEventDate;

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const params = await searchParams;
  const status = statuses.includes(params.status as EventStatus) ? params.status as EventStatus : "ALL";
  const rows = await listEvents({ search: params.search, status });
  const canManage = canManageEvents(session.user.role);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Operations</p><h1 className="page-title">Events</h1><p className="page-subtitle">Create, publish, and monitor event capacity.</p></div>
        {canManage && <ModalTrigger title="Create event" size="max-w-4xl"><EventForm action={createEventAction} showCancel={false} /></ModalTrigger>}
      </div>

      <Card asChild className="flex-row flex-wrap items-center gap-2">
        <form>
          <label className="min-w-[220px] flex-1"><span className="sr-only">Search events</span><Input name="search" defaultValue={params.search ?? ""} placeholder="Search event or venue" /></label>
          <Select name="status" aria-label="Event status" defaultValue={status} className="w-auto">
            <option value="ALL">All statuses</option>
            {statuses.filter((item) => item !== "ALL").map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </Card>

      <Table responsive>
        <Thead><Tr><Th>Event</Th><Th>Date</Th><Th>Venue</Th><Th>Capacity</Th><Th>Participants</Th><Th>Status</Th><Th className="text-right">Action</Th></Tr></Thead>
        <Tbody>
          {rows.length === 0
            ? <Tr><Td colSpan={7}><EmptyState title="No events yet" action={canManage ? <ModalTrigger title="Create the first event" variant="outline" triggerSize="sm" size="max-w-4xl"><EventForm action={createEventAction} showCancel={false} /></ModalTrigger> : undefined} /></Td></Tr>
            : rows.map(({ event, participantCount }) => (
              <Tr key={event.id}>
                <Td data-label="Event"><Link className="font-medium text-link hover:underline" href={`/events/${event.id}`}>{event.name}</Link></Td>
                <Td data-label="Date">{formatDate(event.eventStart)}</Td>
                <Td data-label="Venue">{event.venue ?? "—"}</Td>
                <Td data-label="Capacity">{event.capacity ?? "∞"}</Td>
                <Td data-label="Participants">{participantCount}</Td>
                <Td data-label="Status"><EventStatusBadge status={event.status} /></Td>
                <Td data-label="Action" className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/events/${event.id}`}>Open</Link></Button></Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
    </section>
  );
}
