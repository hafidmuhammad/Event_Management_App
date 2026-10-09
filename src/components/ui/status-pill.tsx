import type { ReactNode } from "react";
import { Badge, type BadgeProps } from "./badge";

// Same three tones as before, now backed by Badge so there is one pill style.
const toneVariant: Record<"sky" | "leaf" | "sun", NonNullable<BadgeProps["variant"]>> = {
  sky: "info",
  leaf: "positive",
  sun: "warning",
};

export function StatusPill({ children, tone = "sky" }: { children: ReactNode; tone?: keyof typeof toneVariant }) {
  return <Badge variant={toneVariant[tone]} className="min-h-6 text-xs font-medium">{children}</Badge>;
}
