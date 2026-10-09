import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({ icon, title, description, action, className, ...props }: Omit<ComponentProps<"div">, "title"> & { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-1 px-4 py-10 text-center", className)} {...props}>
      {icon && <div className="mb-1 text-ink-subtle [&_svg]:size-6" aria-hidden="true">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-md text-xs text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
