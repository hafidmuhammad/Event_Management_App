"use client";

import type { ComponentProps } from "react";
import * as Primitive from "@radix-ui/react-toolbar";
import { cn } from "@/lib/cn";
import { Button, type ButtonProps } from "./button";
import { Tooltip } from "./tooltip";
import { toggleItemClass } from "./toggle-group";

/**
 * Fixed-height row of tools (`role="toolbar"`). One tab stop for the whole
 * bar, arrow keys move between tools. It never wraps: wrapping adds a row and
 * pushes the content below it down. When the tools do not fit, move the
 * secondary ones into an OverflowMenu instead.
 */
export function Toolbar({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root className={cn("flex h-ctl-md w-full min-w-0 items-center gap-1 overflow-x-auto px-0.5", className)} {...props} />;
}

export function ToolbarGroup({ className, ...props }: ComponentProps<"div">) {
  return <div role="group" className={cn("flex items-center gap-0.5", className)} {...props} />;
}

export function ToolbarSeparator({ className, ...props }: ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn("mx-1 h-5 w-px shrink-0 bg-outline", className)} {...props} />;
}

export function ToolbarButton(props: ButtonProps) {
  return <Primitive.Button asChild><Button variant="ghost" size="sm" {...props} /></Primitive.Button>;
}

/** Icon-only tool. `label` is the accessible name and the tooltip text. */
export function ToolbarIconButton({ label, children, ...props }: Omit<ButtonProps, "aria-label" | "asChild"> & { label: string }) {
  return (
    <Tooltip content={label}>
      <Primitive.Button asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} {...props}>{children}</Button>
      </Primitive.Button>
    </Tooltip>
  );
}

/** Toggle group that takes part in the toolbar's arrow-key navigation. */
export function ToolbarToggleGroup({ className, ...props }: ComponentProps<typeof Primitive.ToggleGroup>) {
  return <Primitive.ToggleGroup className={cn("flex items-center gap-0.5", className)} {...props} />;
}

export function ToolbarToggleItem({ className, ...props }: ComponentProps<typeof Primitive.ToggleItem>) {
  return <Primitive.ToggleItem className={cn(toggleItemClass, className)} {...props} />;
}
