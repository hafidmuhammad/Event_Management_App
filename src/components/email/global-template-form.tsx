"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { EmailBuilder } from "./email-builder";
import { ComposeFooter, ComposeLine, ComposeRow, ComposeRowLabel } from "./compose-parts";
import { emailTypes, type EmailContent } from "@/lib/validation/email";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { useFeedback } from "@/components/ui/feedback-provider";
import type { ActionResult } from "@/components/ui/action-form";

export type GlobalTemplate = { id: string; name: string; description: string | null; type: string; subject: string; content: EmailContent };

function SaveButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" loading={pending}>{pending ? "Saving…" : "Save to library"}</Button>;
}

/**
 * Compose form for the global template library. Global templates have no
 * recipients and no event scope, so they can never trigger a delivery.
 */
export function GlobalTemplateForm({ action, template, variables }: { action: (formData: FormData) => Promise<ActionResult>; template?: GlobalTemplate; variables?: Record<string, string> }) {
  const { toast } = useFeedback();
  const [subject, setSubject] = useState(template?.subject ?? "");
  return <form
    className="flex min-h-full flex-col"
    action={async (data) => {
      try {
        const result = await action(data);
        if (!result.ok) { toast(result.error ?? "Template could not be saved.", "error"); return; }
        toast(result.notice ?? "Global template saved.");
        window.dispatchEvent(new Event("app:process-complete"));
      } catch { toast("Unable to save the global template. Check your connection and try again.", "error"); }
    }}
  >
    {template && <input type="hidden" name="id" value={template.id} />}
    <div className="grid gap-3 border-b border-outline-soft px-4 py-3 sm:grid-cols-2">
      <Field label="Template name"><Input name="name" required maxLength={160} defaultValue={template?.name} placeholder="Standard invitation" /></Field>
      <Field label="Email type"><Select name="type" defaultValue={template?.type ?? "CUSTOM"}>{emailTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</Select></Field>
      <Field label="Description (optional)" className="sm:col-span-2"><Input name="description" maxLength={500} defaultValue={template?.description ?? ""} placeholder="When to use this template" /></Field>
    </div>
    <ComposeRow>
      <ComposeRowLabel>Subject</ComposeRowLabel>
      <ComposeLine name="subject" required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Welcome {{participant.name}} to {{event.name}}" aria-label="Subject" />
    </ComposeRow>
    <p className="px-4 py-2 text-xs text-ink-muted">Global templates are blueprints. They carry no recipients and are never broadcast — apply one inside an event to send.</p>
    <div className="flex-1"><EmailBuilder initial={template?.content} variables={variables} subject={subject} /></div>
    <ComposeFooter><SaveButton /><p className="text-xs text-ink-muted">Saving a global template never sends an email.</p></ComposeFooter>
  </form>;
}
