import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/*
 * Building blocks of the Gmail-style compose layout used by the email forms:
 * underlined recipient/subject rows, address chips, and the sticky footer.
 */

export function ComposeRow({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-center gap-2 border-b border-outline-soft px-4 py-2", className)} {...props} />;
}

export function ComposeRowLabel({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("w-16 shrink-0 text-body text-ink-muted", className)} {...props} />;
}

/** Borderless input that sits on a `ComposeRow`. */
export function ComposeLine({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("min-w-40 flex-1 border-0 bg-transparent py-1 text-body text-ink placeholder:text-ink-subtle focus:outline-none", className)} {...props} />;
}

export function ComposeChip({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-sky-soft px-2 py-0.5 text-xs text-link">
      <span className="truncate">{label}</span>
      <button type="button" onClick={onRemove} aria-label={removeLabel} className="inline-flex items-center rounded-full leading-none hover:text-ink"><X className="size-3" aria-hidden="true" /></button>
    </span>
  );
}

export function ComposeFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-outline bg-surface px-4 py-3", className)} {...props} />;
}
