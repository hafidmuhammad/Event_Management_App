import { redirect } from "next/navigation";
import { requireAuth, type AppRole } from "@/lib/auth/authorization";
import { findUserById } from "@/services/users";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ProfileForm } from "@/components/settings/profile-form";
import { updateProfileAction } from "./actions";

export const metadata = { title: "Settings" };

const roleLabels: Record<AppRole, string> = { ADMIN: "Admin", EVENT_MANAGER: "Event manager", RECEPTIONIST: "Receptionist" };

/** Personal settings for the signed-in user: profile and appearance. Open to every role. */
export default async function SettingsPage() {
  const session = await requireAuth();
  const user = await findUserById(session.user.id);
  if (!user) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">Settings</p>
        <h1 className="page-title">Profile and appearance</h1>
        <p className="page-subtitle">Your name and how the workspace looks on this device.</p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <Card asChild>
          <section aria-labelledby="profile-heading">
            <CardHeader>
              <div className="min-w-0">
                <CardTitle id="profile-heading">Profile</CardTitle>
                <CardDescription className="mt-1">Who you are in this workspace.</CardDescription>
              </div>
            </CardHeader>
            <ProfileForm action={updateProfileAction} name={user.name} email={user.email} role={roleLabels[user.role]} />
          </section>
        </Card>

        <Card asChild>
          <section aria-labelledby="appearance-heading">
            <CardHeader>
              <div className="min-w-0">
                <CardTitle id="appearance-heading">Appearance</CardTitle>
                <CardDescription className="mt-1">Saved on this device only. Changes apply immediately.</CardDescription>
              </div>
            </CardHeader>
            <AppearanceSettings />
          </section>
        </Card>
      </div>
    </div>
  );
}
