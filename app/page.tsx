"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, FieldGroup } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import {
  DEMO_PASSWORD,
  QUICK_DEMO_ACCOUNTS,
  signInPathForEmail,
} from "@/lib/demoAuth";

/**
 * Splash / Login (#1).
 *
 * Mock auth: email routes to the matching seed user's dashboard (or pending
 * screen). Password is never validated — use `demo` or anything.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState(DEMO_PASSWORD);
  const [error, setError] = React.useState<string | null>(null);

  const goTo = (targetEmail: string) => {
    setError(null);
    setEmail(targetEmail);
    router.push(signInPathForEmail(targetEmail));
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter an email or pick a demo account below.");
      return;
    }
    goTo(trimmed);
  };

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="font-display text-3xl font-semibold tracking-tight text-ink">
              Real Estate <span className="text-gold-deep">HQ</span>
            </div>
            <div className="mt-2 text-sm text-ink-muted">
              Your AI-powered real estate sales OS.
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink mb-1 text-center text-balance">
            Close more deals. Earn more.
          </h1>
          <p className="text-sm text-ink-muted mb-6 text-center">
            Sign in to your sales command center.
          </p>

          {/* One-tap demo accounts */}
          <div className="mb-6 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-subtle px-1">
              Quick sign-in (no password check)
            </div>
            <div className="grid gap-2">
              {QUICK_DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => goTo(account.email)}
                  className={cn(
                    "w-full rounded-2xl border border-line bg-canvas-raised px-4 py-3 text-left",
                    "hover:border-gold-deep/40 hover:bg-canvas-sunken transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {account.fullName}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-gold-deep">
                      {account.role}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-ink-muted">{account.blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-canvas px-2 text-ink-subtle">or use email</span>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <FieldGroup label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </FieldGroup>

            <FieldGroup
              label="Password"
              htmlFor="password"
              hint={`Prototype only — not checked. Try "${DEMO_PASSWORD}" or leave as-is.`}
            >
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={DEMO_PASSWORD}
                autoComplete="current-password"
              />
            </FieldGroup>

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-gold-deep hover:text-ink"
              >
                Forgot password?
              </Link>
            </div>

            {error ? (
              <p className="text-xs text-terracotta-deep">{error}</p>
            ) : null}

            <Button type="submit" variant="primary" size="lg" className="w-full">
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/agent")}
              aria-label="Skip to agent dashboard"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Skip to Agent dashboard</span>
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-ink-muted">
            New to Real Estate HQ?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-ink hover:text-gold-deep"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-ink-subtle py-6">
        © {new Date().getFullYear()} Real Estate HQ ·{" "}
        <span className="text-ink-muted">Prototype · password: {DEMO_PASSWORD}</span>
      </footer>
    </main>
  );
}
