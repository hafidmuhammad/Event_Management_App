"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/ui/feedback-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";

type Result = { state: string; participant?: { name: string; company: string | null }; ticket?: { ticketNumber: string }; checkedInAt?: string };
type Person = { id: string; name: string; company: string | null; status: string };
type CheckinTab = "manual" | "qr";

const labels: Record<string, string> = { VALID: "Valid ticket", INVALID: "Invalid ticket", EXPIRED: "Ticket expired", REVOKED: "Ticket revoked", WRONG_EVENT: "Wrong event", ALREADY_CHECKED_IN: "Already checked in", NOT_YET_VALID: "Not valid yet", NOT_APPROVED: "Participant is not eligible" };

export function CheckinConsole({ eventId, recent, checkedIn, eligible }: { eventId: string; recent: { time: string; name: string; company: string | null; method: string }[]; checkedIn: number; eligible: number }) {
  const { toast } = useFeedback();
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<{ stop: () => void } | null>(null);
  const cameraGeneration = useRef(0);
  const [activeTab, setActiveTab] = useState<CheckinTab>("manual");
  const [camera, setCamera] = useState("Camera is off");
  const [result, setResult] = useState<Result | null>(null);
  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const locked = useRef(false);
  const router = useRouter();

  useEffect(() => () => { cameraGeneration.current++; controls.current?.stop(); }, []);

  async function validate(token: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true); setError(""); setConfirmed(false); setResult(null);
    setCamera("Checking ticket…");
    setScannedToken(token);
    try {
      const response = await fetch(`/api/events/${eventId}/check-in/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      if (!response.ok) throw new Error("Unable to validate this ticket. Please try again.");
      const next: Result = await response.json(); setResult(next);
      toast(labels[next.state] ?? "Ticket validated", next.state === "VALID" ? "success" : "error");
    } catch (error) { const message = error instanceof Error ? error.message : "Unable to validate ticket."; setError(message); toast(message, "error"); }
    finally { locked.current = false; setBusy(false); setCamera("Camera is off"); }
  }

  async function startCamera() {
    if (cameraRunning || busy) return;
    const generation = ++cameraGeneration.current;
    setCameraRunning(true); setError(""); setResult(null); setConfirmed(false);
    try {
      const reader = new BrowserQRCodeReader();
      setCamera("Requesting camera permission…");
      const scannerControls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, video.current!, (scan) => {
        if (generation !== cameraGeneration.current) return;
        if (scan) {
          cameraGeneration.current++;
          controls.current?.stop();
          setCameraRunning(false);
          void validate(scan.getText());
        }
      });
      if (generation !== cameraGeneration.current) { scannerControls.stop(); return; }
      controls.current = scannerControls;
      setCamera("Ready to scan");
    } catch {
      setCameraRunning(false);
      setCamera("Camera unavailable. Check browser permission and try again.");
      toast("Camera unavailable. Use the ticket-token fallback or check browser permission.", "error");
    }
  }

  async function confirm(token?: string, participantId?: string) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setConfirmed(false); setResult(null);
    try {
      const response = await fetch(`/api/events/${eventId}/check-in/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, participantId }) });
      if (!response.ok) throw new Error("Check-in could not be completed. Please try again.");
      const next: Result = await response.json();
      setResult(next);
      if (next.state === "VALID") {
        setConfirmed(true); setScannedToken(null);
        if (participantId) setPeople((items) => items.map((item) => item.id === participantId ? { ...item, status: "CHECKED_IN" } : item));
        router.refresh();
        toast(`Check-in confirmed for ${next.participant?.name ?? "participant"}.`);
      } else {
        toast(labels[next.state] ?? "Check-in could not be completed.", "error");
      }
    } catch (error) { const message = error instanceof Error ? error.message : "Unable to confirm check-in."; setError(message); toast(message, "error"); }
    finally { locked.current = false; setBusy(false); }
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/events/${eventId}/check-in/search?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error("Search is unavailable. Please try again.");
      const matches: Person[] = await response.json(); setPeople(matches); setSearched(true);
      toast(`${matches.length} eligible participants found.`, "info");
    } catch (error) { const message = error instanceof Error ? error.message : "Search failed."; setError(message); toast(message, "error"); }
    finally { locked.current = false; setBusy(false); }
  }

  function selectTab(tab: CheckinTab) {
    if (tab === "manual") {
      cameraGeneration.current++;
      controls.current?.stop();
      setCamera("Camera is off");
      setCameraRunning(false);
    }
    setActiveTab(tab);
    setResult(null); setError(""); setScannedToken(null); setConfirmed(false);
  }

  // Reception staff often work on touch screens, so this console keeps the roomier control sizes.
  return <div className="space-y-4" data-density="comfortable">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="eyebrow">Reception desk</p><h1 className="page-title">Check-in</h1></div>
      <p className="text-sm text-ink-muted"><strong className="text-ink">{checkedIn}</strong> checked in · {Math.max(0, eligible - checkedIn)} expected</p>
    </div>
    {error && <Alert variant="danger">{error}</Alert>}
    {!eligible && <Alert variant="info">No approved participants are eligible yet. An event manager must review registrations before check-in can begin.</Alert>}

    <fieldset disabled={busy} className="min-w-0"><section className="overflow-hidden rounded-md border border-outline bg-surface" aria-label="Check-in methods" aria-busy={busy}>
      <div role="tablist" onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? "manual" : event.key === "End" ? "qr" : activeTab === "manual" ? "qr" : "manual"; selectTab(next); document.getElementById(`${next === "manual" ? "manual" : "qr"}-checkin-tab`)?.focus(); }} aria-label="Choose check-in method" className="flex overflow-x-auto border-b border-outline px-2">
        <button id="manual-checkin-tab" tabIndex={activeTab === "manual" ? 0 : -1} type="button" role="tab" aria-selected={activeTab === "manual"} aria-controls="manual-checkin-panel" className={`whitespace-nowrap border-b-2 px-3 py-2 text-center text-body transition-colors ${activeTab === "manual" ? "border-accent text-ink" : "border-transparent text-ink-muted hover:border-outline-strong hover:text-ink"}`} onClick={() => selectTab("manual")}>Manual check-in</button>
        <button id="qr-checkin-tab" tabIndex={activeTab === "qr" ? 0 : -1} type="button" role="tab" aria-selected={activeTab === "qr"} aria-controls="qr-checkin-panel" className={`whitespace-nowrap border-b-2 px-3 py-2 text-center text-body transition-colors ${activeTab === "qr" ? "border-accent text-ink" : "border-transparent text-ink-muted hover:border-outline-strong hover:text-ink"}`} onClick={() => selectTab("qr")}>QR scanner</button>
      </div>

      {activeTab === "manual" && <div id="manual-checkin-panel" role="tabpanel" aria-labelledby="manual-checkin-tab" className="p-4">
        <div><p className="eyebrow">Search participant</p><h2 className="section-title mt-1">Manual check-in</h2><p className="mt-1 text-xs text-ink-muted">Find an approved participant by name, email, or phone.</p></div>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={search}><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, or phone" aria-label="Search participant" /><Button type="submit" variant="primary" className="min-h-10 sm:px-5">Search</Button></form>
        {people.length > 0 && <ul className="mt-4 divide-y divide-outline rounded-md border border-outline">{people.map((person) => <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><p className="font-medium text-ink">{person.name}</p><p className="text-xs text-ink-muted">{person.company ?? "—"} · {person.status}</p></div><Button type="button" variant="primary" size="sm" disabled={person.status === "CHECKED_IN"} onClick={() => confirm(undefined, person.id)}>{person.status === "CHECKED_IN" ? "Checked in" : "Check in"}</Button></li>)}</ul>}
        {result && <div className={`mt-3 rounded-md border px-3 py-2 text-sm ${result.state === "VALID" ? "border-success/50 bg-success-soft text-success-ink" : "border-warning/50 bg-warning-soft text-warning-ink"}`} role="status"><p className="font-semibold">{result.state === "VALID" ? "Check-in confirmed" : labels[result.state] ?? "Check-in result"}</p>{result.participant && <p className="mt-1 text-sm">{result.participant.name}{result.participant.company ? ` · ${result.participant.company}` : ""}</p>}</div>}
        {!people.length && <p className="mt-5 rounded-md border border-dashed border-outline px-4 py-6 text-center text-sm text-ink-muted">{searched ? "No eligible participants found. Try another name, email, or phone." : "Search for a participant to start a manual check-in."}</p>}
      </div>}

      {activeTab === "qr" && <div id="qr-checkin-panel" role="tabpanel" aria-labelledby="qr-checkin-tab" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Fast lane</p><h2 className="section-title mt-1">QR scanner</h2><p className="mt-1 text-xs text-ink-muted">Point the camera at the attendee ticket QR code.</p></div><div className="flex gap-2"><Button type="button" variant="primary" disabled={cameraRunning} className="min-h-10" onClick={startCamera}>Start scanner</Button><Button type="button" variant="outline" disabled={!cameraRunning} className="min-h-10" onClick={() => { cameraGeneration.current++; controls.current?.stop(); setCameraRunning(false); setCamera("Camera is off"); }}>Stop</Button></div></div>
        <p className="mt-3 rounded-md bg-surface-sunken px-3 py-2 text-xs text-ink-muted" role="status">{camera}</p>
        <video ref={video} className={`${cameraRunning ? "block" : "hidden"} mt-3 aspect-video max-h-80 w-full rounded-md bg-surface-sunken object-cover`} playsInline muted />
        {!cameraRunning && <div className="mt-3 rounded-md border border-dashed border-outline px-4 py-8 text-center text-ink-muted">Start the scanner to use your camera, or enter a ticket token below.</div>}
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); void validate(manualToken.trim()); }}><label className="flex-1"><span className="block text-xs font-medium text-ink-muted">Ticket token (camera fallback)</span><Input value={manualToken} onChange={(event) => setManualToken(event.target.value)} required /></label><Button type="submit" variant="outline" disabled={!manualToken.trim() || cameraRunning} className="sm:self-end">Validate ticket</Button></form>
        {result && <div role="status" className={`mt-3 rounded-md border px-3 py-2 text-sm ${result.state === "VALID" ? "border-success/50 bg-success-soft text-success-ink" : "border-warning/50 bg-warning-soft text-warning-ink"}`}><p className="font-semibold">{confirmed ? "Check-in confirmed" : labels[result.state] ?? "Check-in result"}</p>{result.participant && <p className="mt-1 text-sm">{result.participant.name}{result.participant.company ? ` · ${result.participant.company}` : ""}</p>}{result.ticket && <p className="font-mono text-xs">{result.ticket.ticketNumber}</p>}{result.state === "VALID" && !confirmed && scannedToken && <Button type="button" variant="primary" className="mt-3 min-h-10" onClick={() => confirm(scannedToken)}>Confirm check-in</Button>}</div>}
      </div>}
    </section></fieldset>

    <section><h2 className="section-title">Recent check-ins</h2><ul className="mt-2 divide-y divide-outline rounded-md border border-outline bg-surface px-3">{recent.map((item, index) => <li key={`${item.name}-${index}`} className="flex flex-wrap justify-between gap-3 py-2 text-sm"><span>{item.name}<small className="ml-2 text-ink-muted">{item.company ?? "—"}</small></span><span className="text-ink-muted">{item.time} · {item.method}</span></li>)}{!recent.length && <li className="py-5 text-center text-sm text-ink-muted">No check-ins yet.</li>}</ul></section>
  </div>;
}
