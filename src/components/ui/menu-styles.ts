/**
 * Shared look for DropdownMenu and ContextMenu so both stay identical.
 *
 * Floating panels are the only place a shadow is used. They sit in a portal at
 * `z-menu` (above the compose window, below toasts) and are positioned by
 * Radix with `position: fixed`, so opening one never moves anything on the page.
 *
 * The `--radix-*` variables differ per primitive, so the two content classes
 * are written out in full: Tailwind only generates classes it can find as
 * complete strings in source.
 */
const panel =
  "z-menu min-w-44 max-w-72 animate-menu-in overflow-y-auto overscroll-contain rounded-md border border-outline bg-overlay p-1 text-ink shadow-md outline-none";

export const dropdownContent =
  `${panel} max-h-[var(--radix-dropdown-menu-content-available-height)] origin-[var(--radix-dropdown-menu-content-transform-origin)]`;

export const contextContent =
  `${panel} max-h-[var(--radix-context-menu-content-available-height)] origin-[var(--radix-context-menu-content-transform-origin)]`;

export const menuItem =
  "relative flex min-h-ctl-sm cursor-default select-none items-center gap-2 rounded-sm px-2 py-1 text-body text-ink outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-raised [&_svg]:size-[var(--icon-size)] [&_svg]:shrink-0 [&_svg]:text-ink-muted";

export const menuItemDanger =
  "text-danger-ink data-[highlighted]:bg-danger-soft [&_svg]:text-danger-ink";

/** Checkbox and radio items reserve room on the left for their indicator. */
export const menuItemIndicated = "pl-7";

export const menuIndicator = "absolute left-2 flex size-4 items-center justify-center";

export const menuLabel = "px-2 py-1 text-label font-medium uppercase tracking-wide text-ink-subtle";

export const menuSeparator = "-mx-1 my-1 h-px bg-outline-soft";

export const menuShortcut = "ml-auto pl-4 text-label text-ink-subtle";
