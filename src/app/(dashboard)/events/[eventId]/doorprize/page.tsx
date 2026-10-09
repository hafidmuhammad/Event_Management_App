import { formatEventDate } from "@/lib/date-time";
/* eslint-disable @next/next/no-img-element -- prize assets can be local uploads or curated URLs. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth/authorization";
import { getDoorprize, listWinnerParticipants } from "@/services/doorprize";
import { getDoorprizeEligibleCount, getDoorprizeCandidates } from "@/services/doorprize";
import { addPrizeAction, deletePrizeAction, drawPrizeAction, removeWinnerAction, updatePrizeAction } from "../phase5-actions";
import { ConfirmActionButton } from "@/components/events/confirm-action-button";
import { AssetUploadField } from "@/components/events/asset-upload-field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { ModalTrigger } from "@/components/ui/modal";
import { OverflowMenu, OverflowMenuFormItem } from "@/components/ui/overflow-menu";

const formatDrawnAt = formatEventDate;

type PrizeValues = { name?: string; category?: string; quantity?: number };

/** Fields shared by the add and edit forms. The edit form keeps per-prize aria-labels so each field stays distinguishable. */
function PrizeFields({ values }: { values?: PrizeValues }) {
  const editing = values?.name !== undefined;
  const label = (field: string) => (editing ? `${field} for ${values?.name}` : undefined);
  return (
    <>
      <Field label={editing ? "Name" : "Prize name"}><Input name="name" required defaultValue={values?.name} placeholder={editing ? undefined : "Wireless headset"} aria-label={label("Name")} /></Field>
      <Field label="Winner category"><Input name="category" required defaultValue={values?.category ?? "Doorprize"} placeholder={editing ? undefined : "Grand Prize / Runner-up"} aria-label={label("Category")} /></Field>
      <Field label="Winner count"><Input name="quantity" required type="number" min="1" max="100" defaultValue={values?.quantity ?? 1} aria-label={label("Winner count")} /></Field>
    </>
  );
}

