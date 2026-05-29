"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedSiteVisits,
  seedUsers,
} from "@/lib/data";
import type { SiteVisitStatus } from "@/lib/types";
import { useCurrentRole } from "@/lib/useCurrentRole";
import { statusVariantForSiteVisit } from "@/lib/logic/siteVisitDerivations";

/**
 * Site Visit Booking — list view (#24).
 *
 * Mobile-first list with status filter chips. Calendar/week view is a
 * secondary toggle (mockup is silent on its layout; defer to Session 9
 * polish if calendar layout proves needed).
 *
 * Two sections:
 *   - Upcoming: scheduledAt >= now, status in {Proposed, Confirmed,
 *     Reminder Sent, Rescheduled}
 *   - Past: scheduledAt < now OR status in {Completed, No-show, Converted}
 *
 * Role-aware:
 *   - Agent: their own visits
 *   - Broker: visits where the visit's agent is on their team
 *   - Realtor: visits in their network
 */

const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

const ALL_STATUSES: Array<SiteVisitStatus | "All"> = [
  "All",
  "Proposed",
  "Confirmed",
  "Reminder Sent",
  "Completed",
  "No-show",
  "Converted",
];

export default function SiteVisitsPage() {
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  // Role-aware filter (Agent sees own; for Broker/Realtor we'd resolve via
  // user-relations — for the prototype we use the same agent-001 path)
  const visitsForUser = React.useMemo(
    () => seedSiteVisits.filter((v) => v.agentId === DEMO_AGENT_ID),
    [],
  );

  const [statusFilter, setStatusFilter] = React.useState<
    SiteVisitStatus | "All"
  >("All");

  const filtered = visitsForUser.filter(
    (v) => statusFilter === "All" || v.status === statusFilter,
  );

  // Split: upcoming vs past
  const now = SEED_REFERENCE_ISO;
  const upcomingStatuses = new Set<SiteVisitStatus>([
    "Proposed",
    "Confirmed",
    "Reminder Sent",
    "Rescheduled",
  ]);
  const upcoming = filtered
    .filter(
      (v) => v.scheduledAt >= now && upcomingStatuses.has(v.status),
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = filtered
    .filter(
      (v) => !(v.scheduledAt >= now && upcomingStatuses.has(v.status)),
    )
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1
              data-testid="site-visits-title"
              className="font-display text-2xl font-semibold text-ink"
            >
              Site Visits
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Upcoming property viewings and past visits.
            </p>
          </div>
          <Link href={`/${roleSlug}/site-visits/new`}>
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              Book
            </Button>
          </Link>
        </div>

        {/* Status filter chips */}
        <div
          data-testid="status-filter-chips"
          className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none"
        >
          {ALL_STATUSES.map((s) => {
            const active = s === statusFilter;
            const count =
              s === "All"
                ? visitsForUser.length
                : visitsForUser.filter((v) => v.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                data-testid={`status-chip-${s.replace(/\s+/g, "-").toLowerCase()}`}
                data-active={active}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-xs font-medium border transition-colors",
                  active
                    ? "bg-sage-deep text-canvas-raised border-transparent"
                    : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                )}
              >
                {s}
                <span
                  className={cn(
                    "text-[10px]",
                    active ? "text-canvas-raised/70" : "text-ink-subtle",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <span className="text-xs text-ink-subtle">
              {upcoming.length} visits
            </span>
          </CardHeader>
          {upcoming.length === 0 ? (
            <p
              data-testid="upcoming-empty"
              className="text-sm text-ink-muted py-4 text-center"
            >
              No upcoming visits.
            </p>
          ) : (
            <ul data-testid="upcoming-list" className="divide-y divide-line-soft">
              {upcoming.map((v) => (
                <SiteVisitRow key={v.id} v={v} roleSlug={roleSlug} />
              ))}
            </ul>
          )}
        </Card>

        {/* Past */}
        <Card>
          <CardHeader>
            <CardTitle>Past</CardTitle>
            <span className="text-xs text-ink-subtle">
              {past.length} visits
            </span>
          </CardHeader>
          {past.length === 0 ? (
            <p className="text-sm text-ink-muted py-4 text-center">
              No past visits.
            </p>
          ) : (
            <ul
              data-testid="past-list"
              className="divide-y divide-line-soft"
            >
              {past.map((v) => (
                <SiteVisitRow key={v.id} v={v} roleSlug={roleSlug} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function SiteVisitRow({
  v,
  roleSlug,
}: {
  v: typeof seedSiteVisits[number];
  roleSlug: string;
}) {
  return (
    <li>
      <Link
        href={`/${roleSlug}/site-visits/${v.id}`}
        data-testid={`site-visit-row-${v.id}`}
        className="flex items-center gap-3 py-3 hover:bg-canvas-sunken/40 rounded-lg px-1"
      >
        <div className="h-10 w-10 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-ink truncate">
              {v.buyerName}
            </span>
            <StatusBadge variant={statusVariantForSiteVisit(v.status)}>
              {v.status}
            </StatusBadge>
          </div>
          <p className="text-xs text-ink-muted truncate">
            {v.listingTitle}
          </p>
          <p className="text-[11px] text-ink-subtle inline-flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {formatDateTime(v.scheduledAt)}
            {v.locationNote ? (
              <>
                <span className="mx-1">·</span>
                <MapPin className="h-3 w-3" />
                <span className="truncate">{v.locationNote}</span>
              </>
            ) : null}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0" />
      </Link>
    </li>
  );
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-PH", {
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
