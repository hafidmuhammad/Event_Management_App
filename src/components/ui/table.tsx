import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Compact data table.
 *
 * - `responsive` turns rows into stacked cards under 640px. It reuses the
 *   existing `.responsive-table` rules, which read `data-label` on each Td.
 * - Header cells are sticky. That only has an effect when the scroll container
 *   has a bounded height, so pass `containerClassName="max-h-[70dvh]"` for long lists.
 */
export function Table({ className, containerClassName, responsive = false, ...props }: ComponentProps<"table"> & { containerClassName?: string; responsive?: boolean }) {
  return (
    <div className={cn("overflow-auto rounded-md border border-outline", containerClassName)}>
      <table className={cn("w-full min-w-full text-left text-body", responsive && "responsive-table", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={className} {...props} />;
}

export function Tbody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={className} {...props} />;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors hover:bg-surface-raised", className)} {...props} />;
}

export function Th({ className, scope = "col", ...props }: ComponentProps<"th">) {
  return <th scope={scope} className={cn("sticky top-0 z-[1] h-thead whitespace-nowrap border-b border-outline bg-surface px-3 text-left align-middle text-label font-medium uppercase tracking-wide text-ink-muted", className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("h-row border-b border-outline-soft px-3 py-1.5 align-middle text-ink-strong", className)} {...props} />;
}
