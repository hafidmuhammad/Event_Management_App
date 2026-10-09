import { EventForm } from "@/components/events/event-form";
import { createEventAction } from "@/app/(dashboard)/events/actions";
import { requireRole } from "@/lib/auth/authorization";

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const params = await searchParams;
  return <section className="mx-auto max-w-4xl space-y-4"><div><p className="eyebrow">Events</p><h1 className="page-title">Create event</h1><p className="page-subtitle">Start with the schedule and registration rules.</p></div><EventForm action={createEventAction} error={params.error} /></section>;
}
