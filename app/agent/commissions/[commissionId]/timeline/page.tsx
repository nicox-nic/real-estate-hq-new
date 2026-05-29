"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Building2,
  User,
  Banknote,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  seedCommissions,
  seedDeals,
  seedPayoutAccounts,
  seedUsers,
} from "@/lib/data";
import {
  COMMISSION_TIMELINE_STAGES,
  type CommissionTimelineStage,
  type CommissionStatus,
} from "@/lib/types";
import { formatPHPWhole, formatPHP2dp } from "@/lib/format";

/**
 * Commission Timeline (#27) — per-deal timeline detail.
 *
 * Layout: vertical stage stack with completion indicators, similar shape
 * to 5C's pipeline progress strip but specialized for the 6 commission
 * stages. Note: NOT yet extracted to a shared component — Rule of Three
 * holds. 5C's deal-pipeline progress strip is horizontal (9-cell row);
 * this is vertical (6-row stack with detail per row). If a third timeline
 * surface emerges (e.g., a project timeline), extract then.
 */
export default function CommissionTimelinePage() {
  const params = useParams<{ commissionId: string }>();
  const commission = seedCommissions.find((c) => c.id === params.commissionId);
  if (!commission) notFound();

  const deal = seedDeals.find((d) => d.id === commission.dealId);
  const agent = seedUsers.find((u) => u.id === commission.agentId);
  const broker = commission.brokerId
    ? seedUsers.find((u) => u.id === commission.brokerId)
    : undefined;
  const realtor = commission.realtorId
    ? seedUsers.find((u) => u.id === commission.realtorId)
    : undefined;
  const payoutAccount = commission.payoutAccountId
    ? seedPayoutAccounts.find((pa) => pa.id === commission.payoutAccountId)
    : undefined;

  // Map of stage → completedAt for quick lookup
  const stageByName = new Map<
    CommissionTimelineStage,
    { completedAt?: string; expectedAt?: string }
  >();
  for (const ev of commission.timeline) {
    stageByName.set(ev.stage, {
      completedAt: ev.completedAt,
      expectedAt: ev.expectedAt,
    });
  }

  // Determine the current stage = the first incomplete one
  let currentStageIdx = COMMISSION_TIMELINE_STAGES.length - 1;
  for (let i = 0; i < COMMISSION_TIMELINE_STAGES.length; i++) {
    const ev = stageByName.get(COMMISSION_TIMELINE_STAGES[i]!);
    if (!ev?.completedAt) {
      currentStageIdx = i;
      break;
    }
  }

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
              data-testid="commission-timeline-title"
              className="font-display text-xl sm:text-2xl font-semibold text-ink"
            >
              Commission Timeline
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Track every stage from reservation to payout.
            </p>
          </div>
        </div>

        {/* Summary card */}
        <Card surface="raised" className="!p-5">
          <header className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-ink-subtle font-medium">
                {deal?.listingTitle ?? "—"}
              </p>
              <p className="text-sm text-ink-muted mt-0.5">
                Buyer: {deal?.buyerName ?? "—"}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 flex-wrap">
                <StatusBadge variant={statusBadgeVariant(commission.status)}>
                  {commission.status}
                </StatusBadge>
                <span
                  data-testid="commission-amount"
                  className="font-display text-2xl font-semibold text-ink tabular-nums"
                >
                  {formatPHP2dp(commission.agentAmount)}
                </span>
                <span className="text-xs text-ink-subtle">your share</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] uppercase tracking-wider text-ink-subtle font-medium">
                Total Deal Value
              </p>
              <p className="font-display text-base font-semibold text-ink tabular-nums">
                {formatPHPWhole(deal?.contractPrice ?? 0)}
              </p>
              {commission.expectedPayoutDate ? (
                <p className="text-[11px] text-ink-subtle mt-1.5">
                  Expected payout
                </p>
              ) : null}
              {commission.expectedPayoutDate ? (
                <p className="text-xs text-ink-muted">
                  {formatLongDate(commission.expectedPayoutDate)}
                </p>
              ) : null}
            </div>
          </header>
        </Card>

        {/* The 6-stage timeline */}
        <Card data-testid="commission-timeline-card" className="!p-5">
          <CardHeader>
            <CardTitle>6-Stage Timeline</CardTitle>
            <span className="text-[10px] uppercase tracking-wider text-ink-subtle">
              {commission.timeline.filter((t) => t.completedAt).length} of{" "}
              {COMMISSION_TIMELINE_STAGES.length} complete
            </span>
          </CardHeader>
          <ol
            data-testid="commission-timeline-stages"
            data-current-stage-idx={currentStageIdx}
            className="relative"
          >
            {COMMISSION_TIMELINE_STAGES.map((stage, i) => {
              const ev = stageByName.get(stage);
              const isComplete = !!ev?.completedAt;
              const isCurrent = i === currentStageIdx;
              const isLast = i === COMMISSION_TIMELINE_STAGES.length - 1;
              return (
                <li
                  key={stage}
                  data-testid={`timeline-stage-${slugify(stage)}`}
                  data-state={
                    isComplete ? "completed" : isCurrent ? "current" : "pending"
                  }
                  className="relative pl-10 pb-5 last:pb-0"
                >
                  {/* Connector line */}
                  {!isLast ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-3.5 top-7 bottom-0 w-px",
                        isComplete ? "bg-sage-deep/30" : "bg-line",
                      )}
                    />
                  ) : null}
                  {/* Dot */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1.5 h-7 w-7 rounded-full flex items-center justify-center",
                      isComplete
                        ? "bg-sage-soft text-sage-deep"
                        : isCurrent
                        ? "bg-gold-soft text-gold-deep ring-4 ring-gold-soft/40"
                        : "bg-canvas-sunken text-ink-subtle border border-line",
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <span className="text-[10px] font-semibold">{i + 1}</span>
                    )}
                  </span>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isComplete
                            ? "text-ink"
                            : isCurrent
                            ? "text-ink"
                            : "text-ink-muted",
                        )}
                      >
                        {stage}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-0.5",
                          isComplete ? "text-ink-muted" : "text-ink-subtle",
                        )}
                      >
                        {isComplete
                          ? `Completed ${formatLongDate(ev!.completedAt!)}`
                          : isCurrent && ev?.expectedAt
                          ? `Expected ${formatLongDate(ev.expectedAt)}`
                          : isCurrent
                          ? "In progress"
                          : "Pending"}
                      </p>
                    </div>
                    {/* Delay alert if expected date passed and not complete */}
                    {!isComplete &&
                    ev?.expectedAt &&
                    ev.expectedAt < SEED_REFERENCE_DATE ? (
                      <span
                        data-testid={`timeline-delay-${slugify(stage)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-terracotta-deep"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Delayed
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Split breakdown */}
        <Card data-testid="commission-split-card" className="!p-5">
          <CardHeader>
            <CardTitle>Commission Split</CardTitle>
            <span className="text-xs text-ink-subtle tabular-nums">
              Total: {formatPHP2dp(commission.totalAmount)}
            </span>
          </CardHeader>
          <ul className="space-y-2.5">
            <SplitRow
              label="Agent share"
              amount={commission.agentAmount}
              total={commission.totalAmount}
              accent="sage"
              personName={agent?.fullName}
            />
            {commission.brokerAmount > 0 ? (
              <SplitRow
                label="Broker share"
                amount={commission.brokerAmount}
                total={commission.totalAmount}
                accent="gold"
                personName={broker?.fullName}
              />
            ) : null}
            {commission.realtyAmount > 0 ? (
              <SplitRow
                label="Realty share"
                amount={commission.realtyAmount}
                total={commission.totalAmount}
                accent="navy"
                personName={realtor?.fullName}
              />
            ) : null}
          </ul>
        </Card>

        {/* Linked references */}
        <Card>
          <CardHeader>
            <CardTitle>Linked</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-line-soft">
            {deal ? (
              <li>
                <Link
                  href={`/agent/deals/${deal.id}`}
                  className="flex items-center gap-2.5 py-2.5 hover:bg-canvas-sunken/40 rounded-lg px-1"
                >
                  <FileText className="h-4 w-4 text-ink-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      Open originating deal
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      Stage: {deal.stage}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            ) : null}
            {payoutAccount ? (
              <li className="flex items-center gap-2.5 py-2.5 px-1">
                <Banknote className="h-4 w-4 text-ink-subtle" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">
                    {payoutAccount.bankName} {payoutAccount.accountNumberMasked}
                  </p>
                  <p className="text-[11px] text-ink-subtle">Payout account</p>
                </div>
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    </main>
  );
}

function SplitRow({
  label,
  amount,
  total,
  accent,
  personName,
}: {
  label: string;
  amount: number;
  total: number;
  accent: "sage" | "gold" | "navy";
  personName?: string;
}) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
  const accentClasses = {
    sage: "bg-sage-deep",
    gold: "bg-gold-deep",
    navy: "bg-navy",
  };
  return (
    <li
      data-testid={`split-${label.replace(/\s+/g, "-").toLowerCase()}`}
      data-amount={amount}
      data-pct={pct}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="min-w-0">
          <span className="text-ink font-medium">{label}</span>
          {personName ? (
            <span className="text-ink-subtle text-xs ml-1.5">{personName}</span>
          ) : null}
        </div>
        <span className="text-ink tabular-nums">
          {formatPHP2dp(amount)}{" "}
          <span className="text-ink-subtle">({pct}%)</span>
        </span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-canvas-sunken overflow-hidden">
        <div
          className={cn("h-full rounded-full", accentClasses[accent])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

const SEED_REFERENCE_DATE = "2025-05-29";

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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
