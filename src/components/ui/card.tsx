import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

const cardClass = "flex min-w-0 flex-col gap-3 rounded-md border border-outline bg-surface p-card";

/**
 * In-flow container: a 1px border and no shadow. Elevation is for floating layers only.
 * Use `asChild` to keep a semantic element or a link as the card itself:
 * `<Card asChild><article>...</article></Card>`.
 */
export function Card({ className, asChild = false, ...props }: ComponentProps<"div"> & { asChild?: boolean }) {
  if (asChild) return <Slot className={cn(cardClass, className)} {...props} />;
  return <div className={cn(cardClass, className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("break-words text-sm font-semibold text-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("break-words text-xs text-ink-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("min-w-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)} {...props} />;
}
