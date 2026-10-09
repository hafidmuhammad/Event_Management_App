import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Placeholder block. The shimmer is a gradient from `--ink` at 10% opacity, so
 * it reads correctly on both themes. `prefers-reduced-motion` stops it through
 * the global rule in globals.css.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--surface)_72%,var(--outline))]",
        "after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-ink/10 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export function LoadingStatus({ children, label = "Loading" }: { children: ReactNode; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading">
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}
