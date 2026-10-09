"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cva } from "class-variance-authority";
import { ChevronUp, Maximize2, Minimize2, Minus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants, type ButtonProps } from "./button";
import { useFeedback } from "./feedback-provider";
import { IconButton } from "./icon-button";

type ComposeState = "full" | "docked" | "minimized";

const composeWindow = cva("absolute flex flex-col overflow-hidden rounded-md border border-outline bg-surface shadow-lg", {
  variants: {
    state: {
      full: "inset-4",
      docked: "bottom-0 right-4 h-[min(40rem,calc(100dvh_-_3rem))] w-[min(46rem,calc(100%_-_2rem))] rounded-b-none",
      minimized: "pointer-events-auto bottom-0 right-4 w-[min(24rem,calc(100%_-_2rem))] rounded-b-none",
    },
  },
});

/**
 * Gmail-style compose window. Unlike `Dialog` it keeps its children mounted
 * across window states so an in-progress email draft is never lost when the
 * window is minimized or resized.
 *
 * It is a fixed layer at `z-compose`, not a native top-layer dialog. Menus and
 * tooltips (`z-menu`, `z-tooltip`) therefore stack above it without any help.
 */
export function ComposeWindow({ title, children, onClose, initialState = "full" }: { title: string; children: ReactNode; onClose: () => void; initialState?: ComposeState }) {
  const [state, setState] = useState<ComposeState>(initialState);
  const frame = useRef<HTMLDivElement>(null);
  const titleId = useRef(`compose-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previousFocus?.focus();
  }, []);

  useEffect(() => {
    if (state === "minimized") return;
    const first = frame.current?.querySelector<HTMLElement>("input, textarea, select, button, [href]");
    first?.focus();
  }, [state]);

  const keydown = useCallback((event: KeyboardEvent) => {
    if (state === "minimized") return;
    // A menu or tooltip inside the window already handled this key (for example
    // Escape closing a menu). Without this check the same Escape would also
    // close the whole compose window.
    if (event.defaultPrevented) return;
    // A nested native dialog (live preview, confirmation) owns the top layer.
    if (document.querySelector("dialog[open]")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = frame.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (active instanceof HTMLElement && !frame.current?.contains(active)) { event.preventDefault(); first.focus(); }
  }, [onClose, state]);

  useEffect(() => {
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [keydown]);

  useEffect(() => {
    // Only a blocking window should lock page scrolling.
    if (state === "minimized") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [state]);

  if (typeof document === "undefined") return null;

  const minimized = state === "minimized";
  return createPortal(
    <div className={cn("fixed inset-0 z-compose flex", minimized && "pointer-events-none")}>
      {!minimized && <div className="absolute inset-0 bg-backdrop" onClick={onClose} aria-hidden="true" />}
      <section
        ref={frame}
        role="dialog"
        aria-modal={minimized ? undefined : true}
        aria-labelledby={titleId}
        className={composeWindow({ state })}
      >
        <header className={cn("flex items-center justify-between gap-4 border-b border-outline bg-surface-raised px-4 py-2.5", minimized && "border-b-0")}>
          <h2 id={titleId} className="m-0 text-sm font-semibold text-ink">{title}</h2>
          <div className="flex items-center gap-1">
            <IconButton label={minimized ? `Restore ${title}` : `Minimize ${title}`} title={minimized ? "Restore" : "Minimize"} tooltip={false} size="icon-sm" onClick={() => setState(minimized ? "docked" : "minimized")}>
              {minimized ? <ChevronUp aria-hidden="true" /> : <Minus aria-hidden="true" />}
            </IconButton>
            <IconButton label={state === "full" ? "Exit full screen" : "Full screen"} title={state === "full" ? "Exit full screen" : "Full screen"} tooltip={false} size="icon-sm" onClick={() => setState(state === "full" ? "docked" : "full")}>
              {state === "full" ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            </IconButton>
            <IconButton label={`Close ${title}`} title="Close" tooltip={false} size="icon-sm" onClick={onClose}><X aria-hidden="true" /></IconButton>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" hidden={minimized}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}

/**
 * Controlled compose window with the draft-safety behaviour of the app: closing
 * after edits asks first, and a finished save (`app:process-complete`) closes it.
 *
 * Use it directly when the opener lives in a menu: keep `open` in a component
 * that stays mounted and open the window from the menu item's `onSelect`.
 */
export function ComposeDialog({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  const dirty = useRef(false);
  const { confirm, toast } = useFeedback();
  useEffect(() => { if (open) dirty.current = false; }, [open]);
  useEffect(() => {
    const done = () => { dirty.current = false; onOpenChange(false); };
    window.addEventListener("app:process-complete", done);
    return () => window.removeEventListener("app:process-complete", done);
  }, [onOpenChange]);
  const close = useCallback(async () => {
    if (dirty.current) {
      if (!await confirm({ title: "Discard this email draft?", message: "Your changes are kept as a local draft on this device but will not be saved to the template.", confirmLabel: "Discard changes", danger: true })) return;
      toast("Compose window closed. The template was not changed.", "info");
    }
    onOpenChange(false);
  }, [confirm, toast, onOpenChange]);
  if (!open) return null;
  return <ComposeWindow title={title} onClose={() => { void close(); }}><div onChangeCapture={() => { dirty.current = true; }} onInputCapture={() => { dirty.current = true; }}>{children}</div></ComposeWindow>;
}

/**
 * Button that opens a compose window. `triggerClass` still takes a raw class
 * string for call sites not migrated yet and wins over `variant`.
 */
export function ComposeTrigger({ title, windowTitle, children, triggerClass, variant = "primary", triggerSize = "md", defaultOpen = false }: { title: string; windowTitle?: string; children: ReactNode; triggerClass?: string; variant?: ButtonProps["variant"]; triggerSize?: ButtonProps["size"]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  return <>
    <button type="button" className={triggerClass ?? buttonVariants({ variant, size: triggerSize })} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>{title}</button>
    <ComposeDialog title={windowTitle ?? title} open={open} onOpenChange={setOpen}>{children}</ComposeDialog>
  </>;
}