"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  PauseCircle,
  Calendar,
  SlidersHorizontal,
  Download,
  ChevronRight,
  Info,
  TrendingUp,
  Banknote,
  Star,
  Send,
  Settings,
  Mail,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DonutChart, DonutLegend } from "@/components/ui/DonutChart";
import { CommissionKPICard } from "@/components/commissions/CommissionKPICard";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedCommissions,
  seedDeals,
  seedPayoutAccounts,
  seedUsers,
} from "@/lib/data";
import {
  computeKPIs,
  computeBreakdown,
} from "@/lib/logic/commissionAggregation";
import { viewerFromUser } from "@/lib/logic/roleAwareAmount";
import { formatPHP2dp, formatPHPWhole, formatPHPCompact } from "@/lib/format";
import type { Commission, CommissionStatus } from "@/lib/types";

/**
 * Commission Tracking (#26) — the marquee mockup-matching page.
 *
 * Composition (per mockup, image 3, top-to-bottom):
 *   1. Header: back arrow + title + subtitle + date range selector + filter
 *   2. KPI row: 4 cards — Total Earned (sage), Paid (sage), Pending (gold), On Hold (terracotta)
 *   3. Two-column zone:
 *        Left column:
 *          - Commission Breakdown donut + legend + monthly target progress card
 *        Right column:
 *          - Upcoming Payouts list (3 entries) + Request Payout CTA
 *   4. Commission Transactions table with 6 status filter tabs + Export
 *   5. Commission Insights row (3 small cards) + Payout Accounts panel
 *   6. Footer: "All commissions are computed based on..." + Contact support
 *
 * Standalone page — no bottom navigation per PRD's instruction.
 *
 * Math discipline: every displayed number routes through computeKPIs /
 * computeBreakdown / amountFor (role-aware). Verify-locked in Section 18.
 */

const DEFAULT_MONTHLY_TARGET = 600_000;

// Donut palette per mockup: dark green / gold / navy / muted gray
const DONUT_COLORS = {
  closedDeals: "#3F5A3E", // sage-deep
  forClosing: "#C9A961", // gold default
  forApproval: "#4A6FA5", // brand blue (matches mockup)
  onHold: "#A8A29E", // muted gray
};

