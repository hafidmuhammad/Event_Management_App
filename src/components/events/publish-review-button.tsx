"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

function PublishSubmit({ processInvitations }: { processInvitations: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="primary" loading={pending}>{pending ? "Publishing…" : processInvitations ? "Publish and process invitations" : "Publish event"}</Button>;
}

export function PublishReviewButton({
  action,
  publishReady,
  template,
  hasInvitationTemplate,
  recipients,
  previewSubject,
  previewHtml,
  previewError,
  deliveryMode,
}: {
  action: (formData: FormData) => Promise<void>;
  publishReady: boolean;
  template: { id: string; name: string } | null;
  hasInvitationTemplate: boolean;
  recipients: { id: string; name: string; email: string }[];
  previewSubject: string;
  previewHtml: string;
  previewError: string;
  deliveryMode: string;
}) {
  const [open, setOpen] = useState(false);
  const processInvitations = Boolean(template && recipients.length && !previewError);
  const previewDocument = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;background:white;color:black;font:14px/1.6 Arial,sans-serif}img{max-width:100%;height:auto}</style></head><body><main>${previewHtml}</main></body></html>`;

  return <>
    <Button type="button" variant="primary" size="md" disabled={!publishReady} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>Publish</Button>
    <Modal title="Review before publishing" size="max-w-4xl" open={open} onOpenChange={setOpen}>
      <div className="space-y-4">
        <p className="text-body text-ink-muted">Review the invitation email and its recipients. Publishing opens registration; invitations go only to participants marked INVITED.</p>
        {template ? <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-outline p-3">
            <div><p className="text-body font-medium text-ink">{template.name}</p><p className="mt-1 text-xs text-ink-muted">Subject: {previewSubject || "Preview unavailable"}</p></div>
            <Badge variant="positive">Ready</Badge>
          </div>
          {previewError
            ? <Alert variant="warning">{previewError}</Alert>
            : <div className="overflow-hidden rounded-md border border-outline bg-paper">
                <iframe title="Invitation email preview" sandbox="" srcDoc={previewDocument} className="h-64 w-full border-0 bg-white" />
              </div>}
          <p className="text-xs text-ink-muted">Delivery mode: {deliveryMode}.</p>
        </> : <Alert variant={hasInvitationTemplate ? "warning" : "info"} title={hasInvitationTemplate ? "Invitation template is still a draft" : "No ready invitation template"}>
          {hasInvitationTemplate
            ? "The event can be published, but draft templates are never sent. Mark an INVITATION template Ready before publishing to send invitations."
            : "The event can be published without sending invitations. Create and mark an INVITATION template Ready to email invited participants."}
        </Alert>}

        <section aria-labelledby="publish-recipients-heading" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 id="publish-recipients-heading" className="section-title">Invitation recipients</h3>
            <Badge variant={recipients.length ? "info" : "neutral"}>{recipients.length} {recipients.length === 1 ? "person" : "people"}</Badge>
          </div>
          {recipients.length
            ? <ol className="max-h-52 divide-y divide-outline overflow-y-auto rounded-md border border-outline" aria-label="Invited participants who will receive an email">
                {recipients.map((recipient) => <li key={recipient.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-3 py-2 text-body">
                  <span className="font-medium text-ink">{recipient.name}</span><span className="break-all text-ink-muted">{recipient.email}</span>
                </li>)}
              </ol>
            : <p className="rounded-md border border-outline p-3 text-body text-ink-muted">No invited participants. No invitation emails will be processed.</p>}
        </section>

        <form action={action} className="flex flex-wrap justify-end gap-2 border-t border-outline pt-3">
          <input type="hidden" name="invitationTemplateId" value={template?.id ?? ""} />
          <input type="hidden" name="reviewedInvitees" value={JSON.stringify(recipients.map((recipient) => recipient.id))} />
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <PublishSubmit processInvitations={processInvitations} />
        </form>
      </div>
    </Modal>
  </>;
}
