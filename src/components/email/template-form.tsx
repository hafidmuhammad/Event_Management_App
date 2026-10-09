"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { EmailBuilder } from "./email-builder";
import { RecipientEditor, type ContactListOption, type RecipientValue } from "./recipient-editor";
import { contentSchema, emailTypes, type EmailContent } from "@/lib/validation/email";
import { ComposeFooter, ComposeLine, ComposeRow, ComposeRowLabel } from "./compose-parts";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { useFeedback } from "@/components/ui/feedback-provider";
import { Dialog } from "@/components/ui/dialog";
import { Library } from "lucide-react";

export type GlobalTemplateOption = { id: string; name: string; description: string | null; type: string; subject: string; content: EmailContent };
type Template = { id: string; name: string; type: string; subject: string; content: EmailContent; recipient: RecipientValue };

const emptyRecipient: RecipientValue = { to: { type: "APPROVED", emails: [], contactListIds: [] }, cc: [], bcc: [], ccContactListIds: [], bccContactListIds: [] };

function SaveTemplateButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" loading={pending}>{pending ? "Saving…" : "Save template"}</Button>;
}

function GlobalTemplatePicker({ options, onApply }: { options: GlobalTemplateOption[]; onApply: (option: GlobalTemplateOption) => void }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><Library aria-hidden="true" />From library</Button>
    {open && <Dialog title="Global email templates" size="max-w-2xl" onClose={() => setOpen(false)}>
      <p className="mb-3 text-xs text-ink-muted">Applying a template replaces the subject and message body of this draft. Recipients stay as configured.</p>
      <ul className="divide-y divide-outline">
        {options.map((option) => <li key={option.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="break-words text-body font-semibold text-ink">{option.name}</p>
            <p className="mt-0.5 break-words text-xs text-ink-muted">{option.subject}</p>
            {option.description && <p className="mt-1 break-words text-xs text-ink-muted">{option.description}</p>}
          </div>
          <Button type="button" variant="primary" size="sm" onClick={() => { onApply(option); setOpen(false); }}>Apply</Button>
        </li>)}
        {!options.length && <li><EmptyState title="No global templates yet." description="Create one from Library in the sidebar." /></li>}
      </ul>
    </Dialog>}
  </>;
}

export function TemplateForm({ action, template, eventId, variables, contactLists = [], globalTemplates = [] }: {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  template?: Template;
  eventId: string;
  variables?: Record<string, string>;
  contactLists?: ContactListOption[];
  globalTemplates?: GlobalTemplateOption[];
}) {
  const form = useRef<HTMLFormElement>(null);
  const { confirm, toast } = useFeedback();
  const [restored, setRestored] = useState<Template | undefined>(template);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState("Draft recovery available on this device. Save template to apply changes.");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [deliveryStatus, setDeliveryStatus] = useState<"DRAFT" | "READY">(template?.content.deliveryStatus ?? "DRAFT");
  const key = `email-draft:${eventId}:${template?.id ?? "new"}`;

  useEffect(() => {
    let active = true;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const draft = JSON.parse(saved) as Template;
        if (contentSchema.safeParse(draft.content).success && typeof draft.name === "string" && typeof draft.subject === "string" && emailTypes.includes(draft.type as typeof emailTypes[number]) && draft.recipient?.to && Array.isArray(draft.recipient.to.emails)) {
          void confirm({ title: "Restore local email draft?", message: "An unsaved draft is available on this device. Restore it or keep the saved template?", confirmLabel: "Restore draft" }).then((approved) => {
            if (!active) return;
            if (approved) {
              setRestored({ ...draft, recipient: { ...emptyRecipient, ...draft.recipient, to: { ...emptyRecipient.to, ...draft.recipient.to } } });
              setSubject(draft.subject);
              setDeliveryStatus(draft.content.deliveryStatus ?? "DRAFT");
              setRevision((value) => value + 1);
              toast("Local draft restored. No email was sent.", "info");
            }
          });
        }
      }
    } catch { setStatus("Local draft recovery is unavailable. Save changes explicitly."); }
    return () => { active = false; };
  }, [key, confirm, toast]);

  useEffect(() => {
    const element = form.current; if (!element) return;
    let timer: ReturnType<typeof setTimeout>;
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const data = new FormData(element);
          localStorage.setItem(key, JSON.stringify({ id: template?.id ?? "", name: data.get("name"), type: data.get("type"), subject: data.get("subject"), content: JSON.parse(String(data.get("content"))), recipient: JSON.parse(String(data.get("recipient"))) }));
          setStatus("Local draft saved · not published or sent");
        } catch { setStatus("Local autosave unavailable. Use Save template."); }
      }, 800);
    };
    element.addEventListener("input", save); element.addEventListener("change", save);
    const observer = new MutationObserver(save); observer.observe(element, { subtree: true, attributes: true, attributeFilter: ["value"] });
    return () => { clearTimeout(timer); element.removeEventListener("input", save); element.removeEventListener("change", save); observer.disconnect(); };
  }, [key, revision, template?.id]);

  function applyGlobal(option: GlobalTemplateOption) {
    const current = form.current ? new FormData(form.current) : null;
    const recipient = (() => {
      try { return JSON.parse(String(current?.get("recipient") ?? "")) as RecipientValue; } catch { return restored?.recipient ?? emptyRecipient; }
    })();
    setRestored({
      id: template?.id ?? "",
      name: String(current?.get("name") ?? restored?.name ?? option.name),
      type: option.type,
      subject: option.subject,
      content: option.content,
      recipient,
    });
    setSubject(option.subject);
    setRevision((value) => value + 1);
    toast(`Global template "${option.name}" applied to this draft. Nothing was sent.`, "info");
  }

  const value = restored;
  return <form
    key={revision}
    ref={form}
    action={async (data) => {
      try {
        const result = await action(data);
        if (!result.ok) { toast(result.error ?? "Template could not be saved.", "error"); return; }
        try { localStorage.removeItem(key); } catch { /* Saving the template does not depend on local storage. */ }
        toast("Template saved. No email was sent.");
        window.dispatchEvent(new Event("app:process-complete"));
      } catch { toast("Unable to save template. Check your connection and try again.", "error"); }
    }}
    className="flex min-h-full flex-col"
  >
    {template && <input type="hidden" name="id" value={template.id} />}

    {/* 1. What this template is: name, type, and whether it may be sent. */}
    <section aria-label="Template details" className="grid gap-3 border-b border-outline px-4 py-3 sm:grid-cols-[minmax(0,1fr)_13rem_13rem]">
      <Field label="Template name" required><Input name="name" required maxLength={160} defaultValue={value?.name} placeholder="Invitation, main session" /></Field>
      <Field label="Email type"><Select name="type" defaultValue={value?.type ?? "CUSTOM"}>{emailTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</Select></Field>
      <Field label="Status">
        <Select value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value as "DRAFT" | "READY")}>
          <option value="DRAFT">Draft (cannot be sent)</option>
          <option value="READY">Ready to send</option>
        </Select>
      </Field>
    </section>

    {/* 2. Who receives it. */}
    <RecipientEditor initial={value?.recipient ?? emptyRecipient} contactLists={contactLists} />

    {/* 3. Subject, then 4. the message with its own toolbar. */}
    <ComposeRow>
      <ComposeRowLabel>Subject</ComposeRowLabel>
      <ComposeLine name="subject" required maxLength={255} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Welcome {{participant.name}} to {{event.name}}" aria-label="Subject" />
    </ComposeRow>

    <div className="flex-1">
      <EmailBuilder initial={value?.content} variables={variables} subject={subject} deliveryStatus={deliveryStatus} toolbarEnd={<GlobalTemplatePicker options={globalTemplates} onApply={applyGlobal} />} />
    </div>

    {/* 5. Save. Nothing here sends mail. */}
    <ComposeFooter>
      <p className="text-xs text-ink-muted" role="status">{status}</p>
      <SaveTemplateButton />
    </ComposeFooter>
  </form>;
}
