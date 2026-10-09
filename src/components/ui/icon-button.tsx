import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { Tooltip } from "./tooltip";

/**
 * Square, icon-only button. `label` is required: it becomes the accessible
 * name (`aria-label`) and, unless `tooltip={false}`, the hover/focus tooltip.
 */
export function IconButton({ label, tooltip = true, variant = "ghost", size = "icon", children, ...props }: Omit<ButtonProps, "aria-label" | "asChild"> & { label: string; tooltip?: boolean; children: ReactNode }) {
  const button = <Button variant={variant} size={size} aria-label={label} {...props}>{children}</Button>;
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
}
