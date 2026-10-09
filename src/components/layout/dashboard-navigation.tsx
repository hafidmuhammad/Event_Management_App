"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Library, LayoutDashboard, type LucideIcon } from "lucide-react";
import type { AppRole } from "@/lib/auth/authorization";
import { cn } from "@/lib/cn";

/**
 * `roles` limits visibility to the roles that can actually open the route.
 * Library is guarded by requireRole in its layout, so showing it to a
 * RECEPTIONIST would only produce a redirect back to Dashboard.
 */
const navigation: { href: string; label: string; icon: LucideIcon; roles?: AppRole[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/library", label: "Library", icon: Library, roles: ["ADMIN", "EVENT_MANAGER"] },
];

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavigation({ mobile = false, collapsed = false, role }: { mobile?: boolean; collapsed?: boolean; role?: AppRole }) {
  const pathname = usePathname();
  const items = navigation.filter((item) => !item.roles || (role ? item.roles.includes(role) : false));
  return (
    <nav className={mobile ? "mx-auto flex max-w-[1280px] gap-2 overflow-x-auto" : "mt-6 space-y-1"} aria-label={mobile ? "Mobile navigation" : "Main navigation"}>
      {items.map((item) => {
        const active = isActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-ctl-md items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 text-body font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink",
              active && "border-accent bg-surface text-ink",
              collapsed && !mobile && "justify-center gap-0 px-0",
              mobile && "whitespace-nowrap border-l-0 px-3",
              mobile && active && "bg-sky-soft text-link",
            )}
          >
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-md bg-surface [&_svg]:size-[var(--icon-size)]", active && "bg-sky-soft text-link")} aria-hidden="true">
              <Icon />
            </span>
            <span className={collapsed && !mobile ? "sr-only" : "truncate"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
