"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  CalendarDays,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DonutChart, DonutLegend } from "@/components/ui/DonutChart";
import { BarChart } from "@/components/ui/BarChart";
import { LineChart } from "@/components/ui/LineChart";
import { cn } from "@/lib/cn";
import {
  seedUsers,
  seedLeads,
  seedDeals,
  seedCommissions,
  seedSiteVisits,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
} from "@/lib/data";
import { computeAnalyticsSnapshot } from "@/lib/logic/analyticsDerivations";
import {
  resolveTeamAgentIds,
  computeLeaderboard,
} from "@/lib/logic/managerDashboardDerivations";
import { formatPHPCompact } from "@/lib/format";

const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

interface Props {
  role: "Broker" | "Realtor";
}

/**
 * Manager Analytics (#33) — parameterized component for /broker/insights
 * and /realtor/insights. 7th use of the single-parameterized-component
 * pattern in the codebase.
 *
 * 6-chart grid composing the existing/new chart wrappers:
 *   1. Lead volume over time (LineChart, filled)
 *   2. Response time distribution (BarChart)
 *   3. Lead source performance (DonutChart)
 *   4. Conversion rate by stage (BarChart)
 *   5. Lead temperature distribution (DonutChart)
 *   6. Commission status breakdown (DonutChart)
 *
 * All values derive from computeAnalyticsSnapshot — engine-honest. No
 * inline Recharts components (Section 21 asserts the cross-file
 * invariant).
 */
