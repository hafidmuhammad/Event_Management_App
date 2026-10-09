"use client";

import { createContext, useContext, type RefObject } from "react";

/**
 * Where floating layers (menus, tooltips) should be portalled.
 *
 * `Dialog` opens with `showModal()`, which puts it in the browser's top layer
 * and makes everything outside it inert. A menu portalled to `document.body`
 * would render behind the modal and could not be clicked. `Dialog` provides
 * its own element here so menus inside it are portalled into the dialog.
 * Outside a dialog the value is empty and Radix falls back to `document.body`.
 */
const OverlayContainerContext = createContext<RefObject<HTMLElement | null> | null>(null);

export const OverlayContainerProvider = OverlayContainerContext.Provider;

export function useOverlayContainer(): HTMLElement | undefined {
  const ref = useContext(OverlayContainerContext);
  return ref?.current ?? undefined;
}
