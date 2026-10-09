"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";
import { OverlayContainerProvider } from "./overlay-container";

/**
 * Modal built on a native <dialog>: focus trap, Escape, inert background and
 * top-layer stacking come from the browser. `.app-dialog` is kept only for the
 * `::backdrop` scrim, which cannot be styled from a utility class.
 * Everything inside is portalled into this element for menus, see OverlayContainerProvider.
 */
export function Dialog({ title, children, onClose, size = "max-w-lg", alert = false }: { title: string; children: ReactNode; onClose: () => void; size?: string; alert?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    return () => { dialog.close(); previousFocus?.focus(); };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <OverlayContainerProvider value={ref}>
      <dialog
        ref={ref}
        role={alert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("app-dialog w-[calc(100%_-_2rem)] max-h-[calc(100dvh_-_2rem)] rounded-md border border-outline bg-surface p-0 text-ink shadow-lg", size)}
        onCancel={(event) => { event.preventDefault(); onClose(); }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
        }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-outline px-card py-2.5">
          <h2 id={titleId} className="text-sm font-semibold tracking-tight">{title}</h2>
          <IconButton label={`Close ${title}`} tooltip={false} size="icon-sm" variant="outline" onClick={onClose}><X aria-hidden="true" /></IconButton>
        </header>
        <div className="max-h-[calc(100dvh_-_7rem)] overflow-y-auto overscroll-contain p-card">{children}</div>
      </dialog>
    </OverlayContainerProvider>,
    document.body,
  );
}
