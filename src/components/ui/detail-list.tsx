import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * Label / value pairs: `<DetailList><dt>Venue</dt><dd>Hall A</dd></DetailList>`.
 * Two columns from 640px, stacked below that with space after each value.
 * Long values wrap instead of stretching the layout.
 */
export function DetailList({ className, ...props }: ComponentProps<"dl">) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-1 text-body sm:grid-cols-[minmax(110px,0.35fr)_1fr] sm:gap-y-2",
        "[&_dt]:text-ink-muted [&_dd]:min-w-0 [&_dd]:text-ink [&_dd]:[overflow-wrap:anywhere] max-sm:[&_dd]:mb-3",
        className,
      )}
      {...props}
    />
  );
}