export default async function DoorprizePage({ params, searchParams }: { params: Promise<{ eventId: string }>; searchParams: Promise<{ notice?: string; error?: string }> }) {
  const session = await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST");
  const { eventId } = await params;
  const query = await searchParams;
  const doorprize = await getDoorprize(eventId);
  if (!doorprize) notFound();
  const participants = await listWinnerParticipants(eventId, doorprize.doorprize);
  const canManage = session.user.role !== "RECEPTIONIST";
  const eligibleCount = await getDoorprizeEligibleCount(eventId, doorprize.doorprize);
  const candidates = await getDoorprizeCandidates(eventId, doorprize.doorprize);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Doorprize</p><h1 className="page-title">Prize draw center</h1><p className="page-subtitle">Draw checked-in attendees with a clear winner count and prize category.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline"><Link href={`/events/${eventId}/display/doorprize`}>Open display mode</Link></Button>
          {canManage && (
            <ModalTrigger title="Add prize" size="max-w-3xl">
              <form action={addPrizeAction.bind(null, eventId)} className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2"><PrizeFields /></div>
                <AssetUploadField name="image" kind="prize" label="Prize image" />
                <div className="sticky bottom-0 flex justify-end border-t border-outline bg-surface py-3"><Button type="submit" variant="primary">Add prize</Button></div>
              </form>
            </ModalTrigger>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="positive">Eligible: {eligibleCount} checked-in</Badge>
        <ModalTrigger title="Review draw candidates" variant="outline" triggerSize="sm" size="max-w-2xl">
          <p className="text-body text-ink-muted">{eligibleCount} eligible checked-in attendees. Showing up to 100 names; eligibility is rechecked during the draw.</p>
          <ul className="mt-3 divide-y divide-outline">
            {candidates.map((candidate) => <li key={candidate.id} className="py-2 text-body">{candidate.name}{candidate.company ? ` · ${candidate.company}` : ""}</li>)}
            {!candidates.length && <li><EmptyState title="No eligible candidates." /></li>}
          </ul>
        </ModalTrigger>
        <Badge>Multiple wins: {doorprize.doorprize.settings.allowMultipleWin ? "Allowed" : "Disabled"}</Badge>
      </div>

      {query.notice && <Alert variant="success">{query.notice}</Alert>}
      {query.error && <Alert variant="danger">{query.error}</Alert>}

      <div className="grid gap-4 xl:grid-cols-2">
        {doorprize.doorprize.prizes.map((prize) => {
          const deleteFormId = `delete-prize-${prize.id}`;
          const slotsLeft = prize.quantity - prize.winners.length;
          return (
            <Card key={prize.id} asChild className="gap-0 overflow-hidden p-0">
              <article>
                <header className="flex items-start justify-between gap-4 border-b border-outline bg-gradient-to-br from-sky-soft to-surface p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {prize.image
                      ? <img src={prize.image} alt="" className="size-14 shrink-0 rounded-md object-cover" />
                      : <div className="grid size-14 shrink-0 place-items-center rounded-md bg-sky-soft text-link"><Sparkles className="size-6" aria-hidden="true" /></div>}
                    <div className="min-w-0">
                      <Badge>{prize.category}</Badge>
                      <h2 className="mt-2 truncate text-base font-semibold text-ink">{prize.name}</h2>
                      <p className="mt-1 text-body text-ink-muted">{prize.winners.length} of {prize.quantity} winners selected</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    {canManage && prize.winners.length < prize.quantity && <form action={drawPrizeAction.bind(null, eventId, prize.id)}><ConfirmActionButton variant="primary" size="md" disabled={!eligibleCount} message={`Draw a winner for ${prize.name} from ${eligibleCount} eligible attendees?`}>Draw winner</ConfirmActionButton></form>}
                    {prize.winners.length >= prize.quantity && <Badge variant="positive">Complete</Badge>}
                    {canManage && (
                      <ModalTrigger title="Edit prize" variant="outline" triggerSize="md" size="max-w-3xl">
                        <form action={updatePrizeAction.bind(null, eventId, prize.id)} className="grid gap-3 md:grid-cols-2">
                          <PrizeFields values={{ name: prize.name, category: prize.category, quantity: prize.quantity }} />
                          <AssetUploadField name="image" kind="prize" defaultValue={prize.image ?? ""} label="Prize image" />
                          <div className="sticky bottom-0 flex justify-end border-t border-outline bg-surface py-3 md:col-span-2"><Button type="submit" variant="primary">Save prize</Button></div>
                        </form>
                      </ModalTrigger>
                    )}
                    {canManage && prize.winners.length === 0 && <>
                      {/* The delete form sits outside the menu so its confirm dialog survives the menu closing. */}
                      <form id={deleteFormId} action={deletePrizeAction.bind(null, eventId, prize.id)} className="hidden" />
                      <OverflowMenu label={`Actions for ${prize.name}`}>
                        <OverflowMenuFormItem formId={deleteFormId} danger confirm={{ message: "Delete this prize?", confirmLabel: "Delete" }}>Delete</OverflowMenuFormItem>
                      </OverflowMenu>
                    </>}
                  </div>
                </header>

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-ink">Selected winners</h3><span className="text-xs text-ink-muted">{slotsLeft} slot{slotsLeft === 1 ? "" : "s"} left</span></div>
                  {prize.winners.length > 0
                    ? <ul className="space-y-2">
                        {prize.winners.map((winner) => {
                          const participant = participants.get(winner.participantId);
                          const removeFormId = `remove-winner-${prize.id}-${winner.participantId}`;
                          return (
                            <li key={`${prize.id}-${winner.participantId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-outline bg-surface-sunken p-2.5">
                              <span className="flex items-center gap-3">
                                <span className="grid size-8 place-items-center rounded-full bg-success-soft text-success-ink"><Check className="size-4" aria-hidden="true" /></span>
                                <span><strong className="block text-body text-ink">{participant?.name ?? "Participant unavailable"}</strong>{participant?.company && <small className="text-ink-muted">{participant.company}</small>}<small className="ml-2 text-ink-muted">{formatDrawnAt(winner.drawnAt)}</small></span>
                              </span>
                              {canManage && <>
                                <form id={removeFormId} action={removeWinnerAction.bind(null, eventId, prize.id, winner.participantId)} className="hidden" />
                                <OverflowMenu label={`Actions for ${participant?.name ?? "winner"}`} size="icon-sm">
                                  <OverflowMenuFormItem formId={removeFormId} danger confirm={{ message: "Remove current winner and redraw later?", confirmLabel: "Remove winner" }}>Remove winner</OverflowMenuFormItem>
                                </OverflowMenu>
                              </>}
                            </li>
                          );
                        })}
                      </ul>
                    : <div className="rounded-md border border-dashed border-outline p-5 text-center">
                        <p className="text-body text-ink-muted">No winners yet.</p>
                        {canManage && <p className="mt-1 text-xs text-ink-muted">{eligibleCount ? "Draw winner selects a checked-in attendee." : "No eligible attendees. Complete check-in or review existing winners before drawing."}</p>}
                      </div>}
                </div>
              </article>
            </Card>
          );
        })}
        {!doorprize.doorprize.prizes.length && <EmptyState className="xl:col-span-2" title="No prizes yet." description="Add a prize to start a checked-in winner draw." />}
      </div>
    </section>
  );
}
