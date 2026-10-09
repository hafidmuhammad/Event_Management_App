"use client";

import { useEffect, useState } from "react";
import { SubmitButton, type ActionResult } from "@/components/ui/action-form";
import { Input } from "@/components/ui/controls";
import { DetailList } from "@/components/ui/detail-list";
import { Field } from "@/components/ui/field";
import { useFeedback } from "@/components/ui/feedback-provider";

/** Name is editable. Email and role are shown, but only an administrator changes them. */
export function ProfileForm({ action, name, email, role }: { action: (formData: FormData) => Promise<ActionResult>; name: string; email: string; role: string }) {
  const { toast } = useFeedback();
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  // After saving, the page re-renders with the stored name; keep the field in step with it.
  useEffect(() => { setValue(name); }, [name]);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        try {
          const result = await action(formData);
          if (!result.ok) { setError(result.error ?? "Unable to save your profile."); toast(result.error ?? "Unable to save your profile.", "error"); return; }
          setError("");
          toast(result.notice ?? "Profile saved.");
        } catch {
          setError("Unable to save your profile. Check your connection and try again.");
          toast("Unable to save your profile. Check your connection and try again.", "error");
        }
      }}
    >
      <Field label="Name" required error={error || undefined} hint="Shown in the top bar and in activity you create.">
        <Input name="name" required minLength={2} maxLength={160} autoComplete="name" value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} />
      </Field>
      <DetailList>
        <dt>Email</dt><dd>{email}</dd>
        <dt>Role</dt><dd>{role}</dd>
      </DetailList>
      <p className="text-xs text-ink-subtle">Your email and role are managed by an administrator.</p>
      <div className="flex justify-end"><SubmitButton label="Save profile" pendingLabel="Saving…" /></div>
    </form>
  );
}
