import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatEventDate } from "@/lib/date-time";
import type { listActivity } from "@/services/activity";

export function ActivityList({ rows }: { rows: Awaited<ReturnType<typeof listActivity>> }) {
  return (
    <Card asChild>
      <section>
        <h2 className="section-title">Recent activity</h2>
        <ul className="divide-y divide-outline">
          {rows.map((row) => (
            <li key={row.id} className="py-2.5 first:pt-0">
              <Link href={`/events/${row.eventId}`} className="text-body text-ink hover:text-link">{row.summary}</Link>
              <p className="mt-1 text-xs text-ink-muted">{formatEventDate(row.createdAt)} · {row.action.replaceAll("_", " ")}</p>
            </li>
          ))}
          {!rows.length && <li className="py-4 text-body text-ink-muted">No recorded activity yet. New operations will appear here.</li>}
        </ul>
      </section>
    </Card>
  );
}
