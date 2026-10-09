"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { IconButton } from "./icon-button";
import { cn } from "@/lib/cn";
import { routeFeedback, type ToastTone } from "@/lib/feedback";
import { createPortal } from "react-dom";

type Confirmation = { title?: string; message: string; confirmLabel?: string; danger?: boolean };
type Toast = { id: number; message: string; tone: ToastTone };
type Feedback = { confirm: (options: Confirmation) => Promise<boolean>; toast: (message: string, tone?: ToastTone) => void };
const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("FeedbackProvider is required.");
  return context;
}

function RouteFeedback() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useFeedback();
  useEffect(() => {
    const current = new URL(window.location.href);
    const messages = routeFeedback(current.searchParams);
    if (!messages.length) return;
    current.searchParams.delete("notice"); current.searchParams.delete("error");
    window.history.replaceState(window.history.state, "", `${current.pathname}${current.search}${current.hash}`);
    for (const message of messages) toast(message.message, message.tone);
    if (messages.some((message) => message.tone === "success")) window.dispatchEvent(new Event("app:process-complete"));
  }, [pathname, params, toast]);
  return null;
}

function ToastItem({ item, dismiss }: { item: Toast; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused || item.tone === "error") return; const timer = window.setTimeout(() => dismiss(item.id), 6000); return () => window.clearTimeout(timer); }, [item, dismiss, paused]);
  const Icon = item.tone === "error" ? CircleAlert : item.tone === "success" ? CircleCheck : Info;
  const iconColor = item.tone === "error" ? "text-danger-ink" : item.tone === "success" ? "text-success-ink" : "text-info-ink";
  return <div role={item.tone === "error" ? "alert" : "status"} className="flex items-start gap-2.5 rounded-md border border-outline bg-overlay p-3 text-ink shadow-md" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <Icon aria-hidden="true" className={cn("mt-0.5 size-[var(--icon-size)] shrink-0", iconColor)} />
    <p className="min-w-0 flex-1 break-words text-body">{item.message}</p>
    <IconButton label="Dismiss notification" tooltip={false} size="icon-sm" variant="outline" className="shrink-0" onClick={() => dismiss(item.id)}><X aria-hidden="true" /></IconButton>
  </div>;
}

function ToastViewport({ items, dismiss }: { items: Toast[]; dismiss: (id: number) => void }) {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    const sync = () => { const dialogs = document.querySelectorAll("dialog[open]"); setTarget(dialogs.item(dialogs.length - 1) ?? document.body); };
    sync();
    const observer = new MutationObserver(sync); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => observer.disconnect();
  }, []);
  if (!target) return null;
  return createPortal(<aside aria-label="Notifications" className="fixed inset-x-3 bottom-3 z-toast space-y-2 sm:left-auto sm:w-96">{items.map((item) => <ToastItem key={item.id} item={item} dismiss={dismiss} />)}</aside>, target);
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const sequence = useRef(0);
  const resolve = useRef<((value: boolean) => void) | null>(null);
  const toast = useCallback((message: string, tone: ToastTone = "success") => { const id = ++sequence.current; setToasts((items) => [...items.slice(-4), { id, message, tone }]); }, []);
  const confirm = useCallback((options: Confirmation) => new Promise<boolean>((done) => { resolve.current?.(false); resolve.current = done; setConfirmation(options); }), []);
  const finish = useCallback((approved: boolean) => { const done = resolve.current; resolve.current = null; setConfirmation(null); done?.(approved); }, []);
  const dismiss = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  useEffect(() => () => resolve.current?.(false), []);
  const context = useMemo(() => ({ confirm, toast }), [confirm, toast]);
  return <FeedbackContext.Provider value={context}>{children}<Suspense fallback={null}><RouteFeedback /></Suspense>
    <ToastViewport items={toasts} dismiss={dismiss} />
    {confirmation && <Dialog title={confirmation.title ?? "Confirm action"} alert onClose={() => finish(false)}><p className="text-sm leading-6 text-ink-muted">{confirmation.message}</p><div className="mt-5 flex justify-end gap-2"><Button autoFocus variant="outline" onClick={() => finish(false)}>Cancel</Button><Button variant={confirmation.danger ? "danger" : "primary"} onClick={() => finish(true)}>{confirmation.confirmLabel ?? "Confirm"}</Button></div></Dialog>}
  </FeedbackContext.Provider>;
}
