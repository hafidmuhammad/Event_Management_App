/* eslint-disable @next/next/no-img-element -- award assets can be local uploads or curated URLs. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";
import { getAwards } from "@/services/awards";
import { listParticipants } from "@/services/participants";
import { addAwardAction, deleteAwardAction, reorderAwardsAction, updateAwardAction } from "../phase5-actions";
import { AwardReorderForm } from "@/components/events/award-reorder-form";
import { AssetUploadField } from "@/components/events/asset-upload-field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { ModalTrigger } from "@/components/ui/modal";
import { OverflowMenu, OverflowMenuFormItem } from "@/components/ui/overflow-menu";
import { Stat } from "@/components/ui/stat";
import { Award as AwardIcon } from "lucide-react";

type Person = { id: string; name: string; company: string | null };
type AwardValues = { name?: string; recipientName?: string; participantId?: string | null; subtitle?: string | null; image?: string | null };

/** Fields shared by the add and edit forms. */
function AwardFields({ people, values = {} }: { people: Person[]; values?: AwardValues }) {
  return (
    <>
      <Field label="Award title"><Input name="name" required defaultValue={values.name} placeholder={values.name === undefined ? "Innovation Award" : undefined} /></Field>
      <Field label="Recipient"><Input name="recipientName" required defaultValue={values.recipientName} placeholder={values.recipientName === undefined ? "Recipient or organization" : undefined} /></Field>
      <Field label="Event participant" className="md:col-span-2">
        <Select name="participantId" defaultValue={values.participantId ?? ""}>
          <option value="">External recipient / none</option>
          {people.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.company ?? "No company"}</option>)}
        </Select>
      </Field>
      <Field label="Citation" className="md:col-span-2"><Input name="subtitle" defaultValue={values.subtitle ?? undefined} placeholder="For outstanding contribution…" /></Field>
    </>
  );
}

export default async function AwardsPage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const query = await searchParams;
  const [event, awards, people] = await Promise.all([getEvent(eventId), getAwards(eventId), listParticipants(eventId, { status: "ALL", page: 1, pageSize: 50 })]);
  if (!event || !awards) notFound();
  const canManage = session.user.role !== "RECEPTIONIST";
  const sortedAwards = [...awards.awards.items].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Awards</p><h1 className="page-title">Recognition studio</h1><p className="page-subtitle">Create polished award moments for the event screen and final program.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline"><Link href={`/events/${eventId}/display/awards`}>Open display mode</Link></Button>
          {canManage && (
            <ModalTrigger title="Add award" size="max-w-3xl">
              <form action={addAwardAction.bind(null, eventId)} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2"><AwardFields people={people} /></div>
                <AssetUploadField name="image" kind="award" label="Award image" />
                <div className="sticky bottom-0 flex justify-end border-t border-outline bg-surface py-3"><Button type="submit" variant="primary">Add award</Button></div>
              </form>
            </ModalTrigger>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total awards" value={sortedAwards.length} />
        <Stat label="Participant awards" value={sortedAwards.filter((award) => award.participantId).length} />
        <Stat label="External recipients" value={sortedAwards.filter((award) => !award.participantId).length} />
      </div>
      {query.notice && <Alert variant="success">{query.notice}</Alert>}
      {query.error && <Alert variant="danger">{query.error}</Alert>}
      {canManage && sortedAwards.length > 1 && <AwardReorderForm initialIds={sortedAwards.map((item) => item.id)} labels={Object.fromEntries(sortedAwards.map((item) => [item.id, item.name]))} action={reorderAwardsAction.bind(null, eventId)} />}

      <div className="grid gap-4 xl:grid-cols-2">
        {sortedAwards.map((award) => {
          const deleteFormId = `delete-award-${award.id}`;
          return (
            <Card key={award.id} asChild className="gap-0 overflow-hidden p-0">
              <article>
                <header className="flex items-start justify-between gap-4 border-b border-outline bg-gradient-to-br from-sky-soft to-surface p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {award.image
                      ? <img src={award.image} alt="" className="size-16 shrink-0 rounded-md object-cover" />
                      : <div className="grid size-16 shrink-0 place-items-center rounded-md bg-sky-soft"><AwardIcon className="size-8 text-accent" aria-hidden="true" /></div>}
                    <div className="min-w-0">
                      <Badge>#{award.displayOrder}</Badge>
                      <h2 className="mt-2 truncate text-base font-semibold text-ink">{award.name}</h2>
                      <p className="mt-1 text-body text-ink-muted">{award.recipientName}</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <ModalTrigger title="Edit award" variant="outline" triggerSize="sm" size="max-w-3xl">
                        <form action={updateAwardAction.bind(null, eventId, award.id)} className="grid gap-3 md:grid-cols-2">
                          <AwardFields people={people} values={award} />
                          <div className="md:col-span-2"><AssetUploadField name="image" kind="award" defaultValue={award.image ?? ""} label="Award image" /></div>
                          <div className="sticky bottom-0 flex justify-end border-t border-outline bg-surface py-3 md:col-span-2"><Button type="submit" variant="primary">Save award</Button></div>
                        </form>
                      </ModalTrigger>
                      {/* The delete form sits outside the menu so its confirm dialog survives the menu closing. */}
                      <form id={deleteFormId} action={deleteAwardAction.bind(null, eventId, award.id)} className="hidden" />
                      <OverflowMenu label={`Actions for ${award.name}`} size="icon-sm">
                        <OverflowMenuFormItem formId={deleteFormId} danger confirm={{ message: "Delete this award?", confirmLabel: "Delete" }}>Delete</OverflowMenuFormItem>
                      </OverflowMenu>
                    </div>
                  )}
                </header>
                {!canManage && <div className="p-4">{award.subtitle && <p className="text-body text-ink-muted">{award.subtitle}</p>}</div>}
              </article>
            </Card>
          );
        })}
        {!sortedAwards.length && <EmptyState className="xl:col-span-2" title="No awards yet." description="Add an award to start building the recognition screen." />}
      </div>
    </section>
  );
}