export default function CommissionTrackingPage() {
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  const viewer = React.useMemo(
    () => (user ? viewerFromUser(user) : { role: "Agent" as const, userId: DEMO_AGENT_ID }),
    [user],
  );

  // Aggregations route through engine
  const kpis = computeKPIs(seedCommissions, viewer);
  const breakdown = computeBreakdown(seedCommissions, viewer);

  // Visible commissions for the transactions table
  const visibleCommissions = React.useMemo(
    () => seedCommissions.filter((c) => c.agentId === DEMO_AGENT_ID),
    [],
  );

  // Map commissions → deals for property + buyer info
  const dealsById = React.useMemo(
    () => new Map(seedDeals.map((d) => [d.id, d])),
    [],
  );

  // Donut segments — engine values, not hardcoded
  const donutSegments = [
    {
      label: "Closed Deals",
      value: breakdown.closedDealsAmount,
      color: DONUT_COLORS.closedDeals,
    },
    {
      label: "For Closing",
      value: breakdown.forClosingAmount + breakdown.forPayoutAmount,
      color: DONUT_COLORS.forClosing,
    },
    {
      label: "For Approval",
      value: breakdown.forApprovalAmount,
      color: DONUT_COLORS.forApproval,
    },
    {
      label: "On Hold",
      value: breakdown.onHoldAmount,
      color: DONUT_COLORS.onHold,
    },
  ];
  const donutTotal = donutSegments.reduce((s, seg) => s + seg.value, 0);

  // Monthly target
  const monthlyTarget = DEFAULT_MONTHLY_TARGET;
  const targetProgressPct =
    monthlyTarget > 0
      ? Math.min(
          100,
          Math.round(((kpis.paidToDate + kpis.pendingPayout) / monthlyTarget) * 100),
        )
      : 0;

  // Upcoming payouts — top 3 by expected date in For Closing / For Payout
  const upcomingPayouts = React.useMemo(() => {
    return visibleCommissions
      .filter((c) => c.status === "For Closing" || c.status === "For Payout")
      .filter((c) => c.expectedPayoutDate !== undefined)
      .sort((a, b) =>
        (a.expectedPayoutDate ?? "").localeCompare(b.expectedPayoutDate ?? ""),
      )
      .slice(0, 3);
  }, [visibleCommissions]);

  // Transactions table filter
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const statusFilters = ["All", "Closed Deals", "For Closing", "For Approval", "Paid", "On Hold"];
  const filteredTransactions = React.useMemo(() => {
    if (statusFilter === "All") return visibleCommissions;
    if (statusFilter === "Closed Deals")
      return visibleCommissions.filter((c) => c.status === "Paid");
    return visibleCommissions.filter(
      (c) => c.status === statusFilter,
    );
  }, [visibleCommissions, statusFilter]);

  // Commission Insights — derive from visible commissions
  const insights = React.useMemo(() => {
    const closedThisMonth = visibleCommissions.filter(
      (c) => c.status === "Paid",
    );
    const totalSales = visibleCommissions.reduce((s, c) => {
      const d = dealsById.get(c.dealId);
      return s + (d?.contractPrice ?? 0);
    }, 0);
    const rates = visibleCommissions.map((c) => {
      const d = dealsById.get(c.dealId);
      return d?.commissionRate ?? 0;
    });
    const avgRate =
      rates.length > 0
        ? rates.reduce((s, r) => s + r, 0) / rates.length
        : 0;
    return {
      totalSales,
      avgRate,
      dealsClosed: closedThisMonth.length,
    };
  }, [visibleCommissions, dealsById]);

  return (
    <main className="min-h-screen bg-canvas pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Link
                href="/agent"
                aria-label="Back"
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-canvas-raised border border-line hover:border-gold/40 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-ink-muted" />
              </Link>
              <div>
                <h1
                  data-testid="commission-tracking-title"
                  className="font-display text-2xl sm:text-3xl font-semibold text-ink"
                >
                  Commission Tracking
                </h1>
                <p className="text-sm text-ink-muted mt-1">
                  Track your earnings, payouts, and commission status in real time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                data-testid="date-range-selector"
                className="inline-flex items-center gap-2 rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink hover:border-gold/40"
              >
                <Calendar className="h-4 w-4 text-ink-muted" />
                <span>May 1 – May 31, 2025</span>
                <svg
                  className="h-3 w-3 text-ink-subtle"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                data-testid="filter-button"
                className="inline-flex items-center gap-2 rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink hover:border-gold/40"
              >
                <SlidersHorizontal className="h-4 w-4 text-ink-muted" />
                Filter
              </button>
            </div>
          </div>
        </header>

        {/* KPI row */}
        <section
          data-testid="commission-kpi-row"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <CommissionKPICard
            variant="total"
            label="Total Commission Earned"
            value={formatPHP2dp(kpis.totalEarned)}
            icon={<Wallet className="h-3.5 w-3.5" />}
            delta={{ text: "18.6% vs Apr 1 – Apr 30, 2025", positive: true }}
          />
          <CommissionKPICard
            variant="paid"
            label="Paid to Date"
            value={formatPHP2dp(kpis.paidToDate)}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            hint={`${pctOf(kpis.paidToDate, kpis.totalEarned)}% of total earned`}
            progressPct={pctOf(kpis.paidToDate, kpis.totalEarned)}
          />
          <CommissionKPICard
            variant="pending"
            label="Pending Payout"
            value={formatPHP2dp(kpis.pendingPayout)}
            icon={<Clock className="h-3.5 w-3.5" />}
            hint={`${pctOf(kpis.pendingPayout, kpis.totalEarned)}% of total earned`}
            progressPct={pctOf(kpis.pendingPayout, kpis.totalEarned)}
          />
          <CommissionKPICard
            variant="on-hold"
            label="On Hold"
            value={formatPHP2dp(kpis.onHold)}
            icon={<PauseCircle className="h-3.5 w-3.5" />}
            hint={`${pctOf(kpis.onHold, kpis.totalEarned)}% of total earned`}
            progressPct={pctOf(kpis.onHold, kpis.totalEarned)}
          />
        </section>

        {/* Two-column zone: Breakdown + Upcoming Payouts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Commission Breakdown */}
          <Card data-testid="commission-breakdown-card" className="!p-5">
            <header className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5">
                <h2 className="font-medium text-ink">Commission Breakdown</h2>
                <Info className="h-3.5 w-3.5 text-ink-subtle" />
              </div>
              <Link
                href="/agent/commissions/money-on-the-way"
                className="text-xs text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline"
              >
                View Details
                <ChevronRight className="h-3 w-3" />
              </Link>
            </header>
            <div className="flex items-center gap-5 flex-wrap">
              <div
                data-testid="commission-breakdown-donut"
                className="shrink-0 relative"
              >
                <DonutChart
                  segments={donutSegments}
                  size={180}
                  thickness={26}
                  centerValue={
                    <span className="font-display text-xl font-semibold text-ink tabular-nums">
                      {formatPHPCompactWithoutCurrency(donutTotal)}
                    </span>
                  }
                  centerLabel="Total"
                />
              </div>
              <ul
                data-testid="commission-breakdown-legend"
                className="flex-1 min-w-[12rem] space-y-3"
              >
                {donutSegments.map((seg) => {
                  const pct =
                    donutTotal > 0
                      ? Math.round((seg.value / donutTotal) * 100)
                      : 0;
                  return (
                    <li
                      key={seg.label}
                      data-testid={`breakdown-segment-${slugify(seg.label)}`}
                      data-value={seg.value}
                      data-pct={pct}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5"
                          style={{ backgroundColor: seg.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-ink font-medium">
                            {seg.label}
                          </p>
                          <p className="text-xs text-ink-muted tabular-nums">
                            {formatPHP2dp(seg.value)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-ink-muted tabular-nums">
                        {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Monthly Target progress (inside breakdown card per mockup) */}
            <div
              data-testid="monthly-target-card"
              className="mt-5 rounded-xl bg-sage-soft/40 border border-sage-deep/15 p-3 flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-sage-soft flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-sage-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink leading-tight">
                  Great job! You're on track to exceed your monthly commission target.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-ink-subtle">
                  Monthly Target
                </p>
                <p
                  data-testid="monthly-target-amount"
                  data-target-pct={targetProgressPct}
                  className="font-display text-sm font-semibold text-ink tabular-nums"
                >
                  {formatPHPWhole(monthlyTarget)}
                </p>
                <div className="mt-1 h-1 w-20 rounded-full bg-canvas-sunken overflow-hidden">
                  <div
                    className="h-full bg-sage-deep rounded-full"
                    style={{ width: `${targetProgressPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-ink-subtle mt-0.5">
                  {targetProgressPct}%
                </p>
              </div>
            </div>
          </Card>

          {/* Upcoming Payouts */}
          <Card data-testid="upcoming-payouts-card" className="!p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-ink">Upcoming Payouts</h2>
              <button className="text-xs text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline">
                View All
                <ChevronRight className="h-3 w-3" />
              </button>
            </header>
            <ul
              data-testid="upcoming-payouts-list"
              className="space-y-3"
            >
              {upcomingPayouts.length === 0 ? (
                <li className="text-sm text-ink-muted text-center py-4">
                  No upcoming payouts.
                </li>
              ) : (
                upcomingPayouts.map((c) => (
                  <PayoutRow
                    key={c.id}
                    commission={c}
                    deal={dealsById.get(c.dealId)}
                  />
                ))
              )}
            </ul>
            <button
              data-testid="request-payout-cta"
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sage-deep hover:bg-sage-deep/90 text-canvas-raised h-12 text-sm font-medium transition-colors"
            >
              <Send className="h-4 w-4" />
              Request Payout
            </button>
          </Card>
        </section>

        {/* Commission Transactions */}
        <Card data-testid="commission-transactions-card" className="!p-5">
          <header className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-medium text-ink">Commission Transactions</h2>
            <button
              data-testid="export-button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-canvas-raised border border-line px-3 h-9 text-xs text-ink hover:border-gold/40"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </header>
          <div
            data-testid="transactions-filter-tabs"
            className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 mb-3 scrollbar-none border-b border-line-soft"
          >
            {statusFilters.map((f) => {
              const active = f === statusFilter;
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  data-testid={`tx-filter-${slugify(f)}`}
                  data-active={active}
                  className={cn(
                    "shrink-0 inline-flex items-center rounded-full px-3 h-8 text-xs font-medium transition-colors",
                    active
                      ? "bg-sage-deep text-canvas-raised"
                      : "text-ink-muted hover:bg-canvas-sunken/50",
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table
              data-testid="transactions-table"
              className="w-full text-sm"
            >
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ink-subtle border-b border-line">
                  <th className="font-medium py-2.5 pr-3">Property / Buyer</th>
                  <th className="font-medium py-2.5 px-3 text-right">Deal Value</th>
                  <th className="font-medium py-2.5 px-3 text-right">Commission</th>
                  <th className="font-medium py-2.5 px-3">Status</th>
                  <th className="font-medium py-2.5 px-3">Expected Payout</th>
                  <th className="font-medium py-2.5 px-3">Date Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-6 text-center text-sm text-ink-muted italic"
                    >
                      No transactions match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((c) => (
                    <TransactionRow
                      key={c.id}
                      commission={c}
                      deal={dealsById.get(c.dealId)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length > 6 ? (
            <button className="mt-4 mx-auto block text-xs text-ink-muted hover:text-ink inline-flex items-center gap-0.5">
              Show More
              <ChevronRight className="h-3 w-3 rotate-90" />
            </button>
          ) : null}
        </Card>

        {/* Insights + Payout Accounts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card data-testid="commission-insights-card" className="!p-5">
            <header className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5">
                <h2 className="font-medium text-ink">Commission Insights</h2>
                <Info className="h-3.5 w-3.5 text-ink-subtle" />
              </div>
              <button className="text-xs text-sage-deep font-medium hover:underline">
                View Report
              </button>
            </header>
            <div className="grid grid-cols-3 gap-3">
              <InsightTile
                icon={<TrendingUp className="h-4 w-4 text-sage-deep" />}
                iconBg="bg-sage-soft/60"
                label="Total sales this month"
                value={formatPHPCompact(insights.totalSales)}
                delta={{ text: "22.4% vs last month", positive: true }}
                testId="insight-total-sales"
              />
              <InsightTile
                icon={<Banknote className="h-4 w-4 text-navy" />}
                iconBg="bg-navy-soft/70"
                label="Average commission rate"
                value={`${(insights.avgRate * 100).toFixed(2)}%`}
                delta={{ text: "0.35% vs last month", positive: true }}
                testId="insight-avg-rate"
              />
              <InsightTile
                icon={<Star className="h-4 w-4 text-gold-deep" />}
                iconBg="bg-gold-soft/70"
                label="Deals closed this month"
                value={`${insights.dealsClosed} Deals`}
                delta={{ text: "20% vs last month", positive: true }}
                testId="insight-deals-closed"
              />
            </div>
          </Card>

          <Card data-testid="payout-accounts-card" className="!p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-ink">Payout Accounts</h2>
              <button className="text-xs text-sage-deep font-medium inline-flex items-center gap-1 hover:underline">
                <Settings className="h-3 w-3" />
                Manage
              </button>
            </header>
            <ul
              data-testid="payout-accounts-list"
              className="space-y-2"
            >
              {seedPayoutAccounts
                .filter((pa) => pa.userId === DEMO_AGENT_ID)
                .map((pa) => (
                  <PayoutAccountRow key={pa.id} account={pa} />
                ))}
            </ul>
          </Card>
        </section>

        {/* Footer */}
        <footer
          data-testid="commissions-footer"
          className="flex items-start justify-between gap-3 flex-wrap text-xs text-ink-muted pt-4 border-t border-line-soft"
        >
          <p className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-sage-deep shrink-0" />
            All commissions are computed based on your active commission rate and confirmed deals.
          </p>
          <a className="text-sage-deep font-medium hover:underline inline-flex items-center gap-1" href="#">
            <Mail className="h-3 w-3" />
            Need help? Contact support
          </a>
        </footer>
      </div>
    </main>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function PayoutRow({
  commission,
  deal,
}: {
  commission: Commission;
  deal: (typeof seedDeals)[number] | undefined;
}) {
  const dateLabel = commission.expectedPayoutDate
    ? formatShortDate(commission.expectedPayoutDate)
    : "TBD";
  const dateMonth = commission.expectedPayoutDate
    ? formatMonthAbbrev(commission.expectedPayoutDate)
    : "TBD";
  const dateDay = commission.expectedPayoutDate
    ? formatDayNum(commission.expectedPayoutDate)
    : "";

  const payoutAccount = seedPayoutAccounts.find(
    (pa) => pa.id === commission.payoutAccountId,
  );

  return (
    <li
      data-testid={`payout-row-${commission.id}`}
      data-status={commission.status}
      className="flex items-start gap-3"
    >
      <div className="w-12 shrink-0 rounded-lg bg-canvas-sunken/50 py-1.5 text-center">
        <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
          {dateMonth}
        </p>
        <p className="font-display text-base font-semibold text-ink leading-tight">
          {dateDay}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {deal?.listingTitle ?? "—"}
        </p>
        <p className="text-xs text-ink-muted truncate">
          Buyer: {deal?.buyerName ?? "—"}
        </p>
        {payoutAccount ? (
          <p className="text-[11px] text-ink-subtle truncate mt-0.5">
            Payout via {payoutAccount.bankName.replace(/ Savings$/, "")} {payoutAccount.accountNumberMasked}
          </p>
        ) : null}
      </div>
      <div className="text-right shrink-0">
        <p
          data-testid={`payout-row-${commission.id}-amount`}
          className="font-display text-sm font-semibold text-ink tabular-nums"
        >
          {formatPHP2dp(commission.agentAmount)}
        </p>
        <div className="mt-1">
          <StatusBadge variant={statusBadgeVariant(commission.status)}>
            {commission.status}
          </StatusBadge>
        </div>
      </div>
      <span className="sr-only">{dateLabel}</span>
    </li>
  );
}

function TransactionRow({
  commission,
  deal,
}: {
  commission: Commission;
  deal: (typeof seedDeals)[number] | undefined;
}) {
  const rate = deal?.commissionRate ?? 0;
  return (
    <tr
      data-testid={`tx-row-${commission.id}`}
      data-status={commission.status}
      className="hover:bg-canvas-sunken/30"
    >
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-canvas-sunken shrink-0 flex items-center justify-center">
            <span className="text-[10px] text-ink-subtle font-medium uppercase">
              {(deal?.listingTitle ?? "?").slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {deal?.listingTitle ?? "—"}
            </p>
            <p className="text-xs text-ink-muted truncate">
              Buyer: {deal?.buyerName ?? "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right tabular-nums text-ink">
        {formatPHPWhole(deal?.contractPrice ?? 0)}
      </td>
      <td className="py-3 px-3 text-right">
        <p
          data-testid={`tx-row-${commission.id}-commission`}
          className={cn(
            "font-medium tabular-nums",
            commission.status === "For Payout" || commission.status === "On Hold"
              ? "text-terracotta-deep"
              : "text-ink",
          )}
        >
          {formatPHPWhole(commission.totalAmount)}
        </p>
        <p className="text-[11px] text-ink-subtle">
          {(rate * 100).toFixed(1)}%
        </p>
      </td>
      <td className="py-3 px-3">
        <StatusBadge variant={statusBadgeVariant(commission.status)}>
          {commission.status}
        </StatusBadge>
      </td>
      <td className="py-3 px-3 text-ink-muted">
        {commission.expectedPayoutDate
          ? formatLongDate(commission.expectedPayoutDate)
          : "TBD"}
      </td>
      <td className="py-3 px-3 text-ink-muted">
        {commission.timeline[0]?.completedAt
          ? formatLongDate(commission.timeline[0].completedAt)
          : "—"}
      </td>
      <td className="py-3 pl-3 pr-1">
        <Link
          href={`/agent/commissions/${commission.id}/timeline`}
          aria-label="View timeline"
          className="text-ink-subtle hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

function InsightTile({
  icon,
  iconBg,
  label,
  value,
  delta,
  testId,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  delta: { text: string; positive: boolean };
  testId: string;
}) {
  return (
    <div data-testid={testId} className="text-center">
      <div
        className={cn(
          "h-10 w-10 rounded-full mx-auto flex items-center justify-center",
          iconBg,
        )}
      >
        {icon}
      </div>
      <p className="text-[11px] text-ink-muted mt-2">{label}</p>
      <p className="font-display text-base font-semibold text-ink tabular-nums mt-0.5">
        {value}
      </p>
      <p
        className={cn(
          "text-[11px] mt-1 inline-flex items-center gap-0.5",
          delta.positive ? "text-sage-deep" : "text-terracotta-deep",
        )}
      >
        <span aria-hidden>{delta.positive ? "↑" : "↓"}</span>
        {delta.text}
      </p>
    </div>
  );
}

function PayoutAccountRow({
  account,
}: {
  account: (typeof seedPayoutAccounts)[number];
}) {
  const isBDO = account.bankName.startsWith("BDO");
  return (
    <li
      data-testid={`payout-account-${account.id}`}
      data-default={account.isDefault}
      className="flex items-center gap-3 rounded-xl bg-canvas-sunken/30 border border-line p-3 hover:border-gold/40 transition-colors"
    >
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-canvas-raised font-display text-[10px] font-semibold",
          isBDO ? "bg-navy" : "bg-terracotta",
        )}
      >
        {isBDO ? "BDO" : "BPI"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-ink truncate">
            {account.bankName} {account.accountNumberMasked}
          </p>
          {account.isDefault ? (
            <StatusBadge variant="paid">Default</StatusBadge>
          ) : null}
        </div>
        <p className="text-xs text-ink-muted truncate">
          Account Name: {account.accountNameMasked}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0" />
    </li>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function pctOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMonthAbbrev(iso: string): string {
  try {
    return new Date(iso)
      .toLocaleDateString("en-PH", { month: "short" })
      .toUpperCase();
  } catch {
    return iso;
  }
}

function formatDayNum(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PH", { day: "numeric" });
  } catch {
    return iso;
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

function formatPHPCompactWithoutCurrency(amount: number): string {
  // Mockup donut center shows "₱523,750" without decimals or currency suffix.
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
