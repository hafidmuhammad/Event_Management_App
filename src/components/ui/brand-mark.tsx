import { useId } from "react";
import { cn } from "@/lib/cn";

/** The logo tile on its own. The gradient id is unique per instance, so two logos on one page (sidebar and mobile bar) never share a hidden definition. */
export function BrandIcon({ className }: { className?: string }) {
  const gradient = `app-mark-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-md border border-outline bg-surface", className)} aria-hidden="true">
      <svg viewBox="0 0 40 40" className="size-7" role="img">
        <defs><linearGradient id={gradient} x1="5" y1="5" x2="35" y2="35" gradientUnits="userSpaceOnUse"><stop stopColor="var(--link)" /><stop offset="1" stopColor="var(--sky)" /></linearGradient></defs>
        <rect x="4" y="6" width="32" height="30" rx="7" fill="var(--surface)" stroke="var(--outline)" strokeWidth="1.5" />
        <path d="M4 14a7 7 0 0 1 7-8h18a7 7 0 0 1 7 8H4Z" fill={`url(#${gradient})`} />
        <path d="M11 4v7M29 4v7" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m20 18 2 3.8 4.2.6-3 2.9.7 4.2-3.9-2-3.9 2 .7-4.2-3-2.9 4.2-.6Z" fill="var(--accent)" />
      </svg>
    </span>
  );
}

export function BrandText() {
  return <span className="leading-tight"><span className="block text-sm font-semibold tracking-tight text-ink">Cikarang Dryport</span><span className="mt-0.5 block text-label font-medium uppercase tracking-[0.16em] text-ink-muted">Event Management</span></span>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="Cikarang Dryport Event Management">
      <BrandIcon />
      {!compact && <BrandText />}
    </div>
  );
}
