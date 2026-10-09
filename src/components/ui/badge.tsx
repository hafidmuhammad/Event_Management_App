import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label font-semibold", {
  variants: {
    variant: {
      neutral: "bg-neutral-soft text-ink-muted",
      positive: "bg-success-soft text-success-ink",
      warning: "bg-warning-soft text-warning-ink",
      negative: "bg-danger-soft text-danger-ink",
      info: "bg-info-soft text-info-ink",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
