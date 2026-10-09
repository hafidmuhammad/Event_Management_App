import { Badge, type BadgeProps } from "@/components/ui/badge";

type Variant = NonNullable<BadgeProps["variant"]>;

/** Event lifecycle status as a coloured pill. One mapping for every screen that shows it. */
export function eventStatusVariant(status: string): Variant {
  if (status === "PUBLISHED" || status === "ONGOING") return "positive";
  if (status === "CANCELLED") return "negative";
  if (status === "DRAFT") return "warning";
  return "neutral";
}

export function EventStatusBadge({ status }: { status: string }) {
  return <Badge variant={eventStatusVariant(status)}>{status}</Badge>;
}
