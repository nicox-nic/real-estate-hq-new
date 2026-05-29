"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Briefcase,
  CalendarCheck,
  Users,
  Coins,
  ChevronRight,
  Mail,
  Phone,
  AlertCircle,
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
  seedCommissions,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
} from "@/lib/data";
import {
  buildAgentHealthInputs,
  resolveTeamAgentIds,
} from "@/lib/logic/managerDashboardDerivations";
import { scoreAgentHealth } from "@/lib/logic/agentHealth";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";
import type {
  AgentSpecialization,
  CommissionStatus,
  DealStage,
} from "@/lib/types";

interface Props {
  role: "Broker" | "Realtor";
  agentId: string;
}

/**
 * Agent Profile (#30) — parameterized component used by both
 * /broker/agents/[agentId] and /realtor/agents/[agentId].
 *
 * Engine-honest health breakdown: each of the 6 components shows
 * raw% × weight% = +contribution; the sum equals the agent's overall
 * health score. No seeded health values; engine speaks (Marisol lesson).
 *
 * AI Coaching banner is rule-driven by the WEAKEST health component:
 * the lowest-contribution row becomes the coaching focus. Transparent
 * reasoning ("rule: weakest-component-is-follow-ups") surfaced in UI
 * via the data-driven-by attribute for verify lock.
 */
