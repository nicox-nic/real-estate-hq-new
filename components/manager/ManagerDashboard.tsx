"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Heart,
  CalendarCheck,
  Briefcase,
  Trophy,
  TrendingUp,
  Coins,
  Send,
  Megaphone,
  CalendarDays,
  Award,
  Gift,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DonutChart } from "@/components/ui/DonutChart";
import { cn } from "@/lib/cn";
import {
  seedUsers,
  seedDeals,
  seedCommissions,
  seedSiteVisits,
  seedLeads,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
} from "@/lib/data";
import {
  computeManagerKPIs,
  computeLeaderboard,
  computeClosingSprintProgress,
} from "@/lib/logic/managerDashboardDerivations";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";
import type { UserRole } from "@/lib/types";

const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

/**
 * Manager Dashboard — parameterized component used by BOTH
 * /broker/dashboard and /realtor/dashboard.
 *
 * Architectural decision: ONE component, role prop drives team-vs-network
 * scope and framing copy. Per Session 1's useCurrentRole + Session 7
 * framing's "same Component, different role prop drives team-vs-network".
 *
 * Composition per mockup 1 (top to bottom):
 *   - Header: greeting + date range + Broadcast Message CTA
 *   - 7-card KPI row (Active Agents · Agent Health · Site Visits Booked ·
 *     For Closing · Deals Closed · Total Sales · Pending Commissions)
 *   - Two-column zone:
 *       Left (wider): Top Performers leaderboard (5 rows compact) + Team
 *         Updates compose card with 4 chip-actions + Closing Sprint
 *         campaign card
 *       Right: May Closing Sprint donut with team progress + top closer +
 *         rewards podium
 */

export interface ManagerDashboardProps {
  role: "Broker" | "Realtor";
}

