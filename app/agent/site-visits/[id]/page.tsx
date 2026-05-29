"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  User,
  Building2,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DEMO_AGENT_ID,
  seedSiteVisits,
  seedListings,
  seedLeads,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import { statusVariantForSiteVisit } from "@/lib/logic/siteVisitDerivations";
import { formatPHPWhole } from "@/lib/format";

/**
 * Site Visit Detail (#24).
 *
 * Shows: status, scheduled time, location, buyer + listing references,
 * agent's notes, reminders affordance (visual only). Conversion-to-deal
 * action when status is Completed.
 */
export default function SiteVisitDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();

  const visit = seedSiteVisits.find((v) => v.id === params.id);
  if (!visit) notFound();

  const listing = seedListings.find((l) => l.id === visit.listingId);
  const lead = seedLeads.find((l) => l.id === visit.leadId);
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  const canConvert = visit.status === "Completed";

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={`/${roleSlug}/site-visits`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site Visits
        </Link>

        {/* Header */}
        <Card surface="raised">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1
                data-testid="site-visit-title"
                className="font-display text-lg font-semibold text-ink truncate"
              >
                {visit.buyerName}
              </h1>
              <p className="text-xs text-ink-muted mt-0.5 truncate">
                {visit.listingTitle}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge variant={statusVariantForSiteVisit(visit.status)}>
                  {visit.status}
                </StatusBadge>
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <div className="space-y-2.5">
            <div
              data-testid="site-visit-when"
              className="flex items-center gap-2.5"
            >
              <Clock className="h-4 w-4 text-ink-subtle" />
              <div>
                <p className="text-sm text-ink">{formatFull(visit.scheduledAt)}</p>
                <p className="text-[11px] text-ink-subtle">Asia/Manila</p>
              </div>
            </div>
            {visit.locationNote ? (
              <div
                data-testid="site-visit-where"
                className="flex items-center gap-2.5"
              >
                <MapPin className="h-4 w-4 text-ink-subtle" />
                <p className="text-sm text-ink">{visit.locationNote}</p>
              </div>
            ) : null}
            {visit.notes ? (
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-ink-subtle mt-0.5" />
                <p className="text-sm text-ink-muted leading-relaxed">
                  {visit.notes}
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Linked entities */}
        <Card>
          <CardHeader>
            <CardTitle>Linked</CardTitle>
          </CardHeader>
          <ul
            data-testid="site-visit-linked"
            className="divide-y divide-line-soft"
          >
            {lead ? (
              <li>
                <Link
                  href={`/${roleSlug}/leads/${lead.id}`}
                  className="flex items-center gap-2.5 py-2.5 hover:bg-canvas-sunken/40 rounded-lg px-1"
                >
                  <User className="h-4 w-4 text-ink-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {lead.buyer.name}
                    </p>
                    <p className="text-[11px] text-ink-subtle">Open conversation</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            ) : null}
            {listing ? (
              <li>
                <Link
                  href={`/${roleSlug}/listings/${listing.id}/share?lead=${lead?.id ?? ""}`}
                  className="flex items-center gap-2.5 py-2.5 hover:bg-canvas-sunken/40 rounded-lg px-1"
                >
                  <Building2 className="h-4 w-4 text-ink-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {listing.title}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {formatPHPWhole(listing.price)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            ) : null}
          </ul>
        </Card>

        {/* Conversion-to-deal action — only when visit is Completed */}
        {canConvert ? (
          <Card data-testid="site-visit-convert-card">
            <CardHeader>
              <CardTitle>Convert to Deal</CardTitle>
            </CardHeader>
            <p className="text-sm text-ink-muted">
              This visit is completed. Convert it to an active deal at the{" "}
              <span className="font-medium text-ink">Site Visit Done</span> stage.
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-3 w-full"
              data-testid="convert-to-deal-button"
              onClick={() => {
                // Prototype: routes to deals list with a flag.
                // Real conversion via dealStageDerivations.convertSiteVisitToDeal
                // hydrates a backend write later.
                router.push(
                  `/${roleSlug}/deals?convertedFrom=${visit.id}`,
                );
              }}
            >
              <Sparkles className="h-4 w-4" />
              Create Deal at Site Visit Done
            </Button>
          </Card>
        ) : null}

        {/* Reminders (visual only) */}
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
          </CardHeader>
          <p className="text-xs text-ink-muted">
            A reminder will be sent to the buyer 24 hours before the visit and
            again 2 hours before. Reminders are sent via the buyer's preferred
            channel.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function formatFull(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-PH", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
  } catch {
    return iso;
  }
}