export function AgentProfile({ role, agentId }: Props) {
  const managerId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const manager = seedUsers.find((u) => u.id === managerId);
  const agent = seedUsers.find((u) => u.id === agentId);
  if (!manager || !agent) notFound();

  // Role-aware scope: manager must own this agent
  const teamIds = resolveTeamAgentIds(manager, seedUsers);
  if (!teamIds.has(agentId)) notFound();

  const roleSlug = role.toLowerCase() as "broker" | "realtor";

  // Engine-honest health breakdown
  const healthInputs = buildAgentHealthInputs(
    agentId,
    seedDeals,
    seedSiteVisits,
    seedLeads,
  );
  const health = scoreAgentHealth(healthInputs);

  // KPIs
  const agentDeals = seedDeals.filter((d) => d.agentId === agentId);
  const closedDeals = agentDeals.filter(
    (d) =>
      d.stage === "Contract Signed" ||
      d.stage === "Commission Processing" ||
      d.stage === "Commission Released",
  );
  const inFlightDeals = agentDeals.filter(
    (d) =>
      d.stage !== "Lead Generated" &&
      d.stage !== "Buyer Qualified" &&
      d.stage !== "Contract Signed" &&
      d.stage !== "Commission Processing" &&
      d.stage !== "Commission Released",
  );
  const totalSales = closedDeals.reduce((s, d) => s + d.contractPrice, 0);
  const agentSiteVisits = seedSiteVisits.filter(
    (sv) => sv.agentId === agentId,
  );
  const agentLeads = seedLeads.filter((l) => l.assignedAgentId === agentId);
  const agentCommissions = seedCommissions.filter(
    (c) => c.agentId === agentId,
  );

  // AI Coaching: weakest health component
  const weakestComponent = [...health.breakdown].sort(
    (a, b) => a.contribution - b.contribution,
  )[0];
  const coachingMessage = generateCoachingMessage(
    agent.fullName,
    weakestComponent,
  );

  // Commissions by status
  const commissionsByStatus = bucketCommissions(agentCommissions);

  // Leads by temperature (use seedScoreCategory as proxy)
  const leadsByTemp = bucketLeadsByTemperature(agentLeads);

  return (
    <AppShell
      role={role}
      userName={manager.fullName}
      userSubtitle={manager.companyName ?? role}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={`/${roleSlug}/agents`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>

        {/* Hero */}
        <Card
          surface="raised"
          data-testid="agent-profile-hero"
          className="!p-5"
        >
          <div className="flex items-start gap-3 flex-wrap">
            <div className="h-16 w-16 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-ink-muted">
                {initials(agent.fullName)}
              </span>
            </div>
            <div className="flex-1 min-w-[12rem]">
              <h1
                data-testid="agent-name"
                className="font-display text-xl sm:text-2xl font-semibold text-ink"
              >
                {agent.fullName}
              </h1>
              <p className="text-sm text-ink-muted">
                {agent.role} · {agent.companyName ?? "Independent"}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 flex-wrap">
                <StatusBadge variant={healthBadgeVariant(health.label)}>
                  {health.label}
                </StatusBadge>
                <span className="text-xs text-ink-subtle">
                  Health score:{" "}
                  <span className="text-ink font-medium tabular-nums">
                    {health.total}
                  </span>
                </span>
              </div>
              {agent.specializations && agent.specializations.length > 0 ? (
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {agent.specializations.map((s: AgentSpecialization) => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-canvas-sunken/50 text-ink-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                aria-label="Message agent"
                className="h-9 w-9 rounded-xl bg-canvas-sunken/40 hover:bg-canvas-sunken text-ink-muted inline-flex items-center justify-center"
              >
                <Mail className="h-4 w-4" />
              </button>
              <button
                aria-label="Call agent"
                className="h-9 w-9 rounded-xl bg-canvas-sunken/40 hover:bg-canvas-sunken text-ink-muted inline-flex items-center justify-center"
              >
                <Phone className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* AI Coaching banner */}
        <Card
          data-testid="ai-coaching-banner"
          data-driven-by={weakestComponent?.label}
          className="!p-4 bg-sage-soft/30 border-sage-deep/15"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-sage-soft flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-sage-deep" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-sage-deep font-medium">
                AI Coaching Recommendation
              </p>
              <p
                data-testid="coaching-message"
                className="text-sm text-ink mt-0.5 leading-relaxed"
              >
                {coachingMessage}
              </p>
              {weakestComponent ? (
                <p className="text-[11px] text-ink-subtle mt-1">
                  Driven by weakest health component:{" "}
                  <span className="font-medium text-ink-muted">
                    {weakestComponent.label}
                  </span>{" "}
                  · {Math.round(weakestComponent.achievement)}% achieved
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        {/* 4 KPI tiles */}
        <section
          data-testid="agent-kpi-tiles"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <ProfileKPI
            testId="kpi-deals-closed"
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Deals Closed"
            value={String(closedDeals.length)}
          />
          <ProfileKPI
            testId="kpi-site-visits"
            icon={<CalendarCheck className="h-3.5 w-3.5" />}
            label="Site Visits"
            value={String(agentSiteVisits.length)}
          />
          <ProfileKPI
            testId="kpi-active-leads"
            icon={<Users className="h-3.5 w-3.5" />}
            label="Active Leads"
            value={String(agentLeads.length)}
          />
          <ProfileKPI
            testId="kpi-total-sales"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Total Sales"
            value={formatPHPCompact(totalSales)}
          />
        </section>

        {/* Full Health Breakdown */}
        <Card data-testid="health-breakdown-card" className="!p-5">
          <CardHeader>
            <CardTitle>Health Score Breakdown</CardTitle>
            <span
              data-testid="health-total"
              className="text-xs text-ink-subtle tabular-nums"
            >
              Total: <span className="font-medium text-ink">{health.total}</span>
            </span>
          </CardHeader>
          <ul
            data-testid="health-components"
            data-component-count={health.breakdown.length}
            className="space-y-3"
          >
            {health.breakdown.map((item) => {
              const isWeakest =
                weakestComponent?.label === item.label;
              return (
                <li
                  key={item.label}
                  data-testid={`health-row-${slugify(item.label)}`}
                  data-achievement={item.achievement}
                  data-weight={item.weight}
                  data-contribution={item.contribution}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="inline-flex items-center gap-1.5 min-w-0">
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isWeakest ? "text-terracotta-deep" : "text-ink",
                        )}
                      >
                        {item.label}
                      </span>
                      {isWeakest ? (
                        <AlertCircle className="h-3 w-3 text-terracotta-deep shrink-0" />
                      ) : null}
                    </div>
                    <span className="text-xs text-ink-subtle tabular-nums shrink-0">
                      {Math.round(item.achievement)}% × {Math.round(item.weight * 100)}% ={" "}
                      <span className="text-ink font-medium">
                        +{Math.round(item.contribution)}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-canvas-sunken overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isWeakest ? "bg-terracotta-deep" : "bg-sage-deep",
                      )}
                      style={{ width: `${item.achievement}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Deals in flight + Commissions + Leads-by-temperature row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Deals in flight */}
          <Card data-testid="deals-in-flight-card" className="!p-4">
            <CardHeader>
              <CardTitle>Deals in Flight</CardTitle>
              <span className="text-xs text-ink-subtle">
                {inFlightDeals.length}
              </span>
            </CardHeader>
            {inFlightDeals.length === 0 ? (
              <p className="text-xs text-ink-muted italic text-center py-3">
                No deals currently in flight.
              </p>
            ) : (
              <ul className="space-y-2">
                {inFlightDeals.slice(0, 4).map((d) => (
                  <li
                    key={d.id}
                    data-testid={`flight-deal-${d.id}`}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-ink font-medium truncate">
                        {d.listingTitle}
                      </p>
                      <p className="text-ink-subtle truncate">
                        {d.buyerName}
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-canvas-sunken/50 text-ink-muted shrink-0">
                      {d.stage}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Commissions by status */}
          <Card data-testid="commissions-by-status-card" className="!p-4">
            <CardHeader>
              <CardTitle>Commissions by Status</CardTitle>
            </CardHeader>
            <ul className="space-y-2 text-xs">
              {Array.from(commissionsByStatus.entries()).map(
                ([status, amt]) => (
                  <li
                    key={status}
                    data-testid={`commission-status-${slugify(status)}`}
                    className="flex items-center justify-between"
                  >
                    <span className="text-ink-muted">{status}</span>
                    <span className="tabular-nums font-medium text-ink">
                      {formatPHPCompact(amt)}
                    </span>
                  </li>
                ),
              )}
              {commissionsByStatus.size === 0 ? (
                <li className="text-ink-subtle italic text-center py-2">
                  No commission activity yet.
                </li>
              ) : null}
            </ul>
          </Card>

          {/* Leads by temperature */}
          <Card data-testid="leads-by-temp-card" className="!p-4">
            <CardHeader>
              <CardTitle>Leads by Temperature</CardTitle>
            </CardHeader>
            <ul className="space-y-2 text-xs">
              {Array.from(leadsByTemp.entries()).map(([temp, count]) => (
                <li
                  key={temp}
                  data-testid={`leads-temp-${slugify(temp)}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-ink-muted">{temp}</span>
                  <span className="tabular-nums font-medium text-ink">
                    {count}
                  </span>
                </li>
              ))}
              {leadsByTemp.size === 0 ? (
                <li className="text-ink-subtle italic text-center py-2">
                  No active leads.
                </li>
              ) : null}
            </ul>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

interface BreakdownItem {
  label: string;
  weight: number;
  achievement: number;
  contribution: number;
}

function generateCoachingMessage(
  agentName: string,
  weakest: BreakdownItem | undefined,
): string {
  const first = agentName.split(/\s+/)[0] ?? agentName;
  if (!weakest) {
    return `${first} is performing across the board. Keep the momentum.`;
  }
  const label = weakest.label.toLowerCase();
  // Rule-driven coaching templates per weakest component
  switch (weakest.label) {
    case "New leads contacted":
      return `${first} has unattended leads. Recommend a daily 30-minute lead-outreach block to lift first-response time.`;
    case "Follow-ups completed":
      return `${first}'s follow-up rate is below target. Recommend sending the financing objection script and the 72-hour follow-up template.`;
    case "Listings shared":
      return `${first} is under-sharing the active inventory. Recommend the weekly listing-distribution batch via Smart Link.`;
    case "Site visits booked":
      return `${first} is converting fewer leads to site visits. Recommend the qualification-call template before site-visit offer.`;
    case "Deals moved forward":
      return `${first} has deals stalling mid-pipeline. Recommend a stage-by-stage review of in-flight deals this week.`;
    case "Closed deals":
      return `${first}'s closing rate is below target. Recommend pairing with a top closer for the next two for-closing deals.`;
    default:
      return `${first}'s weakest area is ${label}. Recommend a focused 1:1 coaching session.`;
  }
}

function bucketCommissions(commissions: typeof seedCommissions): Map<CommissionStatus, number> {
  const m = new Map<CommissionStatus, number>();
  for (const c of commissions) {
    m.set(c.status, (m.get(c.status) ?? 0) + c.agentAmount);
  }
  return m;
}

function bucketLeadsByTemperature(leads: typeof seedLeads): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of leads) {
    const t = l.seedScoreCategory;
    m.set(t, (m.get(t) ?? 0) + 1);
  }
  return m;
}

function ProfileKPI({
  testId,
  icon,
  label,
  value,
}: {
  testId: string;
  icon: React.ReactNode;
  label: string;
  value: string;
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
