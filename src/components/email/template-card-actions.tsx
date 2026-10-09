"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ComposeDialog } from "@/components/ui/compose-window";
import { DetailList } from "@/components/ui/detail-list";
import { Modal } from "@/components/ui/modal";
import { OverflowMenu, OverflowMenuFormItem, OverflowMenuItem, OverflowMenuSeparator } from "@/components/ui/overflow-menu";

export type SendFacts = { subject: string; to: number; cc: number; bcc: number; transport: string };

/**
 * Actions of one email template card. Two buttons stay visible, the rest are in
 * the menu:
 *
 *   managers:     [Send] [Edit] [...]   (Preview, Save to library)
 *   receptionist: [Preview]
 *
 * The windows are controlled from here (not from a trigger inside the menu), so
 * they stay mounted when the menu closes.
 */
export function TemplateCardActions({ canManage, templateName, draft, recipientCount, facts, previewNode, editNode, markReadyForm, sendForm, libraryFormId, defaultOpen }: {
  canManage: boolean;
  templateName: string;
  draft: boolean;
  recipientCount: number;
  facts: SendFacts;
  previewNode: ReactNode;
  /** Null when the stored content cannot be edited. */
  editNode: ReactNode | null;
  markReadyForm: ReactNode;
  sendForm: ReactNode;
  libraryFormId: string | null;
  defaultOpen?: "preview" | "edit";
}) {
  const [previewOpen, setPreviewOpen] = useState(defaultOpen === "preview");
  const [editOpen, setEditOpen] = useState(defaultOpen === "edit");
  const [sendOpen, setSendOpen] = useState(false);

  return <div className="flex items-center gap-2">
    {canManage ? <>
      <Button type="button" variant="primary" size="sm" onClick={() => setSendOpen(true)} aria-haspopup="dialog"><Send aria-hidden="true" />Send</Button>
      {editNode && <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)} aria-haspopup="dialog"><Pencil aria-hidden="true" />Edit</Button>}
      <OverflowMenu label={`More actions for ${templateName}`} size="icon-sm">
        <OverflowMenuItem onSelect={() => setPreviewOpen(true)}>Preview and send test</OverflowMenuItem>
        {libraryFormId && <>
          <OverflowMenuSeparator />
          <OverflowMenuFormItem formId={libraryFormId}>Save to library</OverflowMenuFormItem>
        </>}
      </OverflowMenu>
    </> : <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)} aria-haspopup="dialog">Preview</Button>}

    <Modal title="Preview email" size="max-w-3xl" open={previewOpen} onOpenChange={setPreviewOpen}>{previewNode}</Modal>

    <Modal title={`Send “${templateName}”`} size="max-w-2xl" open={sendOpen} onOpenChange={setSendOpen}>
      <div className="space-y-4">
        <DetailList>
          <dt>Subject</dt><dd>{facts.subject}</dd>
          <dt>To</dt><dd>{facts.to} personalized {facts.to === 1 ? "email" : "emails"}</dd>
          <dt>Cc / Bcc</dt><dd>{facts.cc} / {facts.bcc} on each email</dd>
          <dt>Delivery</dt><dd>{facts.transport}</dd>
        </DetailList>
        {draft && <>
          <Alert variant="warning" title="This template is still a draft">Drafts are protected from sending. When you are happy with the message, mark it ready. Marking it ready does not send anything.</Alert>
          {markReadyForm}
        </>}
        {!draft && recipientCount === 0 && <>
          <Alert variant="warning" title="No recipients yet">No one matches the audience of this template. Choose recipients, then come back to send.</Alert>
          {editNode && <div className="flex justify-end"><Button type="button" variant="primary" onClick={() => { setSendOpen(false); setEditOpen(true); }}>Edit recipients</Button></div>}
        </>}
        {!draft && recipientCount > 0 && <>
          <p className="text-xs text-ink-muted">Each person receives their own email, and nobody sees the other recipients. Check the subject and the audience before you confirm.</p>
          {sendForm}
        </>}
      </div>
    </Modal>

    {editNode && <ComposeDialog title={`Edit ${templateName}`} open={editOpen} onOpenChange={setEditOpen}>{editNode}</ComposeDialog>}
  </div>;
}
