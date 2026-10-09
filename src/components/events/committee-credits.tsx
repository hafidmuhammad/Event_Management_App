"use client";

import { useEffect, useState } from "react";
import { Maximize, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/controls";

type CommitteeMember = { name: string; position: string; division?: string };

export function CommitteeCredits({ eventName, members }: { eventName: string; members: CommitteeMember[] }) {
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(60);
  const [restart, setRestart] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { setReducedMotion(media.matches); setPaused(media.matches); };
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setError("Fullscreen is unavailable in this browser."); }
  }
  return <main data-density="comfortable" className="committee-credits-page min-h-screen overflow-hidden bg-background px-5 py-8 text-ink sm:px-10"><div className="mx-auto max-w-5xl">
    <header className="relative z-10 text-center"><p className="eyebrow">Event credits</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{eventName}</h1><p className="mt-3 text-sm text-ink-muted">With appreciation to the team behind this event</p></header>
    <div className={reducedMotion ? "mt-8" : "committee-credits-viewport"} aria-label="Event committee credits"><div key={restart} className={reducedMotion ? "text-center" : "committee-credits-roll"} style={{ animationPlayState: paused ? "paused" : "running", animationDuration: `${duration}s` }}>{members.length ? members.map((member, index) => <article key={`${member.name}-${index}`} className="committee-credit">{member.division && member.division !== members[index - 1]?.division && <p className="mb-6 text-xs uppercase tracking-[0.24em] text-sky">{member.division}</p>}<p className="text-2xl font-semibold sm:text-4xl">{member.name}</p><p className="mt-2 text-sm uppercase tracking-[0.24em] text-ink-muted sm:text-base">{member.position}</p></article>) : <p className="py-10 text-center text-ink-muted">No committee members have been added yet.</p>}</div></div>
    <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2 rounded-md border border-outline bg-surface p-3 print:hidden">
      {!reducedMotion && <><Button type="button" variant="outline" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}{paused ? "Play" : "Pause"}</Button><Button type="button" variant="outline" onClick={() => { setRestart(restart + 1); setPaused(false); }}><RotateCcw aria-hidden="true" />Restart</Button><label className="flex items-center gap-2 text-xs">Roll duration<Select className="w-auto" value={duration} onChange={(event) => setDuration(Number(event.target.value))}><option value={30}>30 seconds</option><option value={60}>60 seconds</option><option value={90}>90 seconds</option><option value={120}>120 seconds</option></Select></label></>}
      <Button type="button" variant="outline" onClick={fullscreen}><Maximize aria-hidden="true" />Fullscreen</Button>
    </div>{error && <p role="alert" className="mt-2 text-center text-sm">{error}</p>}
  </div></main>;
}
