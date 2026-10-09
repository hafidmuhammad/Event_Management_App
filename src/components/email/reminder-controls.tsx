"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { ActionForm, type ActionResult } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { reminderPresets } from "@/lib/email-schedule";

export type ReminderTemplateOption = { id: string; name: string; draft: boolean };

/** Secondary submit button for the scheme form (ActionForm's own button is always primary). */
export function SchemeSubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="outline" loading={pending}>{children}</Button>;
}

/** "Add reminder": pick a template and how long before the event it goes out. */
export function AddReminderButton({ templates, action, disabled }: { templates: ReminderTemplateOption[]; action: (formData: FormData) => Promise<ActionResult>; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(String(reminderPresets[2].minutes));
  return <>
    <Button type="button" variant="primary" disabled={disabled || !templates.length} onClick={() => setOpen(true)} aria-haspopup="dialog"><Plus aria-hidden="true" />Add reminder</Button>
    <Modal title="Add reminder" size="max-w-lg" open={open} onOpenChange={setOpen}>
      <ActionForm action={action} submitLabel="Schedule reminder" pendingLabel="Scheduling…">
        <p className="text-xs text-ink-muted">The email goes to the template&apos;s recipients at the chosen time before the event starts. Nothing is sent now.</p>
        <Field label="Email template" required>
          <Select name="templateId" required defaultValue="">
            <option value="" disabled>Choose a template</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.draft ? " (draft)" : ""}</option>)}
          </Select>
        </Field>
        <Field label="Send" required>
          <Select name="when" value={when} onChange={(event) => setWhen(event.target.value)}>
            {reminderPresets.map((preset) => <option key={preset.minutes} value={preset.minutes}>{preset.label}</option>)}
            <option value="custom">Custom time…</option>
          </Select>
        </Field>
        {when === "custom" && <div className="grid grid-cols-[1fr_9rem] gap-3">
          <Field label="Amount"><Input name="amount" type="number" min="1" max="129600" step="1" defaultValue="2" required /></Field>
          <Field label="Unit"><Select name="unit" defaultValue="hours"><option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option></Select></Field>
        </div>}
        <p className="text-xs text-ink-subtle">Between 5 minutes and 90 days before the event starts. A draft template waits until you mark it Ready.</p>
      </ActionForm>
    </Modal>
  </>;
}
