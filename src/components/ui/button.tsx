import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Every variant carries a 1px border (transparent when it has none) so
 * switching variant, or a hover state, never changes the box size.
 * Heights come from density tokens, so `data-density` resizes every button.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-medium transition-colors aria-disabled:opacity-60 [&_svg]:size-[var(--icon-size)] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-primary-fg hover:bg-primary-hover",
        secondary: "border-outline bg-surface-raised text-ink-strong hover:border-outline-strong",
        outline: "border-outline bg-transparent text-ink-strong hover:border-outline-strong hover:bg-surface-raised",
        ghost: "border-transparent bg-transparent text-ink-muted hover:bg-surface-raised hover:text-ink",
        danger: "border-danger/60 bg-transparent text-danger-ink hover:bg-danger-soft",
      },
      size: {
        sm: "min-h-ctl-sm px-2 text-xs",
        md: "min-h-ctl-md px-3 text-body",
        lg: "min-h-ctl-lg px-4 text-sm",
        "icon-sm": "size-ctl-sm p-0",
        icon: "size-ctl-md p-0",
        "icon-lg": "size-ctl-lg p-0",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (for example a Link) with button styling. */
    asChild?: boolean;
    /** Disables the button and shows a spinner. Ignored with `asChild`. */
    loading?: boolean;
  };

export function Button({ className, variant, size, asChild = false, loading = false, disabled, type, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) return <Slot className={classes} {...props}>{children}</Slot>;
  return (
    <button type={type ?? "button"} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
