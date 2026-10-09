"use client";

import type { ReactElement, ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useOverlayContainer } from "./overlay-container";

/**
 * Hover and keyboard-focus hint. It labels an icon-only control visually; the
 * control itself must still carry an `aria-label`. Touch devices have no hover,
 * so never put information here that is not available elsewhere.
 */
export function Tooltip({ content, children, side = "top", align = "center", delayDuration = 200 }: {
  content: ReactNode;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}) {
  const container = useOverlayContainer();
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={container}>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            className="z-tooltip max-w-[250px] animate-menu-in rounded-md border border-outline bg-overlay px-2 py-1 text-xs text-ink shadow-md"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
