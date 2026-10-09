import { formatEventDate } from "@/lib/date-time";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { getEvent } from "@/services/events";
import { checkinCount, recentCheckins } from "@/services/checkins";
import { CheckinConsole } from "@/components/checkin/checkin-console";
export default async function CheckinPage({ params }: { params: Promise<{ eventId: string }> }) { await requireRole("ADMIN", "EVENT_MANAGER", "RECEPTIONIST"); const { eventId } = await params; const [event, count, recent] = await Promise.all([getEvent(eventId), checkinCount(eventId), recentCheckins(eventId)]); if (!event) notFound(); return <section><p className="mb-4 text-body text-ink-muted">{event.name}</p><CheckinConsole eventId={eventId} checkedIn={count.checkedIn} eligible={count.eligible} recent={recent.map(({ checkin, participant }) => ({ time: formatEventDate(checkin.checkedInAt), name: participant.name, company: participant.company, method: checkin.checkinMethod }))} /></section>; }
