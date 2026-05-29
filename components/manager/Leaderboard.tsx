"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Heart,
  Briefcase,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  seedUsers,
  seedDeals,
  seedSiteVisits,
  seedLeads,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
} from "@/lib/data";
import { computeLeaderboard } from "@/lib/logic/managerDashboardDerivations";
import { formatPHPCompact } from "@/lib/format";

const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

type SortColumn = "deals" | "sales" | "health" | "name";
type SortDir = "asc" | "desc";

interface Props {
  role: "Broker" | "Realtor";
}

/**
 * Leaderboard full view (#47) — used by /broker/leaderboard and
 * /realtor/leaderboard. Positive recognition copy, no shaming.
 *
 * Composition:
 *   - Header: back + title + subtitle + period filter
 *   - 3 highlight stat tiles: Top closer / Most sales / Most improved
 *   - Sortable table: rank, agent, deals, sales, health, recent activity
 *   - Filter chips by time period (illustrative for the prototype)
 */
export function Leaderboard({ role }: Props) {
  const userId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const manager = seedUsers.find((u) => u.id === userId);
  if (!manager) return null;

  const roleSlug = role.toLowerCase() as "broker" | "realtor";
  const allRows = computeLeaderboard({
    manager,
    allUsers: seedUsers,
    deals: seedDeals,
    siteVisits: seedSiteVisits,
    leads: seedLeads,
    referenceIso: SEED_REFERENCE_ISO,
  });

  const [sortCol, setSortCol] = React.useState<SortColumn>("deals");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [period, setPeriod] = React.useState<string>("This Month");

  const sortedRows = React.useMemo(() => {
    const rows = [...allRows];
    rows.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      switch (sortCol) {
        case "name":
          return mul * a.agentName.localeCompare(b.agentName);
        case "deals":
          return mul * (a.deals - b.deals);
        case "sales":
          return mul * (a.sales - b.sales);
        case "health":
          return mul * (a.healthScore - b.healthScore);
      }
    });
    return rows;
  }, [allRows, sortCol, sortDir]);

  const handleSort = (col: SortColumn) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  // Highlight stats — computed from leaderboard data
  const topCloser = allRows.find((r) => r.deals > 0);
  const mostSalesRow = [...allRows].sort((a, b) => b.sales - a.sales)[0];
  const healthiest = [...allRows].sort(
    (a, b) => b.healthScore - a.healthScore,
  )[0];

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

        <header>
          <h1
            data-testid="leaderboard-title"
            className="font-display text-2xl font-semibold text-ink"
          >
            Leaderboard
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Celebrate every win.{" "}
            {role === "Broker"
              ? "Your team's achievements at a glance."
              : "Your network's top performers across every region."}
          </p>
        </header>

        {/* Period filter chips */}
        <div
          data-testid="leaderboard-period-chips"
          className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none"
        >
          {["This Month", "This Quarter", "Year to Date", "All Time"].map(
            (p) => {
              const active = p === period;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  data-testid={`period-${p.replace(/\s+/g, "-").toLowerCase()}`}
                  data-active={active}
                  className={cn(
                    "shrink-0 inline-flex items-center rounded-full px-3 h-8 text-xs font-medium border transition-colors",
                    active
                      ? "bg-sage-deep text-canvas-raised border-transparent"
                      : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                  )}
                >
                  {p}
                </button>
              );
            },
          )}
        </div>

        {/* Highlight tiles */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <HighlightTile
            testId="highlight-top-closer"
            icon={<Trophy className="h-4 w-4 text-gold-deep" />}
            iconBg="bg-gold-soft/60"
            label="Top closer"
            primary={topCloser?.agentName ?? "—"}
            secondary={topCloser ? `${topCloser.deals} deals closed` : ""}
          />
          <HighlightTile
            testId="highlight-most-sales"
            icon={<TrendingUp className="h-4 w-4 text-sage-deep" />}
            iconBg="bg-sage-soft/60"
            label="Most sales"
            primary={mostSalesRow?.agentName ?? "—"}
            secondary={
              mostSalesRow ? formatPHPCompact(mostSalesRow.sales) : ""
            }
          />
          <HighlightTile
            testId="highlight-healthiest"
            icon={<Heart className="h-4 w-4 text-terracotta-deep" />}
            iconBg="bg-terracotta-soft/60"
            label="Healthiest score"
            primary={healthiest?.agentName ?? "—"}
            secondary={
              healthiest ? `${healthiest.healthScore} · ${healthiest.healthLabel}` : ""
            }
          />
        </section>

        {/* Full table */}
        <Card data-testid="leaderboard-table-card" className="!p-5">
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
            <span className="text-xs text-ink-subtle">
              {sortedRows.length} {role === "Broker" ? "team members" : "network agents"}
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table
              data-testid="leaderboard-table"
              className="w-full text-sm"
            >
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ink-subtle border-b border-line">
                  <th className="font-medium py-2.5 pr-3 w-10">Rank</th>
                  <th className="font-medium py-2.5 pr-3">
                    <SortButton
                      label="Agent"
                      active={sortCol === "name"}
                      dir={sortDir}
                      onClick={() => handleSort("name")}
                    />
                  </th>
                  <th className="font-medium py-2.5 px-3 text-right">
                    <SortButton
                      label="Deals"
                      active={sortCol === "deals"}
                      dir={sortDir}
                      onClick={() => handleSort("deals")}
                    />
                  </th>
                  <th className="font-medium py-2.5 px-3 text-right">
                    <SortButton
                      label="Sales"
                      active={sortCol === "sales"}
                      dir={sortDir}
                      onClick={() => handleSort("sales")}
                    />
                  </th>
                  <th className="font-medium py-2.5 px-3 text-right">
                    <SortButton
                      label="Health"
                      active={sortCol === "health"}
                      dir={sortDir}
                      onClick={() => handleSort("health")}
                    />
                  </th>
                  <th className="font-medium py-2.5 px-3 hidden sm:table-cell">
                    Recent activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {sortedRows.map((r, i) => (
                  <tr
                    key={r.agentId}
                    data-testid={`leaderboard-row-${r.agentId}`}
                    data-rank={i + 1}
                    className="hover:bg-canvas-sunken/30"
                  >
                    <td className="py-3 pr-3">
                      <span className="font-display text-sm font-semibold text-ink-subtle">
                        #{i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-medium text-ink-muted">
                            {initials(r.agentName)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            {r.agentName}
                          </p>
                          <StatusBadge
                            variant={healthBadgeVariant(r.healthLabel)}
                          >
                            {r.healthLabel}
                          </StatusBadge>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-ink">
                      {r.deals}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-ink">
                      {formatPHPCompact(r.sales)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-ink">
                      {r.healthScore}
                    </td>
                    <td className="py-3 px-3 text-xs text-ink-muted hidden sm:table-cell">
                      {r.recentSiteVisits} visits · {r.recentLeadsContacted} leads
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function HighlightTile({
  testId,
  icon,
  iconBg,
  label,
  primary,
  secondary,
}: {
  testId: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  primary: string;
  secondary: string;
}) {
  return (
    <Card data-testid={testId} className="!p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            iconBg,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
            {label}
          </p>
          <p className="text-sm font-medium text-ink truncate">{primary}</p>
          <p className="text-xs text-ink-muted truncate">{secondary}</p>
        </div>
      </div>
    </Card>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] uppercase tracking-wider font-medium",
        active ? "text-ink" : "text-ink-subtle hover:text-ink",
      )}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
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
