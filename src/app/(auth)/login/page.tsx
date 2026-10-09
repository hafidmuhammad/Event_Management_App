import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink">Sign in to your workspace</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">Bring your event team into one clear, focused place.</p>
      <LoginForm />
    </div>
  );
}
