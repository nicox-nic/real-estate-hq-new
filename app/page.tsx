"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, FieldGroup } from "@/components/ui/Form";
import { seedUsers } from "@/lib/data";
import { landingDestination } from "@/lib/logic/accountAccess";

/**
 * Splash / Login (#1).
 *
 * Sign-in form with email + password (mocked — no real auth), Face ID
 * affordance (visual-only stub), Forgot Password link, footer Create Account.
 *
 * Demo behavior: typing an email that matches a seed user routes to that
 * user's role dashboard (if Verified) or the pending verification screen
 * (otherwise). Password is not validated. If the email doesn't match a
 * known seed user, the form falls through to the Agent splash by default
 * so the prototype is always walkable.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Enter the email you used to register.");
      return;
    }
    const match = seedUsers.find((u) => u.email.toLowerCase() === trimmed);
    if (!match) {
      // Demo fallback — route to the demo agent so the prototype is walkable.
      router.push("/agent");
      return;
    }
    const dest = landingDestination(match.role, match.status);
    if (dest.kind === "dashboard") {
      router.push(dest.path);
    } else {
      router.push(`/auth/pending?status=${encodeURIComponent(match.status)}`);
    }
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

          {/* Headline */}
          <h1 className="font-display text-2xl font-semibold text-ink mb-1 text-center text-balance">
            Close more deals. Earn more.
          </h1>
          <p className="text-sm text-ink-muted mb-8 text-center">
            Sign in to your sales command center.
          </p>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <FieldGroup label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </FieldGroup>

            <FieldGroup label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
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
              Sign in
            </Button>

            {/* Face ID stub — visual only, no real biometric */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => router.push("/agent")}
              aria-label="Sign in with Face ID"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Sign in with Face ID</span>
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-ink-muted">
            New to Real Estate HQ?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-ink hover:text-gold-deep"
            >
              Create account
            </Link>
          </div>

          {/* Demo hint */}
          <div className="mt-10 rounded-2xl border border-line bg-canvas-raised p-4 text-xs text-ink-muted">
            <div className="font-medium text-ink mb-1">Prototype shortcuts</div>
            <div className="space-y-0.5">
              <div>
                <span className="text-ink">alyssa.garcia@realestate-hq.ph</span>{" "}
                — Agent (verified)
              </div>
              <div>
                <span className="text-ink">maria.santos@realestate-hq.ph</span>{" "}
                — Broker (verified)
              </div>
              <div>
                <span className="text-ink">alex.reyes@realestate-hq.ph</span>{" "}
                — Realtor (verified)
              </div>
              <div>
                <span className="text-ink">miguel.reyes@realestate-hq.ph</span>{" "}
                — Pending verification
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-ink-subtle py-6">
        © {new Date().getFullYear()} Real Estate HQ ·{" "}
        <span className="text-ink-muted">Prototype</span>
      </footer>
    </main>
  );
}
