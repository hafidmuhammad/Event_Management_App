"use client";

import { useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";
import { useFeedback } from "./feedback-provider";

export type ActionResult = { ok: boolean; error?: string; notice?: string };

function SubmitButton({ label, pendingLabel, danger }: { label: string; pendingLabel: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={danger ? "danger" : "primary"} loading={pending}>{pending ? pendingLabel : label}</Button>;
}

/**
 * Form wrapper for server actions that return `{ ok, error, notice }`. Keeps
 * feedback consistent (toast + modal close) across the global library screens.
 */
export function ActionForm({ id, action, children, submitLabel = "Save", pendingLabel = "Saving…", danger = false, confirm: confirmOptions, className = "space-y-3", footer }: {
  /** Needed when something outside the form submits it, see `OverflowMenuFormItem`. */
  id?: string;
  action: (formData: FormData) => Promise<ActionResult>;
  children?: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  danger?: boolean;
  confirm?: { title: string; message: string; confirmLabel?: string };
  className?: string;
  footer?: ReactNode;
}) {
  const { confirm, toast } = useFeedback();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      id={id}
      ref={form}
      className={className}
      action={async (formData) => {
        if (confirmOptions && !await confirm({ ...confirmOptions, danger })) return;
        try {
          const result = await action(formData);
          if (!result.ok) { toast(result.error ?? "The action could not be completed.", "error"); return; }
          toast(result.notice ?? "Saved.");
          form.current?.reset();
          window.dispatchEvent(new Event("app:process-complete"));
        } catch {
          toast("Unable to complete the action. Check your connection and try again.", "error");
        }
      }}
    >
      {children}
      {footer ?? <div className="flex justify-end"><SubmitButton label={submitLabel} pendingLabel={pendingLabel} danger={danger} /></div>}
    </form>
  );
}

export { SubmitButton };
