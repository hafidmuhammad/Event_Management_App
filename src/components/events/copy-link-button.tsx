"use client";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useFeedback } from "@/components/ui/feedback-provider";
import { OverflowMenuItem } from "@/components/ui/overflow-menu";

async function copyLink(path: string, toast: ReturnType<typeof useFeedback>["toast"]) {
  try { await navigator.clipboard.writeText(new URL(path, window.location.origin).href); toast("Share link copied."); } catch { toast("Clipboard is unavailable. Open the public link and copy its address.", "error"); }
}

/** Same action as `CopyLinkButton`, as an item for an `OverflowMenu`. Feedback is the toast, since the menu closes. */
export function CopyLinkMenuItem({ path, label = "Copy share link" }: { path: string; label?: string }) {
  const { toast } = useFeedback();
  return <OverflowMenuItem onSelect={() => { void copyLink(path, toast); }}>{label}</OverflowMenuItem>;
}

/** `variant` / `size` default to the plain outline button this used to be. */
export function CopyLinkButton({ path, label = "Copy share link", variant = "outline", size }: { path: string; label?: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) {
  const { toast } = useFeedback();
  return <Button type="button" variant={variant} size={size} onClick={() => { void copyLink(path, toast); }}>{label}</Button>;
}
