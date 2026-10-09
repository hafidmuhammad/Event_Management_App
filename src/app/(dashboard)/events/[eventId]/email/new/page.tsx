import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
export default async function EmailModalRedirect({ params }: { params: Promise<{ eventId: string; templateId?: string }> }) {
  await requireRole("ADMIN", "EVENT_MANAGER");
  const { eventId } = await params;
  redirect(`/events/${eventId}/email?compose=new`);
}