export function ManagerDashboard({ role }: ManagerDashboardProps) {
  const userId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const user = seedUsers.find((u) => u.id === userId);
  if (!user) return null;

  const kpis = computeManagerKPIs({
    manager: user,
    allUsers: seedUsers,
    deals: seedDeals,
    commissions: seedCommissions,
    siteVisits: seedSiteVisits,
    leads: seedLeads,
    referenceIso: SEED_REFERENCE_ISO,
  });

  const leaderboard = computeLeaderboard({
    manager: user,
    allUsers: seedUsers,
    deals: seedDeals,
    siteVisits: seedSiteVisits,
    leads: seedLeads,
    referenceIso: SEED_REFERENCE_ISO,
  });
  const topPerformers = leaderboard.slice(0, 5);

  const sprint = computeClosingSprintProgress({
    manager: user,
    allUsers: seedUsers,
    deals: seedDeals,
    referenceIso: SEED_REFERENCE_ISO,
  });

  const roleSlug = role.toLowerCase() as "broker" | "realtor";
  const isRealtor = role === "Realtor";

  // Framing copy per role
  const greeting = `Welcome back, ${firstName(user.fullName)}`;
  const subtitle = isRealtor
    ? "Here's your network's overview today."
    : "Here's what's happening with your team.";

  return (
    <AppShell
      role={role}
      userName={user.fullName}
      userSubtitle={user.companyName ?? role}
    >
      <div className="space-y-5 pb-4">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1
              data-testid={`${roleSlug}-dashboard-greeting`}
              className="font-display text-2xl sm:text-3xl font-semibold text-ink"
            >
              {greeting}{" "}
              <span aria-hidden className="text-gold-deep">
                👋
              </span>
            </h1>
            <p
              data-testid={`${roleSlug}-dashboard-subtitle`}
              className="text-sm text-ink-muted mt-1"
            >
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              data-testid="date-range-selector"
              className="inline-flex items-center gap-2 rounded-xl bg-canvas-raised border border-line px-3 h-9 text-xs text-ink hover:border-gold/40"
            >
              <CalendarDays className="h-3.5 w-3.5 text-ink-muted" />
              May 1 – May 31, 2025
            </button>
            <Button
              variant="primary"
              size="sm"
              data-testid="broadcast-message-cta"
            >
              <Megaphone className="h-4 w-4" />
              Broadcast Message
            </Button>
          </div>
        </header>

        {/* 7-card KPI row */}
        <section
          data-testid={`${roleSlug}-kpi-row`}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3"
        >
          <ManagerKPI
            testId="kpi-active-agents"
            icon={<Users className="h-3.5 w-3.5" />}
            label="Active Agents"
            value={String(kpis.activeAgents)}
          />
          <ManagerKPI
            testId="kpi-agent-health"
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Agent Health"
            value={String(kpis.agentHealthScore)}
            badge={kpis.agentHealthLabel}
          />
          <ManagerKPI
            testId="kpi-site-visits"
            icon={<CalendarCheck className="h-3.5 w-3.5" />}
            label="Site Visits Booked"
            value={String(kpis.siteVisitsBooked)}
          />
          <ManagerKPI
            testId="kpi-for-closing"
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="For Closing"
            value={String(kpis.forClosing)}
          />
          <ManagerKPI
            testId="kpi-deals-closed"
            icon={<Trophy className="h-3.5 w-3.5" />}
            label="Deals Closed"
            value={String(kpis.dealsClosed)}
          />
          <ManagerKPI
            testId="kpi-total-sales"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Total Sales"
            value={formatPHPCompact(kpis.totalSales)}
          />
          <ManagerKPI
            testId="kpi-pending-commissions"
            icon={<Coins className="h-3.5 w-3.5" />}
            label="Pending Commissions"
            value={formatPHPCompact(kpis.pendingCommissions)}
          />
        </section>

        {/* Two-column zone */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Top Performers */}
            <Card data-testid="top-performers-card" className="!p-5">
              <header className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-gold-deep" />
                  <h2 className="font-medium text-ink">Top Performers</h2>
                </div>
                <Link
                  href={`/${roleSlug}/leaderboard`}
                  data-testid="view-leaderboard-link"
                  className="text-xs text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline"
                >
                  View Full Leaderboard
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </header>
              {topPerformers.length === 0 ? (
                <p className="text-sm text-ink-muted italic text-center py-3">
                  No performance data yet.
                </p>
              ) : (
                <ol
                  data-testid="top-performers-list"
                  className="space-y-2"
                >
                  {topPerformers.map((row, i) => (
                    <li
                      key={row.agentId}
                      data-testid={`top-performer-${i + 1}`}
                      className="flex items-center gap-3 rounded-xl border border-line p-2.5 hover:border-gold/40 transition-colors"
                    >
                      <span className="font-display text-base font-semibold text-ink-subtle w-5 shrink-0">
                        {i + 1}
                      </span>
                      <div className="h-9 w-9 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-medium text-ink-muted">
                          {initials(row.agentName)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">
                          {row.agentName}
                        </p>
                        <StatusBadge
                          variant={healthBadgeVariant(row.healthLabel)}
                        >
                          {row.healthLabel}
                        </StatusBadge>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                          Deals
                        </p>
                        <p className="font-display text-base font-semibold text-ink leading-none">
                          {row.deals}
                        </p>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                          Sales
                        </p>
                        <p className="font-display text-sm font-semibold text-ink leading-none tabular-nums">
                          {formatPHPCompact(row.sales)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            {/* Team Updates compose card */}
            <Card data-testid="team-updates-card" className="!p-5">
              <header className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-ink">Team Updates</h2>
                <Link
                  href={`/${roleSlug}/team-updates`}
                  className="text-xs text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline"
                >
                  View All
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </header>
              <input
                data-testid="team-update-compose-input"
                placeholder={
                  isRealtor
                    ? "Share an update, training, or opportunity..."
                    : "Share an update with your team..."
                }
                className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-gold/60"
              />
              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                <div
                  data-testid="team-update-quick-actions"
                  className="flex items-center gap-1.5 flex-wrap"
                >
                  <QuickActionChip
                    testId="quick-announcement"
                    icon={<Megaphone className="h-3 w-3" />}
                    label="Announcement"
                  />
                  <QuickActionChip
                    testId="quick-event"
                    icon={<CalendarDays className="h-3 w-3" />}
                    label="Event"
                  />
                  <QuickActionChip
                    testId="quick-award"
                    icon={<Award className="h-3 w-3" />}
                    label="Award"
                  />
                  <QuickActionChip
                    testId="quick-bonus"
                    icon={<Gift className="h-3 w-3" />}
                    label="Bonus"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="send-team-update-cta"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isRealtor ? "Send to All" : "Send to All Agents"}
                </Button>
              </div>

              {/* Recent team update preview (mockup shows one) */}
              <div className="mt-4 pt-4 border-t border-line-soft flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-gold-soft flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4 text-gold-deep" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {isRealtor
                      ? "New Rental Inventory Just In!"
                      : "May Closing Sprint is ON! 🎯"}
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                    {isRealtor
                      ? "We have 12 new rental listings in BGC and Makati. Let's move fast and match them with our clients."
                      : "Let's finish strong this month! Top closers will earn exciting rewards and recognition. Let's make May our best month yet!"}
                  </p>
                  <p className="text-[11px] text-ink-subtle mt-1.5">
                    {firstName(user.fullName)} {user.fullName.split(/\s+/).slice(1).join(" ")} · 2h ago
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* May Closing Sprint card (right column) */}
          <Card data-testid="closing-sprint-card" className="!p-5">
            <header className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <h2 className="font-medium text-ink truncate">May Closing Sprint</h2>
                <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                  Ends in {sprint.daysRemaining} days
                </p>
              </div>
              <button className="text-xs text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline">
                View Details
                <ChevronRight className="h-3 w-3" />
              </button>
            </header>

            {/* Donut + Team Progress */}
            <div className="flex items-center gap-3 flex-wrap">
              <DonutChart
                segments={[
                  {
                    label: "Progress",
                    value: sprint.progressPct,
                    color: "#5B7A5A",
                  },
                  {
                    label: "Remaining",
                    value: Math.max(0, 100 - sprint.progressPct),
                    color: "#E8E3D8",
                  },
                ]}
                size={140}
                thickness={18}
                centerValue={
                  <span
                    data-testid="sprint-progress-pct"
                    className="font-display text-xl font-semibold text-ink leading-none"
                  >
                    {sprint.progressPct}%
                  </span>
                }
                centerLabel="of target"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                  Team Progress
                </p>
                <p
                  data-testid="sprint-team-progress"
                  className="font-display text-base font-semibold text-ink tabular-nums"
                >
                  {formatPHPCompact(sprint.teamProgressAmount)} /{" "}
                  {formatPHPCompact(sprint.teamTargetAmount)}
                </p>
                <p className="text-[11px] text-ink-subtle">Team Target</p>
                {sprint.topCloserName ? (
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                      Top Closer
                    </p>
                    <p
                      data-testid="sprint-top-closer"
                      className="text-sm font-medium text-ink truncate"
                    >
                      {sprint.topCloserName}{" "}
                      <span className="text-ink-muted tabular-nums">
                        {formatPHPCompact(sprint.topCloserAmount)}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Rewards podium */}
            <div
              data-testid="sprint-rewards-row"
              className="mt-4 pt-4 border-t border-line-soft"
            >
              <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mb-2">
                Rewards
              </p>
              <div className="grid grid-cols-3 gap-2">
                {sprint.rewards.map((r) => (
                  <RewardChip
                    key={r.rank}
                    rank={r.rank}
                    amountPHP={r.amountPHP}
                  />
                ))}
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function ManagerKPI({
  testId,
  icon,
  label,
  value,
  badge,
}: {
  testId: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-2xl bg-canvas-raised border border-line p-3 shadow-soft"
    >
      <header className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
          {label}
        </span>
        <span className="h-6 w-6 rounded-full bg-sage-soft/60 text-sage-deep flex items-center justify-center shrink-0">
          {icon}
        </span>
      </header>
      <p
        data-testid={`${testId}-value`}
        className="font-display text-lg font-semibold text-ink tabular-nums leading-none"
      >
        {value}
      </p>
      {badge ? (
        <StatusBadge
          variant={
            badge === "Top Performer"
              ? "paid"
              : badge === "Active"
              ? "paid"
              : badge === "Needs Coaching"
              ? "warm"
              : "neutral"
          }
        >
          {badge}
        </StatusBadge>
      ) : null}
    </div>
  );
}

function QuickActionChip({
  testId,
  icon,
  label,
}: {
  testId: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      data-testid={testId}
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas-raised hover:border-gold/40 px-2.5 h-7 text-[11px] font-medium text-ink-muted transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

function RewardChip({
  rank,
  amountPHP,
}: {
  rank: 1 | 2 | 3;
  amountPHP: number;
}) {
  const bg =
    rank === 1
      ? "bg-gold-soft text-gold-deep"
      : rank === 2
      ? "bg-canvas-sunken text-ink-muted"
      : "bg-terracotta-soft text-terracotta-deep";
  const label = rank === 1 ? "Top 1" : rank === 2 ? "Top 2" : "Top 3";
  return (
    <div
      data-testid={`reward-rank-${rank}`}
      className={cn(
        "rounded-xl text-center p-2.5",
        rank === 1 ? "bg-gold-soft/40" : "bg-canvas-sunken/30",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-semibold",
          bg,
        )}
      >
        {rank}
      </span>
      <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mt-1">
        {label}
      </p>
      <p className="font-display text-sm font-semibold text-ink tabular-nums">
        ₱{(amountPHP / 1000).toFixed(0)}K
      </p>
      <p className="text-[10px] text-ink-subtle">Bonus</p>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

function healthBadgeVariant(label: string) {
  switch (label) {
    case "Top Performer":
      return "paid" as const;
    case "Active":
      return "paid" as const;
    case "Needs Coaching":
      return "warm" as const;
    case "Low Activity":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}
