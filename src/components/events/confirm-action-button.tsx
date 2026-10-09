"use client";

import { useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { useFeedback } from "@/components/ui/feedback-provider";
import { cn } from "@/lib/cn";

/**
 * Submit button that asks for confirmation first. Style it with `variant` and
 * `size`. `className` still takes a raw class string for call sites not
 * migrated yet; it wins over `variant`, and a class containing "danger" still
 * makes the confirmation dialog destructive.
 */
export function ConfirmActionButton({ children, message, className, variant = "danger", size = "sm", disabled = false }: { children: React.ReactNode; message: string; className?: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const { confirm } = useFeedback();
  const [reviewing, setReviewing] = useState(false);
  const locked = useRef(false);
  const danger = className ? className.includes("danger") : variant === "danger";
  return <button type="button" disabled={disabled || pending || reviewing} className={className ?? buttonVariants({ variant, size })} onClick={async (event) => {
    const form = event.currentTarget.form;
    if (!form || locked.current || !form.reportValidity()) return;
    locked.current = true; setReviewing(true);
    const approved = await confirm({ message, danger, confirmLabel: typeof children === "string" ? children : "Confirm" });
    locked.current = false; setReviewing(false);
    if (approved && form.isConnected) form.requestSubmit();
  }} aria-busy={pending}>{pending ? <><LoaderCircle aria-hidden="true" className={cn("size-3.5 animate-spin", className && "mr-2")} />Processing…</> : children}</button>;
}
