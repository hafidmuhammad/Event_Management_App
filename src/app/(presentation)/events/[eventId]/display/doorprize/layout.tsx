import { PresentationControls } from "@/components/events/presentation-controls";

export default async function DoorprizePresentationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <>{children}<PresentationControls returnHref={`/events/${eventId}/doorprize`} /></>;
}
