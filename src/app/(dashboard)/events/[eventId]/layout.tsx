import { EventTabs } from "@/components/events/event-tabs";

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <div className="space-y-4"><EventTabs eventId={eventId} />{children}</div>;
}
