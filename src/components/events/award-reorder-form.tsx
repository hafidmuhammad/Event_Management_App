"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AwardReorderForm({ initialIds, labels = {}, action }: { initialIds: string[]; labels?: Record<string, string>; action: (formData: FormData) => void }) {
  const [ids, setIds] = useState(initialIds);
  const move = (index: number, delta: number) => setIds((current) => { const next = index + delta; if (next < 0 || next >= current.length) return current; const copy = [...current]; [copy[index], copy[next]] = [copy[next], copy[index]]; return copy; });
  return <form action={action} className="flex flex-wrap items-center gap-2"><input type="hidden" name="orderedIds" value={ids.join(",")} />{ids.map((id, index) => <span key={id} className="inline-flex items-center gap-1 rounded-md border border-outline px-2 py-1 text-xs"><span>{index + 1}. {labels[id] ?? "Award"}</span><Button type="button" variant="outline" size="sm" disabled={index === 0} aria-label={`Move ${labels[id] ?? "award"} up`} onClick={() => move(index, -1)}><ArrowUp aria-hidden="true" /></Button><Button type="button" variant="outline" size="sm" disabled={index === ids.length - 1} aria-label={`Move ${labels[id] ?? "award"} down`} onClick={() => move(index, 1)}><ArrowDown aria-hidden="true" /></Button></span>)}{ids.length > 1 && <Button type="submit" variant="outline" size="sm">Save order</Button>}</form>;
}
