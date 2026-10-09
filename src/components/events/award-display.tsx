"use client";
/* eslint-disable @next/next/no-img-element -- display accepts validated local or curated image URLs. */

import { useState } from "react";
import { Award as AwardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
type Award = { name: string; recipientName: string; subtitle?: string; image?: string };
export function AwardDisplay({ awards }: { awards: Award[] }) {
  const [index, setIndex] = useState(0);
  if (!awards.length) return <p className="text-ink-muted">No awards configured.</p>;
  const award = awards[index];
  return <section className="space-y-6 rounded-xl border border-outline bg-gradient-to-br from-hero-start to-hero-end p-8 text-center"><p className="text-body uppercase tracking-[0.2em] text-ink-muted">Award {index + 1} / {awards.length}</p>{award.image && <img src={award.image} alt="" className="mx-auto max-h-64 rounded-lg object-contain" />}{!award.image && <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-surface-raised"><AwardIcon className="size-16 text-accent" aria-hidden="true" /></div>}<div><h2 className="text-display font-semibold">{award.name}</h2><p className="mt-3 text-title text-link">{award.recipientName}</p>{award.subtitle && <p className="mt-2 text-ink-muted">{award.subtitle}</p>}</div><div className="flex justify-center gap-2"><Button type="button" variant="outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>Previous</Button><Button type="button" variant="primary" disabled={index === awards.length - 1} onClick={() => setIndex((current) => current + 1)}>Next</Button></div></section>;
}
