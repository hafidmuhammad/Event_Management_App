"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useFeedback } from "@/components/ui/feedback-provider";

/** Log out as a menu item. It still asks first, through the application dialog. */
export function LogoutMenuItem() {
  const { confirm, toast } = useFeedback();
  return (
    <DropdownMenuItem
      onSelect={async () => { if (!await confirm({ title: "Log out?", message: "Log out of this workspace? Save any unfinished form changes first.", confirmLabel: "Log out" })) return; try { await signOut({ callbackUrl: "/login?notice=Logged%20out%20successfully." }); } catch { toast("Unable to log out. Please try again.", "error"); } }}
    >
      <LogOut aria-hidden="true" />
      Log out
    </DropdownMenuItem>
  );
}
