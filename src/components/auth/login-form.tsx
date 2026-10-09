"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validation/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { useFeedback } from "@/components/ui/feedback-provider";
import { IconButton } from "@/components/ui/icon-button";

export function LoginForm() {
  const { toast } = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const input = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details and try again.");
      toast(parsed.error.issues[0]?.message ?? "Check your details and try again.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn("credentials", { ...parsed.data, redirect: false, callbackUrl: "/dashboard" });
        if (!result || result.error) { setError("We couldn't sign you in with those details. Please try again."); toast("We couldn't sign you in with those details. Please try again.", "error"); }
        else window.location.assign("/dashboard?notice=Signed%20in%20successfully.");
      } catch { setError("Unable to connect. Check your connection and try again."); toast("Unable to connect. Check your connection and try again.", "error"); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <Field id="email" label="Email address">
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field id="password" label="Password">
        <div className="relative">
          <Input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="pr-10" placeholder="Enter your password" />
          <IconButton
            label="Show password"
            size="icon-sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-pressed={showPassword}
            aria-controls="password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </IconButton>
        </div>
      </Field>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        {isPending ? "Signing you in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-muted">Use your team account to continue.</p>
    </form>
  );
}
