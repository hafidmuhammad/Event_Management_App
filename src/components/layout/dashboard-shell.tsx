import { BrandMark } from "@/components/ui/brand-mark";
import { ProfileMenu } from "./profile-menu";
import { DashboardNavigation } from "./dashboard-navigation";
import { AppFrame } from "./app-frame";
import type { AppRole, AppSession } from "@/lib/auth/authorization";

function roleLabel(role: AppRole) {
  return role === "EVENT_MANAGER" ? "Event manager" : role.toLowerCase();
}

export function DashboardShell({ session, children }: { session: AppSession; children: React.ReactNode }) {
  const user = session.user;
  const header = (
    <header className="sticky top-0 z-20 flex min-h-topbar items-center border-b border-outline bg-surface px-4 md:px-6">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4">
        <div className="lg:hidden"><BrandMark compact /></div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold text-ink">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</p>
          <p className="text-xs text-ink-muted">Event operations workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-body font-medium text-ink">{user?.name}</p>
            <p className="text-xs capitalize text-ink-muted">{user?.role ? roleLabel(user.role) : "Team member"}</p>
          </div>
          <ProfileMenu name={user?.name} role={user?.role ? roleLabel(user.role) : "Team member"} />
        </div>
      </div>
    </header>
  );

  return <AppFrame header={header} role={user?.role} mobileNav={<DashboardNavigation mobile role={user?.role} />}>{children}</AppFrame>;
}
