"use client";

import type { ReactNode } from "react";
import { Ellipsis, EllipsisVertical } from "lucide-react";
import { useFeedback } from "./feedback-provider";
import { IconButton } from "./icon-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";

/**
 * The `...` button that holds the secondary actions of a card, row or header.
 *
 * Rules (see the ui-modernization skill): at most two actions stay visible,
 * the rest go here; destructive actions go last, after a separator, `danger`,
 * and behind a confirm dialog. The trigger is a fixed-size square, so opening
 * the menu changes nothing around it.
 *
 *   <OverflowMenu label="Template actions">
 *     <OverflowMenuItem onSelect={...}>Duplicate</OverflowMenuItem>
 *     <OverflowMenuSeparator />
 *     <OverflowMenuItem danger onSelect={...}>Delete</OverflowMenuItem>
 *   </OverflowMenu>
 *
 * For a link item use `<OverflowMenuItem asChild><Link href=...>...</Link></OverflowMenuItem>`.
 */
export function OverflowMenu({ label, children, orientation = "vertical", align = "end", size = "icon" }: { label: string; children: ReactNode; orientation?: "vertical" | "horizontal"; align?: "start" | "center" | "end"; size?: "icon-sm" | "icon" }) {
  const Icon = orientation === "vertical" ? EllipsisVertical : Ellipsis;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={label} tooltip={false} title={label} variant="outline" size={size}><Icon aria-hidden="true" /></IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} aria-label={label}>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Menu item that submits a form living outside the menu, found by id.
 *
 * Put the form (an `ActionForm` with `id`, `className="hidden"` and an empty
 * `footer`) next to the menu, never inside it. The menu content unmounts when
 * it closes, and a confirm dialog or in-flight submit must outlive that.
 * `requestSubmit()` is used instead of a `type="submit"` item because the item
 * can be removed from the DOM before the browser runs the click's default action.
 */
export function OverflowMenuFormItem({ formId, danger, confirm: confirmOptions, children }: {
  formId: string;
  danger?: boolean;
  /** Ask first. The dialog belongs to the app-level provider, so it survives the menu closing. */
  confirm?: { message: string; title?: string; confirmLabel?: string };
  children: ReactNode;
}) {
  const { confirm } = useFeedback();
  return (
    <DropdownMenuItem
      danger={danger}
      onSelect={async () => {
        if (confirmOptions && !await confirm({ ...confirmOptions, danger })) return;
        const form = document.getElementById(formId);
        if (form instanceof HTMLFormElement) form.requestSubmit();
      }}
    >
      {children}
    </DropdownMenuItem>
  );
}

export const OverflowMenuItem = DropdownMenuItem;
export const OverflowMenuSeparator = DropdownMenuSeparator;
