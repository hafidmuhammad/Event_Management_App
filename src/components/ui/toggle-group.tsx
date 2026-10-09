"use client";

import type { ComponentProps } from "react";
import * as Primitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/cn";

export const toggleItemClass =
  "inline-flex size-ctl-sm shrink-0 items-center justify-center rounded-md border border-transparent text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink disabled:opacity-60 data-[state=on]:bg-sky-soft data-[state=on]:text-link [&_svg]:size-[var(--icon-size)]";

/**
 * A row of icon toggles, for example left / center / right alignment instead of
 * a three-option <select>. `type="single"` lets the user click the active item
 * to clear it (the value becomes ""), so ignore empty values in `onValueChange`
 * when one option must always be selected. Give each item an `aria-label`.
 */
export function ToggleGroup({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root className={cn("inline-flex items-center gap-0.5", className)} {...props} />;
}

export function ToggleGroupItem({ className, ...props }: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className={cn(toggleItemClass, className)} {...props} />;
}
