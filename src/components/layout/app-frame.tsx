"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { DashboardNavigation } from "./dashboard-navigation";
import { BrandIcon, BrandText } from "@/components/ui/brand-mark";
import type { AppRole } from "@/lib/auth/authorization";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "app:sidebar-collapsed";

/**
 * Shell frame owning the sidebar collapse state. Sidebar width and the content
 * padding both read the density tokens (`--sidebar-w`, `--sidebar-w-collapsed`),
 * so the top bar and main content never leave a gap beside the sidebar and the
 * whole frame resizes with `data-density`.
 */
export function AppFrame({ header, mobileNav, role, children }: { header: ReactNode; mobileNav: ReactNode; role?: AppRole; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "1"); } catch { /* collapse state is a convenience only */ }
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((value) => {
      const next = !value;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  const label = collapsed ? "Expand sidebar" : "Minimize sidebar";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <div className="min-h-screen bg-background text-ink" data-sidebar={ready ? (collapsed ? "collapsed" : "expanded") : undefined}>
      <aside
        aria-label="Primary"
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-outline-soft bg-background px-3 py-5 transition-[width] duration-150 lg:flex",
          collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
        )}
      >
        {/* The logo doubles as the collapse control: hover or focus swaps it for the panel icon. */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            aria-pressed={collapsed}
            title={label}
            className="group relative shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/60"
          >
            <BrandIcon className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" />
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center rounded-md border border-outline-strong bg-surface-raised text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [&_svg]:size-[var(--icon-size)]">
              <ToggleIcon />
            </span>
          </button>
          {!collapsed && <BrandText />}
        </div>
        <DashboardNavigation collapsed={collapsed} role={role} />
        <div className="mt-auto space-y-3">
          {!collapsed && (
            <div className="rounded-md border border-outline bg-surface p-card">
              <p className="text-label font-semibold uppercase tracking-wider text-ink-muted">Operations</p>
              <p className="mt-1.5 text-body text-ink-muted">Manage event readiness from one compact workspace.</p>
            </div>
          )}
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-150", collapsed ? "lg:pl-[var(--sidebar-w-collapsed)]" : "lg:pl-[var(--sidebar-w)]")}>
        {header}
        <div className="border-b border-outline-soft bg-surface px-4 py-2 lg:hidden">{mobileNav}</div>
        <main className="mx-auto max-w-[1280px] px-4 py-section md:px-6">{children}</main>
      </div>
    </div>
  );
}
