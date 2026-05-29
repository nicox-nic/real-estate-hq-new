"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedCommissions,
  seedDeals,
  seedUsers,
} from "@/lib/data";
import { computeKPIs } from "@/lib/logic/commissionAggregation";
import { viewerFromUser } from "@/lib/logic/roleAwareAmount";
import { formatPHP2dp, formatPHPWhole } from "@/lib/format";
import {
  COMMISSION_TIMELINE_STAGES,
  type CommissionStatus,
} from "@/lib/types";

/**
 * Money on the Way (#28) — the motivational in-flight commission view.
 *
 * "In-flight" = status ∈ {For Approval, For Closing, For Payout}. These
 * are the commissions actively moving toward payout.
 *
 * Hero: total in-flight (composes with Agent Dashboard's MotW feature card
 * from Session 3A — same data, two surfaces, agreement locked in verify).
 *
 * Per-commission card: listing + buyer + deal value + expected commission +
 * mini timeline progress strip (6 stages) + expected payout date.
 */

const DEFAULT_MONTHLY_TARGET = 600_000;

export default function MoneyOnTheWayPage() {
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  const viewer = React.useMemo(
    () => (user ? viewerFromUser(user) : { role: "Agent" as const, userId: DEMO_AGENT_ID }),
    [user],
  );

  const kpis = computeKPIs(seedCommissions, viewer);

  const dealsById = React.useMemo(
    () => new Map(seedDeals.map((d) => [d.id, d])),
    [],
  );

  // In-flight commissions = pending payout statuses
  const inFlight = React.useMemo(() => {
    return seedCommissions
      .filter((c) => c.agentId === DEMO_AGENT_ID)
      .filter(
        (c) =>
          c.status === "For Approval" ||
          c.status === "For Closing" ||
          c.status === "For Payout",
      )
      .sort((a, b) =>
        (a.expectedPayoutDate ?? "9999").localeCompare(
          b.expectedPayoutDate ?? "9999",
        ),
      );
  }, []);

  const inFlightTotal = inFlight.reduce((s, c) => s + c.agentAmount, 0);

  // Monthly target progress (same data shape as MotW feature card on dashboard)
  const monthlyTarget = DEFAULT_MONTHLY_TARGET;
  const towardTarget = kpis.paidToDate + inFlightTotal;
  const targetPct =
    monthlyTarget > 0
      ? Math.min(100, Math.round((towardTarget / monthlyTarget) * 100))
      : 0;

  return (
    <main className="min-h-screen bg-canvas pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/agent/commissions"
            aria-label="Back"
            className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-canvas-raised border border-line hover:border-gold/40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-ink-muted" />
          </Link>
          <div>
            <h1
              data-testid="money-on-the-way-title"
              className="font-display text-xl sm:text-2xl font-semibold text-ink"
            >
              Money on the Way
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Commissions moving toward your payout.
            </p>
          </div>
        </div>

        {/* Hero — total in-flight + monthly target progress */}
        <Card surface="raised" className="!p-6 bg-sage-soft/30 border-sage-deep/15">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">
            Total in-flight
          </p>
          <p
            data-testid="motw-in-flight-total"
            data-amount={inFlightTotal}
            className="font-display text-3xl sm:text-4xl font-semibold text-sage-deep tabular-nums mt-1"
          >
            {formatPHP2dp(inFlightTotal)}
          </p>
          <p className="text-xs text-ink-muted mt-1.5 inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-sage-deep" />
            Across {inFlight.length} {inFlight.length === 1 ? "commission" : "commissions"} actively moving toward payout.
          </p>

          {/* Monthly target progress */}
          <div
            data-testid="motw-target-progress"
            data-target-pct={targetPct}
            className="mt-5 pt-4 border-t border-sage-deep/15"
          >
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xs font-medium text-ink">
                Monthly Target
              </p>
              <p className="text-xs text-ink-muted tabular-nums">
                <span className="font-medium text-ink">
                  {formatPHPWhole(towardTarget)}
                </span>{" "}
                of {formatPHPWhole(monthlyTarget)} · {targetPct}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-canvas-raised overflow-hidden">
              <div
                className="h-full bg-sage-deep rounded-full transition-all"
                style={{ width: `${targetPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* In-flight commissions list */}
        <Card data-testid="motw-list-card" className="!p-5">
          <CardHeader>
            <CardTitle>In-flight commissions</CardTitle>
            <span className="text-xs text-ink-subtle">
              {inFlight.length} active
            </span>
          </CardHeader>
          {inFlight.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6 italic">
              No in-flight commissions. Close a deal to see one here.
            </p>
          ) : (
            <ul data-testid="motw-list" className="space-y-3">
              {inFlight.map((c) => (
                <InFlightRow
                  key={c.id}
                  commission={c}
                  deal={dealsById.get(c.dealId)}
                />
              ))}
            </ul>
          )}
          <button
            data-testid="motw-request-payout-cta"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sage-deep hover:bg-sage-deep/90 text-canvas-raised h-12 text-sm font-medium transition-colors"
          >
            <Send className="h-4 w-4" />
            Request Payout
          </button>
        </Card>

        {/* Insights footer */}
        <p className="text-xs text-ink-subtle text-center inline-flex items-center justify-center gap-1.5 w-full">
          <TrendingUp className="h-3 w-3 text-sage-deep" />
          {kpis.visibleCount} commissions tracked · ₱{kpis.paidToDate.toLocaleString("en-PH")} already paid this period
        </p>
      </div>
    </main>
  );
}

function InFlightRow({
  commission,
  deal,
}: {
  commission: (typeof seedCommissions)[number];
  deal: (typeof seedDeals)[number] | undefined;
}) {
  // Determine the commission's progress along the 6-stage timeline.
  // The current stage is the FIRST one without completedAt.
  let currentIdx = COMMISSION_TIMELINE_STAGES.length - 1;
  for (let i = 0; i < COMMISSION_TIMELINE_STAGES.length; i++) {
    const ev = commission.timeline.find(
      (t) => t.stage === COMMISSION_TIMELINE_STAGES[i],
    );
    if (!ev?.completedAt) {
      currentIdx = i;
      break;
    }
  }

  return (
    <li
      data-testid={`motw-row-${commission.id}`}
      data-status={commission.status}
    >
      <Link
        href={`/agent/commissions/${commission.id}/timeline`}
        className="block rounded-xl border border-line bg-canvas-raised p-3 hover:border-gold/40 transition-colors"
      >
        <header className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">
              {deal?.listingTitle ?? "—"}
            </p>
            <p className="text-xs text-ink-muted truncate">
              Buyer: {deal?.buyerName ?? "—"} ·{" "}
              {formatPHPWhole(deal?.contractPrice ?? 0)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              data-testid={`motw-row-${commission.id}-amount`}
              className="font-display text-base font-semibold text-ink tabular-nums"
            >
              {formatPHP2dp(commission.agentAmount)}
            </p>
            <StatusBadge variant={statusBadgeVariant(commission.status)}>
              {commission.status}
            </StatusBadge>
          </div>
        </header>

        {/* Mini 6-stage timeline progress */}
        <div
          data-testid={`motw-row-${commission.id}-timeline`}
          data-current-idx={currentIdx}
          className="flex items-center gap-0.5"
        >
          {COMMISSION_TIMELINE_STAGES.map((stage, i) => {
            const ev = commission.timeline.find((t) => t.stage === stage);
            const isComplete = !!ev?.completedAt;
            const isCurrent = i === currentIdx && !isComplete;
            return (
              <span
                key={stage}
                title={stage}
                aria-label={`${stage}: ${isComplete ? "complete" : isCurrent ? "in progress" : "pending"}`}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  isComplete
                    ? "bg-sage-deep"
                    : isCurrent
                    ? "bg-gold-deep"
                    : "bg-canvas-sunken",
                )}
              />
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-subtle">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {commission.expectedPayoutDate
              ? `Expected ${formatLongDate(commission.expectedPayoutDate)}`
              : "Payout date TBD"}
          </span>
          <span className="inline-flex items-center gap-0.5 text-sage-deep">
            Open timeline
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </li>
  );
}

function statusBadgeVariant(status: CommissionStatus) {
  switch (status) {
    case "Paid":
      return "paid" as const;
    case "For Closing":
      return "for-closing" as const;
    case "For Payout":
      return "for-payout" as const;
    case "On Hold":
      return "on-hold" as const;
    case "For Approval":
      return "for-approval" as const;
  }
}

function formatLongDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
