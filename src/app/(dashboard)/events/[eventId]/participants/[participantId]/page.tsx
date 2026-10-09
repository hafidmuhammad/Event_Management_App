import { formatEventDate } from "@/lib/date-time";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { canManageParticipants } from "@/lib/auth/access";
import { getEvent } from "@/services/events";
import { getParticipantForEvent } from "@/services/participants";
import { ConfirmActionButton } from "@/components/events/confirm-action-button";
import { approveParticipantAction, cancelParticipantAction, rejectParticipantAction, waitlistParticipantAction } from "@/app/(dashboard)/events/[eventId]/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/controls";
import { DetailList } from "@/components/ui/detail-list";
import { Field } from "@/components/ui/field";
import { OverflowMenu, OverflowMenuFormItem } from "@/components/ui/overflow-menu";

export default async function ParticipantDetailPage({ params }: { params: Promise<{ eventId: string; participantId: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId, participantId } = await params;
  const [event, participant] = await Promise.all([getEvent(eventId), getParticipantForEvent(eventId, participantId)]);
  if (!event || !participant) notFound();
  const canManage = canManageParticipants(session.user.role);
  const awaitingReview = participant.status === "PENDING" || participant.status === "WAITLIST";
  const cancellable = awaitingReview || participant.status === "APPROVED";
  const waitlistFormId = `waitlist-${participant.id}`;
  const cancelFormId = `cancel-${participant.id}`;
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div><p className="eyebrow"><Link href={`/events/${eventId}/participants`} className="text-link hover:underline">Participants</Link> / Review</p><h1 className="page-title">{participant.name}</h1><p className="page-subtitle">{event.name}</p></div>
      <Card>
        <DetailList>
          <dt>Title</dt><dd>{participant.title ?? "—"}</dd>
          <dt>Company</dt><dd>{participant.company ?? "—"}</dd>
          <dt>Job title</dt><dd>{participant.jobTitle ?? "—"}</dd>
          <dt>Phone</dt><dd>{participant.phone}</dd>
          <dt>Email</dt><dd>{participant.email}</dd>
          <dt>Registered</dt><dd>{formatEventDate(participant.registeredAt)}</dd>
          <dt>Status</dt><dd>{participant.status}</dd>
          {participant.rejectionReason && <><dt>Rejection reason</dt><dd>{participant.rejectionReason}</dd></>}
        </DetailList>
      </Card>
      {canManage && (
        <div className="flex flex-wrap items-end gap-2">
          {awaitingReview && <>
            <form action={approveParticipantAction.bind(null, eventId, participant.id)}><ConfirmActionButton variant="primary" size="md" message={`Approve ${participant.name} and issue a ticket?`}>Approve</ConfirmActionButton></form>
            <form action={rejectParticipantAction.bind(null, eventId, participant.id)} className="flex flex-wrap items-end gap-2">
              <Field label="Rejection reason"><Input name="rejectionReason" required placeholder="Explain the reason" /></Field>
              <ConfirmActionButton variant="danger" size="md" message="Reject this registration?">Reject</ConfirmActionButton>
            </form>
          </>}
          {/* These forms sit outside the menu so their confirm dialogs survive the menu closing. */}
          {awaitingReview && participant.status === "PENDING" && <form id={waitlistFormId} action={waitlistParticipantAction.bind(null, eventId, participant.id)} className="hidden" />}
          {cancellable && <form id={cancelFormId} action={cancelParticipantAction.bind(null, eventId, participant.id)} className="hidden" />}
          {(cancellable || (awaitingReview && participant.status === "PENDING")) && (
            <OverflowMenu label="More registration actions">
              {awaitingReview && participant.status === "PENDING" && <OverflowMenuFormItem formId={waitlistFormId} confirm={{ message: "Move this participant to the waitlist?", confirmLabel: "Move to waitlist" }}>Move to waitlist</OverflowMenuFormItem>}
              {cancellable && <OverflowMenuFormItem formId={cancelFormId} danger confirm={{ message: "Cancel this registration and revoke its ticket?", confirmLabel: "Cancel registration" }}>Cancel registration</OverflowMenuFormItem>}
            </OverflowMenu>
          )}
        </div>
      )}
      <Link href={`/events/${eventId}/participants`} className="inline-block text-body text-link hover:underline">← Back to participants</Link>
    </section>
  );
}
