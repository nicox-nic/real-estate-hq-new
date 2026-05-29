"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Form";

/**
 * Forgot Password (stub).
 *
 * Two states:
 *   - Form: enter email, submit
 *   - Confirmation: "Reset link sent"
 *
 * No real email is sent (prototype).
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-sage-soft text-sage-deep flex items-center justify-center ring-8 ring-sage/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink text-balance">
          Reset link sent
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          If <span className="text-ink font-medium">{email}</span> matches an
          account, we've sent a password reset link. Check your inbox and
          follow the instructions to set a new password.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
          >
            Use a different email
          </Button>
          <Link href="/">
            <Button type="button" variant="primary" size="md">
              Back to sign in
            </Button>
          </Link>
        </div>
        <div className="mt-8 text-xs text-ink-subtle">
          Didn't receive an email? Check your spam folder or{" "}
          <a
            href="mailto:support@realestate-hq.ph"
            className="text-ink hover:text-gold-deep"
          >
            contact support
          </a>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gold-soft text-gold-deep flex items-center justify-center">
          <Mail className="h-6 w-6" />
        </div>
      </div>
      <h1 className="font-display text-3xl font-semibold text-ink text-center text-balance">
        Forgot your password?
      </h1>
      <p className="mt-3 text-sm text-ink-muted text-center">
        Enter the email associated with your account and we'll send a link to
        reset your password.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

        <Button type="submit" variant="primary" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-ink-muted">
        Remember your password?{" "}
        <Link href="/" className="font-medium text-ink hover:text-gold-deep">
          Sign in
        </Link>
      </div>
    </div>
  );
}
