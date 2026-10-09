import { Badge, type BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

/** Participant lifecycle status as a coloured pill. */
export function participantStatusVariant(status: string): Variant {
  if (status === "APPROVED" || status === "CHECKED_IN") return "positive";
  if (status === "REJECTED" || status === "CANCELLED") return "negative";
  if (status === "PENDING" || status === "WAITLIST") return "warning";
  return "neutral";
}

export function ParticipantStatusBadge({ status }: { status: string }) {
  return <Badge variant={participantStatusVariant(status)}>{status}</Badge>;
}
