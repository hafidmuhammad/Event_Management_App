"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { EllipsisVertical } from "lucide-react";
import { IconButton } from "./icon-button";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const GAP = 4;
const PAD = 8;

/** True when `node` sits inside an open modal that does not contain `menu`: a modal this menu launched. */
function inOtherModal(node: EventTarget | null, menu: Element | null) {
  if (!(node instanceof Element)) return false;
  const dialog = node.closest("dialog[open]");
  return !!dialog && !dialog.contains(menu);
}

/**
 * Overflow menu for arbitrary children (buttons, links, modal triggers).
 *
 * The panel is a native popover: it renders in the browser's top layer, so it
 * is never clipped by `overflow`, never above/below something by z-index, and,
 * because it is out of the document flow, opening it moves nothing. That fixes
 * the old `<details>` version, whose in-flow panel pushed the page down.
 *
 * Children are always mounted (the popover is only hidden when closed). That
 * matters for children that own state, like `ModalTrigger`: closing the menu
 * must not unmount an open modal. For the same reason the menu stays open
 * while a modal launched from it is on screen, and clicks or Escape inside that
 * modal are left alone.
 *
 * New code that has a list of actions should use `OverflowMenu` instead
 * (Radix menu semantics, arrow keys, typeahead). This component remains for
 * call sites that put components, not menu items, inside the menu.
 */
export function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const place = useCallback(() => {
    const button = trigger.current;
    const menu = panel.current;
    if (!button || !menu) return;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const anchor = button.getBoundingClientRect();
    menu.style.maxHeight = "";
    const { width, height } = menu.getBoundingClientRect();
    // Right edge of the menu lines up with the trigger; clamp inside the viewport.
    const left = Math.max(PAD, Math.min(anchor.right - width, vw - PAD - width));
    const below = vh - anchor.bottom - GAP - PAD;
    const above = anchor.top - GAP - PAD;
    const placeBelow = height <= below || below >= above;
    const room = Math.max(placeBelow ? below : above, 96);
    const top = placeBelow ? anchor.bottom + GAP : anchor.top - GAP - Math.min(height, room);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.maxHeight = `${room}px`;
  }, []);

  const hide = useCallback((restoreFocus: boolean) => {
    const menu = panel.current;
    if (!menu?.matches(":popover-open")) return;
    menu.hidePopover();
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }, []);

  const show = useCallback(() => {
    const menu = panel.current;
    if (!menu || menu.matches(":popover-open")) return;
    menu.showPopover();
    place();
    setOpen(true);
    menu.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [place]);

  useEffect(() => {
    if (!open) return;
    const menu = panel.current;
    // Dismissal is manual (popover="manual") so a modal opened from the menu
    // does not count as an "outside click" and close the menu behind it.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && (menu?.contains(target) || trigger.current?.contains(target))) return;
      if (inOtherModal(target, menu ?? null)) return;
      hide(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const modals = document.querySelectorAll("dialog[open]");
      const topmost = modals[modals.length - 1];
      if (topmost && !topmost.contains(menu ?? null)) return; // a modal launched from here owns Escape
      event.preventDefault(); // also tells ComposeWindow not to treat this Escape as "close the window"
      hide(true);
    };
    // A menu anchored to a trigger that has scrolled away would float in the wrong place.
    const onViewportChange = (event: Event) => {
      if (event.target instanceof Node && menu?.contains(event.target)) return;
      if (inOtherModal(event.target, menu ?? null)) return;
      hide(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, hide]);

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (next: number) => { event.preventDefault(); items[(next + items.length) % items.length].focus(); };
    if (event.key === "ArrowDown") focusAt(index + 1);
    else if (event.key === "ArrowUp") focusAt(index - 1);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(items.length - 1);
    else if (event.key === "Tab" && (event.shiftKey ? index <= 0 : index === items.length - 1)) hide(false); // let Tab carry on past the menu
  }

  return (
    <>
      <IconButton
        ref={trigger}
        label={label}
        title={label}
        tooltip={false}
        variant="outline"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (panel.current?.matches(":popover-open") ? hide(false) : show())}
      >
        <EllipsisVertical aria-hidden="true" />
      </IconButton>
      {/*
        No display utility (grid/flex) on this element: an author `display`
        beats the browser's `[popover]:not(:popover-open) { display: none }`
        and the closed menu would stay visible. Layout lives on the inner div.
      */}
      <div
        ref={panel}
        id={panelId}
        popover="manual"
        role="group"
        aria-label={label}
        onKeyDown={onPanelKeyDown}
        className="m-0 inset-auto min-w-44 max-w-72 animate-menu-in overflow-y-auto overscroll-contain rounded-md border border-outline bg-overlay p-1 text-ink shadow-md"
      >
        <div className="grid gap-1 [&>button]:justify-start [&>button]:text-left [&>label]:text-left">{children}</div>
      </div>
    </>
  );
}
