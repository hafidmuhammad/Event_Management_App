import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A single headline number. `tabular-nums` keeps digits from shifting as values change. */
export function Stat({ label, value, hint, className, ...props }: Omit<ComponentProps<"div">, "children"> & { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className={cn("min-w-0 rounded-md border border-outline bg-surface p-card", className)} {...props}>
      <p className="text-label font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
