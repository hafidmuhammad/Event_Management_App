"use server";

import { revalidatePath } from "next/cache";
import { unstable_update } from "@/auth";
import { requireAuth } from "@/lib/auth/authorization";
import { profileSchema } from "@/lib/validation/profile";
import { updateUserName } from "@/services/users";
import type { ActionResult } from "@/components/ui/action-form";

/**
 * Saves the signed-in user's own display name. The user id comes from the
 * session, never from the form, so nobody can rename someone else.
 */
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const session = await requireAuth();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid name." };
  try {
    const user = await updateUserName(session.user.id, parsed.data.name);
    if (!user) return { ok: false, error: "Your account could not be found." };
    // Refreshes the name stored in the session cookie so the top bar updates without logging in again.
    await unstable_update({ user: { name: user.name } });
  } catch {
    return { ok: false, error: "Unable to save your profile. Try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true, notice: "Profile saved." };
}
