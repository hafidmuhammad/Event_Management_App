"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionForm, type ActionResult } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { OverflowMenu, OverflowMenuFormItem, OverflowMenuItem, OverflowMenuSeparator } from "@/components/ui/overflow-menu";

type ServerAction = (formData: FormData) => Promise<ActionResult>;

/**
 * Actions of one contact-list card: Open stays visible, everything else lives
 * in the `...` menu. State for the rename modal and the delete form is kept
 * here, outside the menu content, because that content unmounts when the menu
 * closes and would take an open modal or a pending confirm dialog with it.
 */
export function ContactListActions({ list, saveAction, deleteAction }: {
  list: { id: string; name: string; description: string | null; contactCount: number };
  saveAction: ServerAction;
  deleteAction: ServerAction;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const deleteFormId = `delete-contact-list-${list.id}`;
  return (
    <>
      <Button asChild variant="outline" size="sm"><Link href={`/library/contacts/${list.id}`}>Open</Link></Button>
      <OverflowMenu label={`Actions for ${list.name}`} size="icon-sm">
        <OverflowMenuItem asChild><a href={`/api/library/contacts/${list.id}/export?format=csv`}>Export CSV</a></OverflowMenuItem>
        <OverflowMenuItem asChild><a href={`/api/library/contacts/${list.id}/export?format=xlsx`}>Export Excel</a></OverflowMenuItem>
        <OverflowMenuItem onSelect={() => setRenameOpen(true)}>Rename</OverflowMenuItem>
        <OverflowMenuSeparator />
        <OverflowMenuFormItem formId={deleteFormId} danger>Delete</OverflowMenuFormItem>
      </OverflowMenu>

      <Modal title="Rename" size="max-w-lg" open={renameOpen} onOpenChange={setRenameOpen}>
        <ActionForm action={saveAction} submitLabel="Save list">
          <input type="hidden" name="id" value={list.id} />
          <Field label="List name"><Input name="name" required maxLength={160} defaultValue={list.name} /></Field>
          <Field label="Description (optional)"><Input name="description" maxLength={500} defaultValue={list.description ?? ""} /></Field>
        </ActionForm>
      </Modal>

      <ActionForm
        id={deleteFormId}
        action={deleteAction}
        className="hidden"
        danger
        confirm={{ title: "Delete contact list?", message: `This permanently removes "${list.name}" and its ${list.contactCount} contact(s). Events that selected this list will lose those recipients.`, confirmLabel: "Delete list" }}
        footer={<></>}
      >
        <input type="hidden" name="id" value={list.id} />
      </ActionForm>
    </>
  );
}
