import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's built-in scales. Without this, it would
 * treat `text-label` (our density font size) as a text colour and silently drop
 * it when merged with `text-ink`, and it could not resolve `h-ctl-md` against
 * `h-10`. Keep these lists in sync with `spacing` / `fontSize` in
 * tailwind.config.ts.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: { spacing: ["ctl-sm", "ctl-md", "ctl-lg", "row", "thead", "card", "section", "topbar"] },
    classGroups: { "font-size": [{ text: ["body", "label", "display", "title"] }] },
  },
});

/** Join class names and resolve Tailwind conflicts, last one wins. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
