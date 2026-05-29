"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Mail,
} from "lucide-react";
import { Stepper } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { pendingReason } from "@/lib/logic/accountAccess";
import type { AccountStatus } from "@/lib/types";

const ONBOARDING_STEPS = ["Role", "Basics", "Documents", "Review"];

const ICON_BY_STATUS: Record<
  AccountStatus,
  { Icon: React.ComponentType<{ className?: string }>; tint: string; ring: string }
> = {
  "Pending Verification": {
    Icon: Clock,
    tint: "bg-gold-soft text-gold-deep",
    ring: "ring-gold/20",
  },
  Verified: {
    Icon: CheckCircle2,
    tint: "bg-sage-soft text-sage-deep",
    ring: "ring-sage/20",
  },
  "Needs More Documents": {
    Icon: AlertTriangle,
    tint: "bg-gold-soft text-gold-deep",
    ring: "ring-gold/20",
  },
  Rejected: {
    Icon: XCircle,
    tint: "bg-terracotta-soft text-terracotta-deep",
    ring: "ring-terracotta/20",
  },
};

const TITLE_BY_STATUS: Record<AccountStatus, string> = {
  "Pending Verification": "Application received",
  Verified: "You're all set!",
  "Needs More Documents": "We need a few more documents",
  Rejected: "Application not approved",
};

export default function PendingVerificationPage() {
  return (
    <React.Suspense fallback={null}>
      <PendingContent />
    </React.Suspense>
  );
}

function PendingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const rawStatus = params.get("status") ?? "Pending Verification";
  const status = (
    ["Pending Verification", "Verified", "Rejected", "Needs More Documents"].includes(
      rawStatus,
    )
      ? rawStatus
      : "Pending Verification"
  ) as AccountStatus;

  const { Icon, tint, ring } = ICON_BY_STATUS[status];
  const title = TITLE_BY_STATUS[status];

  // Missing documents to re-upload (for "Needs More Documents" state)
  const missingDocs = [
    "Updated PRC license (current copy expired)",
    "Front-and-back photo of valid government ID",
  ];

  return (
    <div>
      <Stepper steps={ONBOARDING_STEPS} current={4} className="mb-8" />

      <div className="flex justify-center mb-6">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center ring-8 ${tint} ${ring}`}
        >
          <Icon className="h-8 w-8" />
        </div>
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-ink text-balance">
          {title}
        </h1>
        <div className="mt-3 flex justify-center">
          <StatusBadge variant={badgeVariantFor(status)}>{status}</StatusBadge>
        </div>
        <p className="mt-4 max-w-md mx-auto text-sm text-ink-muted">
          {pendingReason(status)}
        </p>
      </div>

      {/* State-specific bodies */}
      {status === "Pending Verification" ? (
        <div className="mt-8 rounded-2xl border border-line bg-canvas-raised p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">
            What happens next
          </h2>
          <ol className="space-y-3 text-sm text-ink-muted">
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-canvas-sunken text-ink-muted text-xs flex items-center justify-center font-medium shrink-0">
                1
              </span>
              <span>
                Our verification team reviews your documents and accreditation.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-canvas-sunken text-ink-muted text-xs flex items-center justify-center font-medium shrink-0">
                2
              </span>
              <span>
                You'll get an email when your account is verified — typically
                within 1–2 business days.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-canvas-sunken text-ink-muted text-xs flex items-center justify-center font-medium shrink-0">
                3
              </span>
              <span>
                Once verified, you'll have full access to leads, listings,
                commissions, and your team.
              </span>
            </li>
          </ol>
        </div>
      ) : null}

      {status === "Needs More Documents" ? (
        <div className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft/30 p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">
            Items to re-upload
          </h2>
          <ul className="space-y-2 text-sm text-ink-muted">
            {missingDocs.map((d) => (
              <li key={d} className="flex items-start gap-2">
                <span className="text-gold-deep mt-0.5">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button
              type="button"
              variant="gold"
              size="md"
              onClick={() => router.push("/auth/upload-documents?role=Agent")}
            >
              Re-upload documents
            </Button>
          </div>
        </div>
      ) : null}

      {status === "Rejected" ? (
        <div className="mt-8 rounded-2xl border border-terracotta/30 bg-terracotta-soft/30 p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">What you can do</h2>
          <p className="text-sm text-ink-muted">
            If you believe this is a mistake, please reach out to our support
            team with your accreditation details.
          </p>
          <div className="mt-4">
            <a
              href="mailto:support@realestate-hq.ph"
              className="inline-flex items-center gap-2 text-sm font-medium text-terracotta-deep hover:text-ink"
            >
              <Mail className="h-4 w-4" />
              support@realestate-hq.ph
            </a>
          </div>
        </div>
      ) : null}

      {status === "Verified" ? (
        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="gold"
            size="lg"
            onClick={() => router.push("/agent")}
          >
            Go to dashboard
          </Button>
        </div>
      ) : null}

      {/* Universal footer */}
      <div className="mt-10 text-center text-xs text-ink-subtle">
        <Link href="/" className="hover:text-ink">
          Back to sign in
        </Link>
        <span className="mx-2">·</span>
        <a
          href="mailto:support@realestate-hq.ph"
          className="hover:text-ink"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

function badgeVariantFor(
  status: AccountStatus,
): "verified" | "pending" | "rejected" | "neutral" {
  switch (status) {
    case "Verified":
      return "verified";
    case "Pending Verification":
    case "Needs More Documents":
      return "pending";
    case "Rejected":
      return "rejected";
  }
}
