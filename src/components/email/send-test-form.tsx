"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useFeedback } from "@/components/ui/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { Label } from "@/components/ui/field";
export function SendTestForm({ eventId, templateId }: { eventId: string; templateId: string }) {
  const { confirm, toast } = useFeedback();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true);
    if (!await confirm({ title: "Send test email?", message: `Send this template to ${email}? The configured transport will be used.`, confirmLabel: "Send test" })) { setBusy(false); return; }
    setMessage(""); setSessionExpired(false);
    try {
      const response = await fetch(`/api/events/${eventId}/email/test`, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ templateId, email }) });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) setSessionExpired(true);
      if (!response.ok) throw new Error(body.error ?? "Test email failed");
      const notice = body.mode === "smtp" ? "Test email sent through SMTP." : "Test preview saved locally. No email was sent.";
      setMessage(notice); toast(notice);
    } catch (error) { const notice = error instanceof Error ? error.message : "Test email failed"; setMessage(notice); toast(notice, "error"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-md border border-outline bg-surface p-3"><Label className="min-w-0 flex-1 space-y-1 text-sm">Test recipient<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required disabled={busy} /></Label><Button type="submit" variant="outline" size="sm" disabled={busy}>{busy ? "Sending…" : "Send Test"}</Button>{sessionExpired && <Button asChild variant="outline" size="sm"><Link href="/login">Sign in again</Link></Button>}{message && <p className="basis-full text-xs text-ink-muted" role="status">{message}</p>}</form>;
}
