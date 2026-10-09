"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PresentationControls({ returnHref }: { returnHref: string }) {
  const [error, setError] = useState("");
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setError("");
    } catch { setError("Fullscreen is unavailable in this browser."); }
  }
  return <div data-density="comfortable" className="fixed bottom-4 right-4 z-20 rounded-md border border-outline bg-surface p-2 opacity-20 transition-opacity hover:opacity-100 focus-within:opacity-100 print:hidden"><div className="flex gap-2"><Button asChild variant="outline"><Link href={returnHref}><ArrowLeft aria-hidden="true" />Back to event</Link></Button><Button type="button" variant="outline" onClick={fullscreen}><Maximize aria-hidden="true" />Fullscreen</Button></div>{error && <p role="alert" className="mt-2 text-xs">{error}</p>}</div>;
}
