import { requireAuth } from "@/lib/auth/authorization";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAuth();
  return <DashboardShell session={session}>{children}</DashboardShell>;
}
