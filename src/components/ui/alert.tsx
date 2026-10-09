import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

const alertVariants = cva("flex items-start gap-2 rounded-md border px-3 py-2 text-body [&>svg]:mt-0.5 [&>svg]:size-[var(--icon-size)] [&>svg]:shrink-0", {
  variants: {
    variant: {
      info: "border-info/50 bg-info-soft text-info-ink",
      success: "border-success/50 bg-success-soft text-success-ink",
      warning: "border-warning/50 bg-warning-soft text-warning-ink",
      danger: "border-danger/50 bg-danger-soft text-danger-ink",
    },
  },
  defaultVariants: { variant: "info" },
});

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert } as const;

/** Inline message. Warnings and errors announce immediately (`role="alert"`); the rest are polite. */
export function Alert({ className, variant = "info", title, children, ...props }: Omit<ComponentProps<"div">, "title"> & VariantProps<typeof alertVariants> & { title?: ReactNode }) {
  const Icon = icons[variant ?? "info"];
  return (
    <div role={variant === "danger" || variant === "warning" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5" : undefined}>{children}</div>}
      </div>
    </div>
  );
}
