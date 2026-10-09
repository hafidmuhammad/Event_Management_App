import { formatEventDate } from "@/lib/date-time";
import { notFound } from "next/navigation";
import { toString } from "qrcode";
import { getTicketByToken } from "@/services/tickets";

const date = formatEventDate;
export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const item = await getTicketByToken(token); if (!item) notFound();
  const qr = await toString(token, { type: "svg", margin: 1 });
  return <main className="min-h-screen bg-surface-sunken px-4 py-8 text-ink sm:grid sm:place-items-center"><article className="w-full max-w-md rounded-xl border border-outline bg-surface p-5 shadow-lg"><p className="eyebrow">Event ticket</p><h1 className="mt-2 text-xl font-semibold">{item.event.name}</h1><p className="mt-1 text-sm text-ink-muted">{date(item.event.eventStart)} · {item.event.venue ?? "Venue to be confirmed"}</p><div className="my-5 grid place-items-center rounded-lg bg-white p-4" aria-label="Ticket QR code" dangerouslySetInnerHTML={{ __html: qr }} /><dl className="space-y-3 text-sm"><div><dt className="text-ink-muted">Participant</dt><dd>{item.participant.name}</dd></div><div><dt className="text-ink-muted">Company</dt><dd>{item.participant.company ?? "—"}</dd></div><div><dt className="text-ink-muted">Ticket number</dt><dd className="font-mono text-link">{item.ticket.ticketNumber}</dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="text-ink-muted">Valid from</dt><dd>{date(item.ticket.validFrom)}</dd></div><div><dt className="text-ink-muted">Valid until</dt><dd>{date(item.ticket.validUntil)}</dd></div></div></dl></article></main>;
}
