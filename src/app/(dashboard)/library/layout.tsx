import { requireRole } from "@/lib/auth/authorization";
import { LibraryTabs } from "@/components/layout/library-tabs";

/**
 * Library is one menu with two sections: global email templates and global
 * contact lists. The role guard lives here so every child route inherits it.
 */
export default async function LibraryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("ADMIN", "EVENT_MANAGER");
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Library</p>
        <h1 className="page-title">Reusable assets</h1>
        <p className="page-subtitle">Blueprints and address books shared across every event.</p>
      </div>
      <LibraryTabs />
      {children}
    </div>
  );
}
