"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Users,
  ChevronRight,
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
import {
  resolveTeamAgentIds,
  computeLeaderboard,
} from "@/lib/logic/managerDashboardDerivations";
import { formatPHPCompact } from "@/lib/format";
import type { AgentStatusLabel, AgentSpecialization } from "@/lib/types";

const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

interface Props {
  role: "Broker" | "Realtor";
}

/**
 * Agents module (#29) — parameterized component used by /broker/agents
 * and /realtor/agents. Role-aware data scope: broker direct reports vs
 * realtor transitive network.
 *
 * Each card shows the PRD's full agent metrics: photo placeholder, name,
 * status, health pill, deals / site visits / sales / leads contacted.
 */
export function AgentsModule({ role }: Props) {
  const userId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const manager = seedUsers.find((u) => u.id === userId);
  if (!manager) return null;
  const roleSlug = role.toLowerCase() as "broker" | "realtor";

  const teamIds = resolveTeamAgentIds(manager, seedUsers);
  const rows = computeLeaderboard({
    manager,
    allUsers: seedUsers,
    deals: seedDeals,
    siteVisits: seedSiteVisits,
    leads: seedLeads,
    referenceIso: SEED_REFERENCE_ISO,
  });

  // Search + filter state
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const statusFilters: Array<AgentStatusLabel | "All"> = [
    "All",
    "Top Performer",
    "Active",
    "Needs Coaching",
    "Low Activity",
  ];

  const filtered = rows.filter((r) => {
    if (
      query &&
      !r.agentName.toLowerCase().includes(query.toLowerCase())
    )
      return false;
    if (statusFilter !== "All" && r.healthLabel !== statusFilter) return false;
    return true;
  });

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
              data-testid={`${roleSlug}-agents-title`}
              className="font-display text-2xl font-semibold text-ink"
            >
              Agents
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {role === "Broker"
                ? `${teamIds.size} agents on your team.`
                : `${teamIds.size} agents across your network.`}
            </p>
          </div>
        </header>

        {/* Search + filter */}
        <Card data-testid="agents-search-card" className="!p-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-ink-subtle shrink-0 ml-1.5" />
            <input
              data-testid="agents-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents by name..."
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
            <button
              data-testid="agents-filter-button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-canvas-sunken/50 hover:bg-canvas-sunken text-ink-muted h-8 px-2.5 text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
          <div
            data-testid="agents-status-chips"
            className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pt-3 pb-1 mt-1 scrollbar-none border-t border-line-soft"
          >
            {statusFilters.map((s) => {
              const active = s === statusFilter;
              const count =
                s === "All"
                  ? rows.length
                  : rows.filter((r) => r.healthLabel === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  data-testid={`status-chip-${s.replace(/\s+/g, "-").toLowerCase()}`}
                  data-active={active}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-7 text-xs font-medium border transition-colors",
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
        </Card>

        {/* Agent cards */}
        <ul
          data-testid="agents-list"
          data-team-size={teamIds.size}
          className="space-y-3"
        >
          {filtered.length === 0 ? (
            <li className="text-sm text-ink-muted italic text-center py-6">
              No agents match this filter.
            </li>
          ) : (
            filtered.map((r) => {
              const agent = seedUsers.find((u) => u.id === r.agentId);
              const specs = agent?.specializations ?? [];
              return (
                <li key={r.agentId}>
                  <Link
                    href={`/${roleSlug}/agents/${r.agentId}`}
                    data-testid={`agent-card-${r.agentId}`}
                    className="block rounded-2xl border border-line bg-canvas-raised p-4 hover:border-gold/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-ink-muted">
                          {initials(r.agentName)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
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
                          <div className="text-right shrink-0">
                            <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                              Health
                            </p>
                            <p className="font-display text-base font-semibold text-ink leading-none tabular-nums">
                              {r.healthScore}
                            </p>
                          </div>
                        </div>
                        {/* Recent activity row */}
                        <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
                          <ActivityCell label="Deals" value={String(r.deals)} />
                          <ActivityCell
                            label="Visits"
                            value={String(r.recentSiteVisits)}
                          />
                          <ActivityCell
                            label="Leads"
                            value={String(r.recentLeadsContacted)}
                          />
                          <ActivityCell
                            label="Sales"
                            value={formatPHPCompact(r.sales)}
                          />
                        </div>
                        {/* Specializations chips */}
                        {specs.length > 0 ? (
                          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                            {specs.slice(0, 4).map((s: AgentSpecialization) => (
                              <span
                                key={s}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-canvas-sunken/50 text-ink-muted"
                              >
                                {s}
                              </span>
                            ))}
                            {specs.length > 4 ? (
                              <span className="text-[10px] text-ink-subtle">
                                +{specs.length - 4}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0 mt-1" />
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </AppShell>
  );
}

function ActivityCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-ink-subtle font-medium">
        {label}
      </p>
      <p className="font-display text-sm font-semibold text-ink leading-none tabular-nums mt-0.5">
        {value}
      </p>
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

function healthBadgeVariant(label: string) {
  switch (label) {
    case "Top Performer":
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
