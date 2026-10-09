"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { buttonVariants, type ButtonProps } from "./button";
import { Dialog } from "./dialog";
import { useFeedback } from "./feedback-provider";

/**
 * Controlled modal with the form-safety behaviour of the app: closing a form
 * that has unsaved changes asks for confirmation, and a finished action
 * (`app:process-complete`) closes it.
 *
 * Use this directly when the trigger lives somewhere that can unmount, such as
 * inside a menu: keep `open` state in a component that stays mounted and open
 * the modal from the menu item's `onSelect`. A `ModalTrigger` placed inside a
 * menu would be destroyed together with the menu.
 */
export function Modal({ title, size = "max-w-4xl", open, onOpenChange, children }: { title: string; size?: string; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const { confirm, toast } = useFeedback();
  useEffect(() => { if (open) dirty.current = false; }, [open]);
  const close = useCallback(async () => {
    if (dirty.current) {
      if (!await confirm({ title: "Unsaved changes", message: "Discard your unsaved changes and close this form?", confirmLabel: "Discard changes", danger: true })) return;
      toast("Unsaved changes discarded.", "info");
    }
    onOpenChange(false);
  }, [confirm, toast, onOpenChange]);
  useEffect(() => {
    const saved = () => { dirty.current = false; onOpenChange(false); };
    window.addEventListener("app:process-complete", saved);
    return () => window.removeEventListener("app:process-complete", saved);
  }, [onOpenChange]);
  useEffect(() => {
    if (!open || !content.current) return;
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.target instanceof HTMLInputElement && record.target.type === "hidden" && ["content", "recipient", "committeeJson"].includes(record.target.name))) dirty.current = true;
    });
    observer.observe(content.current, { subtree: true, attributes: true, attributeFilter: ["value"] });
    return () => observer.disconnect();
  }, [open]);
  if (!open) return null;
  return <Dialog title={title} size={size} onClose={() => { void close(); }}><div ref={content} onChangeCapture={() => { dirty.current = true; }}>{children}</div></Dialog>;
}

/**
 * Button that opens a modal. Style it with `variant` / `triggerSize`.
 * `triggerClass` still takes a raw class string for call sites not migrated yet,
 * and wins over `variant` when given.
 */
export function ModalTrigger({ title, children, triggerClass, variant = "primary", triggerSize = "md", size = "max-w-4xl", defaultOpen = false }: { title: string; children: ReactNode; triggerClass?: string; variant?: ButtonProps["variant"]; triggerSize?: ButtonProps["size"]; size?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  return <>
    <button type="button" className={triggerClass ?? buttonVariants({ variant, size: triggerSize })} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>{title}</button>
    <Modal title={title} size={size} open={open} onOpenChange={setOpen}>{children}</Modal>
  </>;
}
