import { ActionMenu } from "@/components/ui/action-menu";
import { ModalTrigger } from "@/components/ui/modal";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommitteeEditor } from "@/components/events/committee-editor";
import { saveCommitteeAction } from "@/app/(dashboard)/events/actions";
import { canManageCommittee } from "@/lib/auth/access";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";
import { encryptEventId } from "@/lib/event-share";
import { CopyLinkButton } from "@/components/events/copy-link-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table } from "@/components/ui/table";

export default async function CommitteePage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();
  const committee = Array.isArray(event.committeeJson) ? event.committeeJson : [];
  const canManage = canManageCommittee(session.user.role);
  const shareToken = encryptEventId(eventId);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{event.name} / Committee</p>
          <h1 className="page-title">Committee</h1>
          <p className="page-subtitle">Build the full event team list and present it as closing credits.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionMenu label="Committee preview and share actions">
            <CopyLinkButton path={`/events/committee-display/${shareToken}`} />
            <ModalTrigger title="Preview committee credits" triggerClass={buttonVariants({ variant: "outline" })} size="max-w-5xl">
              <iframe
                title="Committee credits preview"
                src={`/events/committee-display/${shareToken}`}
                className="h-[70dvh] w-full rounded-md border border-outline"
                allowFullScreen
              />
              <p className="mt-3 text-xs text-ink-muted">Copy the share link to open these credits on the event screen without login.</p>
            </ModalTrigger>
          </ActionMenu>
          <Button asChild variant="outline"><Link href={`/events/${eventId}`}>Back to overview</Link></Button>
        </div>
      </div>

      <section className="rounded-md border border-outline bg-surface p-4">
        {canManage ? (
          <CommitteeEditor initialMembers={committee} action={saveCommitteeAction.bind(null, eventId)} />
        ) : committee.length ? (
          <Table>
              <caption className="sr-only">Committee members</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-12">#</th>
                  <th scope="col">Name</th>
                  <th scope="col">Position</th>
                </tr>
              </thead>
              <tbody>
                {committee.map((member, index) => (
                  <tr key={`${member.name}-${index}`}>
                    <td className="text-ink-muted tabular-nums">{index + 1}</td>
                    <td className="font-medium">{member.name}</td>
                    <td>{member.position}</td>
                  </tr>
                ))}
              </tbody>
          </Table>
        ) : (
          <p className="text-sm text-ink-muted">No committee members yet.</p>
        )}
      </section>
    </section>
  );
}
