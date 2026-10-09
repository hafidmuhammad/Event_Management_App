import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Route tabs. These are links, not in-page panels, so the caller decides which
 * tab is active (usually from `usePathname()`), same as `event-tabs.tsx`.
 */
export function TabsNav({ label, className, listClassName, children }: { label: string; className?: string; listClassName?: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className={cn("border-b border-outline", className)}>
      <div className={cn("flex flex-wrap gap-1", listClassName)}>{children}</div>
    </nav>
  );
}

export function TabLink({ href, active = false, disabled = false, className, children }: { href: string; active?: boolean; disabled?: boolean; className?: string; children: ReactNode }) {
  const classes = cn(
    "whitespace-nowrap border-b-2 px-3 py-2 text-center text-body transition-colors",
    active ? "border-accent text-ink" : "border-transparent text-ink-muted hover:border-outline-strong hover:text-ink",
    disabled && "pointer-events-none border-transparent text-ink-subtle hover:border-transparent hover:text-ink-subtle",
    className,
  );
  if (disabled) return <span aria-disabled="true" className={classes}>{children}</span>;
  return <Link href={href} aria-current={active ? "page" : undefined} className={classes}>{children}</Link>;
}
