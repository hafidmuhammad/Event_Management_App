"use client";

import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Fieldset, useFieldControl } from "./field";

/*
 * Native elements on purpose. They submit with server-action <form>s with no
 * extra wiring, keep browser autofill/validation, and stay accessible for free.
 * Only the look is custom, driven by tokens and density.
 */

const controlBase =
  "block min-h-ctl-md w-full rounded-md border border-outline bg-surface-sunken px-3 text-body text-ink placeholder:text-ink-subtle focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40 disabled:opacity-60 aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  const field = useFieldControl();
  return <input {...field} className={cn(controlBase, "py-1", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  const field = useFieldControl();
  return <textarea {...field} className={cn(controlBase, "min-h-20 resize-y py-1.5", className)} {...props} />;
}

/** `className` styles the <select>; `wrapperClassName` styles the box around it (use it for grid spans and widths). */
export function Select({ className, wrapperClassName, children, ...props }: ComponentProps<"select"> & { wrapperClassName?: string }) {
  const field = useFieldControl();
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select {...field} className={cn(controlBase, "appearance-none py-1 pr-8", className)} {...props}>{children}</select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-[var(--icon-size)] -translate-y-1/2 text-ink-muted" />
    </div>
  );
}

const choiceLabel = "inline-flex cursor-pointer items-center gap-2 text-body text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60";

export function Checkbox({ className, label, ...props }: Omit<ComponentProps<"input">, "type"> & { label?: ReactNode }) {
  return (
    <label className={choiceLabel}>
      <input type="checkbox" className={cn("size-4 shrink-0 rounded-sm accent-primary", className)} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Radio({ className, label, ...props }: Omit<ComponentProps<"input">, "type"> & { label?: ReactNode }) {
  return (
    <label className={choiceLabel}>
      <input type="radio" className={cn("size-4 shrink-0 accent-primary", className)} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}

/** Group of `Radio`s. Use `orientation="horizontal"` for short option lists. */
export function RadioGroup({ legend, orientation = "vertical", className, children }: { legend?: ReactNode; orientation?: "vertical" | "horizontal"; className?: string; children: ReactNode }) {
  return (
    <Fieldset legend={legend} role="radiogroup" className={className}>
      <div className={cn("flex gap-x-4 gap-y-2", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap")}>{children}</div>
    </Fieldset>
  );
}

/** On/off toggle. A real checkbox with `role="switch"`, so it submits as `name=on` like any checkbox. */
export function Switch({ className, label, ...props }: Omit<ComponentProps<"input">, "type" | "role"> & { label?: ReactNode }) {
  return (
    <label className={choiceLabel}>
      <input type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border border-outline bg-neutral-soft transition-colors",
          "after:absolute after:left-0.5 after:top-1/2 after:size-3.5 after:-translate-y-1/2 after:rounded-full after:bg-ink-muted after:transition-all",
          "peer-checked:border-transparent peer-checked:bg-primary peer-checked:after:translate-x-4 peer-checked:after:bg-primary-fg",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-sky peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          className,
        )}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

export function FileInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const field = useFieldControl();
  return (
    <input
      {...field}
      type="file"
      className={cn(
        "block w-full text-xs text-ink-muted file:mr-3 file:min-h-ctl-sm file:cursor-pointer file:rounded-md file:border file:border-outline file:bg-surface-raised file:px-3 file:text-xs file:font-medium file:text-ink-strong hover:file:border-outline-strong",
        className,
      )}
      {...props}
    />
  );
}
