"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldControlProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: true; required?: true };

const FieldContext = createContext<FieldControlProps>({});

/** Props a form control inherits from its surrounding `Field`: id, aria-describedby, aria-invalid, required. */
export function useFieldControl(): FieldControlProps {
  return useContext(FieldContext);
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("block text-xs font-medium text-ink-muted", className)} {...props} />;
}

export function FieldError({ className, ...props }: ComponentProps<"p">) {
  return <p aria-live="polite" className={cn("text-xs text-danger-ink", className)} {...props} />;
}

/**
 * Label + control + hint + error, wired together. Any `Input`, `Textarea` or
 * `Select` placed inside picks up the generated id, `aria-describedby` and
 * `aria-invalid` automatically, so the label click target and screen reader
 * announcements are correct without per-field plumbing.
 */
export function Field({ id: fixedId, label, hint, error, required = false, className, children }: { id?: string; label?: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  const generatedId = useId();
  // Pass `id` when something else must reference the control by a known id (for example aria-controls).
  const id = fixedId ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const control: FieldControlProps = { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, required: required ? true : undefined };
  return (
    <FieldContext.Provider value={control}>
      <div className={cn("flex min-w-0 flex-col gap-1", className)}>
        {label && <Label htmlFor={id}>{label}{required && <span aria-hidden="true" className="ml-0.5 text-danger-ink">*</span>}</Label>}
        {children}
        {hint && <p id={hintId} className="text-xs text-ink-subtle">{hint}</p>}
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    </FieldContext.Provider>
  );
}

export function Fieldset({ legend, className, children, ...props }: Omit<ComponentProps<"fieldset">, "children"> & { legend?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className={cn("m-0 min-w-0 space-y-3 border-0 p-0", className)} {...props}>
      {legend && <legend className="mb-2 p-0 text-sm font-semibold text-ink">{legend}</legend>}
      {children}
    </fieldset>
  );
}

/** Submit/cancel row. Right aligned, wraps on narrow screens. */
export function FormActions({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-center justify-end gap-2 pt-2", className)} {...props} />;
}