export function ManagerAnalytics({ role }: Props) {
  const userId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const manager = seedUsers.find((u) => u.id === userId);
  if (!manager) return null;
  const roleSlug = role.toLowerCase() as "broker" | "realtor";

  const snapshot = React.useMemo(
    () =>
      computeAnalyticsSnapshot(
        manager,
        seedUsers,
        seedLeads,
        seedDeals,
        seedCommissions,
        SEED_REFERENCE_ISO,
      ),
    [manager],
  );

  const leaderboard = React.useMemo(
    () =>
      computeLeaderboard({
        manager,
        allUsers: seedUsers,
        deals: seedDeals,
        siteVisits: seedSiteVisits,
        leads: seedLeads,
        referenceIso: SEED_REFERENCE_ISO,
      }),
    [manager],
  );
  const topPerformers = leaderboard.slice(0, 3);

  const teamIds = resolveTeamAgentIds(manager, seedUsers);
  const teamSize = teamIds.size;

  // Color palettes
  const SOURCE_COLORS = [
    "#3F5A3E", // sage-deep
    "#C9A961", // gold
    "#4A6FA5", // brand blue
    "#B8694F", // terracotta
    "#A88B4A", // gold-deep
    "#8E4F38", // terracotta-deep
    "#A8A29E", // muted gray (overflow)
  ];
  const TEMP_COLORS: Record<string, string> = {
    Hot: "#B8694F",
    Warm: "#C9A961",
    Nurture: "#5B7A5A",
    Cold: "#A8A29E",
  };
  const STATUS_COLORS: Record<string, string> = {
    Paid: "#3F5A3E",
    "For Closing": "#C9A961",
    "For Approval": "#4A6FA5",
    "For Payout": "#A88B4A",
    "On Hold": "#A8A29E",
  };

  // Donut segments
  const sourceSegments = snapshot.leadSource.slice(0, 6).map((p, i) => ({
    label: p.source,
    value: p.value,
    color: SOURCE_COLORS[i] ?? "#A8A29E",
  }));
  const tempSegments = snapshot.leadTemperature.map((p) => ({
    label: p.category,
    value: p.value,
    color: TEMP_COLORS[p.category] ?? "#A8A29E",
  }));
  const statusSegments = snapshot.commissionStatus.map((p) => ({
    label: p.status,
    value: p.amount,
    color: STATUS_COLORS[p.status] ?? "#A8A29E",
  }));
  const commissionTotal = statusSegments.reduce((s, x) => s + x.value, 0);

  return (
    <AppShell
      role={role}
      userName={manager.fullName}
      userSubtitle={manager.companyName ?? role}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={`/${roleSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1
              data-testid={`${roleSlug}-analytics-title`}
              className="font-display text-2xl font-semibold text-ink"
            >
              {role === "Broker" ? "Team Analytics" : "Network Analytics"}
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {role === "Broker"
                ? `Performance insights across your ${teamSize} agents.`
                : `Performance insights across your ${teamSize}-agent network.`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              data-testid="analytics-date-range"
              className="inline-flex items-center gap-2 rounded-xl bg-canvas-raised border border-line px-3 h-9 text-xs text-ink hover:border-gold/40"
            >
              <CalendarDays className="h-3.5 w-3.5 text-ink-muted" />
              Last 6 weeks
            </button>
            <button
              data-testid="analytics-export"
              className="inline-flex items-center gap-1.5 rounded-xl bg-canvas-raised border border-line px-3 h-9 text-xs text-ink hover:border-gold/40"
            >
              <Download className="h-3.5 w-3.5 text-ink-muted" />
              Export
            </button>
          </div>
        </header>

        {/* Summary stat strip */}
        <section
          data-testid="analytics-summary-strip"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <SummaryStat
            testId="stat-total-leads"
            label="Total Leads"
            value={String(snapshot.totalLeads)}
          />
          <SummaryStat
            testId="stat-closed-deals"
            label="Closed Deals"
            value={String(
              snapshot.conversionByStage.find(
                (s) => s.stage === "Contract Signed",
              )?.reached ?? 0,
            )}
          />
          <SummaryStat
            testId="stat-pending-commissions"
            label="Pending Commissions"
            value={formatPHPCompact(
              snapshot.commissionStatus
                .filter(
                  (s) =>
                    s.status === "For Closing" ||
                    s.status === "For Approval" ||
                    s.status === "For Payout",
                )
                .reduce((s, p) => s + p.amount, 0),
            )}
          />
          <SummaryStat
            testId="stat-active-agents"
            label="Active Agents"
            value={String(teamSize)}
          />
        </section>

        {/* 6-chart grid */}
        <section
          data-testid="analytics-chart-grid"
          data-chart-count="6"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* 1. Lead volume over time */}
          <Card data-testid="chart-lead-volume" className="!p-5">
            <CardHeader>
              <CardTitle>Lead Volume Over Time</CardTitle>
              <span className="text-xs text-ink-subtle">Weekly buckets</span>
            </CardHeader>
            <LineChart
              data-testid="chart-lead-volume-line"
              data={snapshot.leadVolume.map((p) => ({
                label: p.label,
                value: p.value,
              }))}
              height={180}
              filled
              color="#5B7A5A"
            />
          </Card>

          {/* 2. Response time distribution */}
          <Card data-testid="chart-response-time" className="!p-5">
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
              <span className="text-xs text-ink-subtle">
                Lead capture → first message
              </span>
            </CardHeader>
            <BarChart
              data-testid="chart-response-time-bar"
              data={snapshot.responseTime.map((b, i) => ({
                label: b.label,
                value: b.value,
                color:
                  i === 0
                    ? "#5B7A5A"
                    : i === 1
                    ? "#C9A961"
                    : i === 2
                    ? "#A88B4A"
                    : "#B8694F",
              }))}
              height={180}
            />
          </Card>

          {/* 3. Lead source performance */}
          <Card data-testid="chart-lead-source" className="!p-5">
            <CardHeader>
              <CardTitle>Lead Source Performance</CardTitle>
              <span className="text-xs text-ink-subtle">
                {snapshot.leadSource.length} sources
              </span>
            </CardHeader>
            {sourceSegments.length === 0 ? (
              <p className="text-sm text-ink-muted italic text-center py-6">
                No lead data yet.
              </p>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <DonutChart
                  segments={sourceSegments}
                  size={150}
                  thickness={22}
                  centerValue={
                    <span className="font-display text-lg font-semibold text-ink leading-none">
                      {snapshot.totalLeads}
                    </span>
                  }
                  centerLabel="Leads"
                />
                <ul className="flex-1 min-w-[10rem] space-y-1.5">
                  {sourceSegments.map((seg, i) => (
                    <li
                      key={seg.label}
                      data-testid={`source-${slugify(seg.label)}`}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-ink truncate">{seg.label}</span>
                      </span>
                      <span className="text-ink-muted tabular-nums shrink-0">
                        {seg.value}{" "}
                        <span className="text-ink-subtle">
                          ({snapshot.leadSource[i]?.pct ?? 0}%)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* 4. Conversion rate by stage */}
          <Card data-testid="chart-conversion-stage" className="!p-5">
            <CardHeader>
              <CardTitle>Conversion by Stage</CardTitle>
              <span className="text-xs text-ink-subtle">
                % of deals reaching each stage
              </span>
            </CardHeader>
            <BarChart
              data-testid="chart-conversion-bar"
              data={snapshot.conversionByStage
                .slice(1) // skip "Lead Generated" since it's 100% by definition
                .map((p) => ({
                  label: shortStageLabel(p.stage),
                  value: p.rate,
                }))}
              height={180}
              valueFormatter={(v) => `${v}%`}
              defaultColor="#4A6FA5"
            />
          </Card>

          {/* 5. Lead temperature distribution */}
          <Card data-testid="chart-lead-temperature" className="!p-5">
            <CardHeader>
              <CardTitle>Lead Temperature</CardTitle>
              <span className="text-xs text-ink-subtle">
                Hot / Warm / Nurture / Cold
              </span>
            </CardHeader>
            {tempSegments.reduce((s, x) => s + x.value, 0) === 0 ? (
              <p className="text-sm text-ink-muted italic text-center py-6">
                No leads yet.
              </p>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <DonutChart
                  segments={tempSegments}
                  size={150}
                  thickness={22}
                  centerValue={
                    <span className="font-display text-lg font-semibold text-ink leading-none">
                      {tempSegments.reduce((s, x) => s + x.value, 0)}
                    </span>
                  }
                  centerLabel="Leads"
                />
                <ul className="flex-1 min-w-[10rem] space-y-1.5">
                  {tempSegments.map((seg, i) => (
                    <li
                      key={seg.label}
                      data-testid={`temp-${seg.label.toLowerCase()}`}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-ink truncate">{seg.label}</span>
                      </span>
                      <span className="text-ink-muted tabular-nums shrink-0">
                        {seg.value}{" "}
                        <span className="text-ink-subtle">
                          ({snapshot.leadTemperature[i]?.pct ?? 0}%)
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* 6. Commission status breakdown */}
          <Card data-testid="chart-commission-status" className="!p-5">
            <CardHeader>
              <CardTitle>Commission Status</CardTitle>
              <span className="text-xs text-ink-subtle">
                {role === "Broker" ? "Your team's" : "Your network's"} share
              </span>
            </CardHeader>
            {commissionTotal === 0 ? (
              <p className="text-sm text-ink-muted italic text-center py-6">
                No commissions yet.
              </p>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <DonutChart
                  segments={statusSegments.filter((s) => s.value > 0)}
                  size={150}
                  thickness={22}
                  centerValue={
                    <span className="font-display text-sm font-semibold text-ink leading-none">
                      {formatPHPCompact(commissionTotal)}
                    </span>
                  }
                  centerLabel="Total"
                />
                <ul className="flex-1 min-w-[10rem] space-y-1.5">
                  {statusSegments
                    .filter((s) => s.value > 0)
                    .map((seg, i) => (
                      <li
                        key={seg.label}
                        data-testid={`commission-status-${slugify(seg.label)}`}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: seg.color }}
                          />
                          <span className="text-ink truncate">{seg.label}</span>
                        </span>
                        <span className="text-ink-muted tabular-nums shrink-0">
                          {formatPHPCompact(seg.value)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </Card>
        </section>

        {/* Top Performers compact */}
        <Card data-testid="analytics-top-performers" className="!p-5">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <Link
              href={`/${roleSlug}/leaderboard`}
              className="text-xs text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline"
            >
              View Full Leaderboard
              <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-ink-muted italic text-center py-3">
              No performance data yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {topPerformers.map((row, i) => (
                <li
                  key={row.agentId}
                  data-testid={`top-perf-${i + 1}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="font-display text-base font-semibold text-ink-subtle w-5 shrink-0">
                    {i + 1}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-ink-muted">
                      {initials(row.agentName)}
                    </span>
                  </div>
                  <span className="flex-1 min-w-0 text-ink truncate font-medium">
                    {row.agentName}
                  </span>
                  <span className="text-xs text-ink-muted shrink-0">
                    {row.deals} deals
                  </span>
                  <span className="text-xs text-ink tabular-nums shrink-0 font-medium">
                    {formatPHPCompact(row.sales)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryStat({
  testId,
  label,
  value,
}: {
  testId: string;
  label: string;
  value: string;
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-2xl bg-canvas-raised border border-line p-3 shadow-soft"
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p className="font-display text-lg font-semibold text-ink tabular-nums leading-none mt-1">
        {value}
      </p>
    </div>
  );
}

function shortStageLabel(s: string): string {
  if (s === "Buyer Qualified") return "Qualified";
  if (s === "Site Visit Done") return "Site Visit";
  if (s === "Reservation Paid") return "Reserved";
  if (s === "Documents Submitted") return "Docs";
  if (s === "Financing Approved") return "Financing";
  if (s === "Contract Signed") return "Contract";
  if (s === "Commission Processing") return "Comm Proc";
  if (s === "Commission Released") return "Released";
  return s;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
