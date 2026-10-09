"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { eventInputSchema, eventFormDataToInput, type EventFormState } from "@/lib/validation/events";
import { eventDateInput } from "@/lib/date-time";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { useFeedback } from "@/components/ui/feedback-provider";

type EventFormAction = (state: EventFormState, formData: FormData) => Promise<EventFormState>;
type EventFormValues = Partial<{
  name: string;
  description: string | null;
  venue: string | null;
  capacity: number | null;
  banner: string | null;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  eventStart: Date | null;
  eventEnd: Date | null;
  ticketValidFrom: Date | null;
  ticketValidUntil: Date | null;
}>;

const dateValue = eventDateInput;

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card asChild>
      <section>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <div className="grid gap-3 md:grid-cols-2">{children}</div>
      </section>
    </Card>
  );
}

export function EventForm({ action, initialValues = {}, submitLabel = "Create event", cancelHref = "/events", showCancel = true, error }: { action: EventFormAction; initialValues?: EventFormValues; submitLabel?: string; cancelHref?: string; showCancel?: boolean; error?: string }) {
  const [state, formAction, isPending] = useActionState(action, error ? { formError: error } : {});
  const { confirm, toast } = useFeedback();
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [schedule, setSchedule] = useState<string[]>([]);
  useEffect(() => { if (state.formError) toast(state.formError, "error"); }, [state, toast]);
  useEffect(() => {
    if (!dirty || isPending) return;
    const guard = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") as HTMLAnchorElement | null : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.href === window.location.href) return;
      event.preventDefault(); event.stopPropagation();
      void confirm({ title: "Unsaved event changes", message: "Leave this form without saving your changes?", confirmLabel: "Discard changes", danger: true }).then((approved) => { if (!approved) return; setDirty(false); const url = new URL(link.href); if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`); else window.location.assign(url.href); });
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [dirty, isPending, confirm, router]);
  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0];
  return (
    <form action={formAction} className="space-y-4" noValidate onChange={(event) => { setDirty(true); const result = eventInputSchema.safeParse(eventFormDataToInput(new FormData(event.currentTarget))); setSchedule(result.success ? [] : result.error.issues.filter((issue) => /Start|End|From|Until/.test(String(issue.path[0]))).map((issue) => issue.message)); }}>
      {state.formError && <Alert variant="danger">{state.formError}</Alert>}

      <FormSection title="Basic Information">
        <Field label="Name" error={errorFor("name")} className="md:col-span-2"><Input name="name" defaultValue={initialValues.name ?? ""} /></Field>
        <Field label="Venue" error={errorFor("venue")}><Input name="venue" defaultValue={initialValues.venue ?? ""} /></Field>
        <Field label="Capacity" error={errorFor("capacity")}><Input name="capacity" type="number" min="1" defaultValue={initialValues.capacity ?? ""} /></Field>
        <Field label="Description" error={errorFor("description")} className="md:col-span-2"><Textarea name="description" rows={3} defaultValue={initialValues.description ?? ""} /></Field>
        <Field label="Banner URL (optional)" error={errorFor("banner")} className="md:col-span-2"><Input name="banner" type="url" defaultValue={initialValues.banner ?? ""} /></Field>
      </FormSection>

      <FormSection title="Registration">
        <Field label="Registration start" error={errorFor("registrationStart")}><Input name="registrationStart" type="datetime-local" defaultValue={dateValue(initialValues.registrationStart)} /></Field>
        <Field label="Registration end" error={errorFor("registrationEnd")}><Input name="registrationEnd" type="datetime-local" defaultValue={dateValue(initialValues.registrationEnd)} /></Field>
      </FormSection>

      <FormSection title="Event Schedule">
        <Field label="Event start" error={errorFor("eventStart")}><Input name="eventStart" type="datetime-local" defaultValue={dateValue(initialValues.eventStart)} /></Field>
        <Field label="Event end" error={errorFor("eventEnd")}><Input name="eventEnd" type="datetime-local" defaultValue={dateValue(initialValues.eventEnd)} /></Field>
      </FormSection>

      <FormSection title="Ticket Validity">
        <Field label="Valid from" error={errorFor("ticketValidFrom")}><Input name="ticketValidFrom" type="datetime-local" defaultValue={dateValue(initialValues.ticketValidFrom)} /></Field>
        <Field label="Valid until" error={errorFor("ticketValidUntil")}><Input name="ticketValidUntil" type="datetime-local" defaultValue={dateValue(initialValues.ticketValidUntil)} /></Field>
      </FormSection>

      <Card asChild className="gap-1 p-3">
        <section aria-live="polite">
          <h2 className="text-sm font-semibold text-ink">Schedule review · Asia/Jakarta</h2>
          <p className="text-xs text-ink-muted">All entered times use WIB (UTC+07:00). Registration closes before the event starts; ticket validity must overlap the event.</p>
          {schedule.length
            ? <ul className="mt-1 list-inside list-disc text-body text-danger">{schedule.map((message) => <li key={message}>{message}</li>)}</ul>
            : <p className="mt-1 text-xs text-ink-muted">No conflicting time windows detected. Complete all schedule fields before publishing.</p>}
        </section>
      </Card>

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-2 border-t border-outline bg-surface py-3">
        {showCancel && <Button asChild variant="outline"><Link href={cancelHref}>Cancel</Link></Button>}
        <Button type="submit" variant="primary" loading={isPending}>{isPending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
