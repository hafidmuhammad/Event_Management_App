"use client";

import type { ComponentProps } from "react";
import * as Primitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useOverlayContainer } from "./overlay-container";
import { dropdownContent, menuIndicator, menuItem, menuItemDanger, menuItemIndicated, menuLabel, menuSeparator, menuShortcut } from "./menu-styles";

/**
 * Click-to-open menu. Defaults to non-modal: a modal menu locks page scroll and
 * hides the scrollbar, which shifts the layout, the opposite of the goal. The
 * panel floats in a portal (inside the nearest Dialog when there is one).
 */
export function DropdownMenu({ modal = false, ...props }: ComponentProps<typeof Primitive.Root>) {
  return <Primitive.Root modal={modal} {...props} />;
}

export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;
export const DropdownMenuSub = Primitive.Sub;
export const DropdownMenuRadioGroup = Primitive.RadioGroup;

export function DropdownMenuContent({ className, sideOffset = 4, collisionPadding = 8, align = "end", ...props }: ComponentProps<typeof Primitive.Content>) {
  const container = useOverlayContainer();
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content sideOffset={sideOffset} collisionPadding={collisionPadding} align={align} className={cn(dropdownContent, className)} {...props} />
    </Primitive.Portal>
  );
}

/** `danger` styles destructive actions. Keep them last, after a separator, and behind a confirm dialog. */
export function DropdownMenuItem({ className, danger = false, ...props }: ComponentProps<typeof Primitive.Item> & { danger?: boolean }) {
  return <Primitive.Item className={cn(menuItem, danger && menuItemDanger, className)} {...props} />;
}

export function DropdownMenuCheckboxItem({ className, children, ...props }: ComponentProps<typeof Primitive.CheckboxItem>) {
  return (
    <Primitive.CheckboxItem className={cn(menuItem, menuItemIndicated, className)} {...props}>
      <span className={menuIndicator}><Primitive.ItemIndicator><Check /></Primitive.ItemIndicator></span>
      {children}
    </Primitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem className={cn(menuItem, menuItemIndicated, className)} {...props}>
      <span className={menuIndicator}><Primitive.ItemIndicator><Circle className="!size-2 fill-current" /></Primitive.ItemIndicator></span>
      {children}
    </Primitive.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label className={cn(menuLabel, className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn(menuSeparator, className)} {...props} />;
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(menuShortcut, className)} {...props} />;
}

export function DropdownMenuSubTrigger({ className, children, ...props }: ComponentProps<typeof Primitive.SubTrigger>) {
  return (
    <Primitive.SubTrigger className={cn(menuItem, "data-[state=open]:bg-surface-raised", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </Primitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, collisionPadding = 8, ...props }: ComponentProps<typeof Primitive.SubContent>) {
  const container = useOverlayContainer();
  return (
    <Primitive.Portal container={container}>
      <Primitive.SubContent collisionPadding={collisionPadding} className={cn(dropdownContent, className)} {...props} />
    </Primitive.Portal>
  );
}
