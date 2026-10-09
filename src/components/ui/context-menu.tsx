"use client";

import type { ComponentProps } from "react";
import * as Primitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useOverlayContainer } from "./overlay-container";
import { contextContent, menuIndicator, menuItem, menuItemDanger, menuItemIndicated, menuLabel, menuSeparator, menuShortcut } from "./menu-styles";

/**
 * Right-click menu, like Windows Explorer. It opens at the pointer, and the
 * keyboard Menu key or Shift+F10 opens it on the focused element too.
 *
 * Right-click alone is invisible and does not exist on touch screens. Every
 * element that has a ContextMenu must also expose the same actions through a
 * visible OverflowMenu (the `...` button).
 */
export function ContextMenu({ modal = false, ...props }: ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root modal={modal} {...props} />;
}

export const ContextMenuTrigger = Primitive.Trigger;
export const ContextMenuGroup = Primitive.Group;
export const ContextMenuSub = Primitive.Sub;
export const ContextMenuRadioGroup = Primitive.RadioGroup;

export function ContextMenuContent({ className, collisionPadding = 8, ...props }: ComponentProps<typeof Primitive.Content>) {
  const container = useOverlayContainer();
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content collisionPadding={collisionPadding} className={cn(contextContent, className)} {...props} />
    </Primitive.Portal>
  );
}

export function ContextMenuItem({ className, danger = false, ...props }: ComponentProps<typeof Primitive.Item> & { danger?: boolean }) {
  return <Primitive.Item className={cn(menuItem, danger && menuItemDanger, className)} {...props} />;
}

export function ContextMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <Primitive.CheckboxItem className={cn(menuItem, menuItemIndicated, className)} {...props}>
      <span className={menuIndicator}><Primitive.ItemIndicator><Check /></Primitive.ItemIndicator></span>
      {children}
    </Primitive.CheckboxItem>
  );
}

export function ContextMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem className={cn(menuItem, menuItemIndicated, className)} {...props}>
      <span className={menuIndicator}><Primitive.ItemIndicator><Circle className="!size-2 fill-current" /></Primitive.ItemIndicator></span>
      {children}
    </Primitive.RadioItem>
  );
}

export function ContextMenuLabel({ className, ...props }: ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label className={cn(menuLabel, className)} {...props} />;
}

export function ContextMenuSeparator({ className, ...props }: ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn(menuSeparator, className)} {...props} />;
}

export function ContextMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(menuShortcut, className)} {...props} />;
}

export function ContextMenuSubTrigger({ className, children, ...props }: ComponentProps<typeof Primitive.SubTrigger>) {
  return (
    <Primitive.SubTrigger className={cn(menuItem, "data-[state=open]:bg-surface-raised", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </Primitive.SubTrigger>
  );
}

export function ContextMenuSubContent({ className, collisionPadding = 8, ...props }: ComponentProps<typeof Primitive.SubContent>) {
  const container = useOverlayContainer();
  return (
    <Primitive.Portal container={container}>
      <Primitive.SubContent collisionPadding={collisionPadding} className={cn(contextContent, className)} {...props} />
    </Primitive.Portal>
  );
}
