"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Plus,
  Users,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  seedUsers,
  seedBonusCampaigns,
  seedDeals,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
} from "@/lib/data";
import { resolveTeamAgentIds } from "@/lib/logic/managerDashboardDerivations";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";
import type { BonusCampaign } from "@/lib/types";

interface Props {
  role: "Broker" | "Realtor";
}

const SEED_REFERENCE_DATE = "2025-05-29";

/**
 * Awards & Bonuses (#32) — parameterized component for both
 * /broker/campaigns and /realtor/campaigns.
 *
 * Composes with the EXISTING BonusCampaign entity (no new entity).
 * The bonus-001 "May Closing Sprint" composes with 7A's dashboard
 * sprint card — same campaign, same name, full detail page. Verify
 * locks the cross-surface invariant.
 *
 * Sections:
 *   - Active campaigns (endDate >= today): per-agent progress
 *   - Past campaigns (endDate < today): final results
 *   - Create campaign sheet (compose: name + goal + reward + dates)
 */
export function AwardsCampaigns({ role }: Props) {
  const userId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const manager = seedUsers.find((u) => u.id === userId);
  if (!manager) return null;
  const roleSlug = role.toLowerCase() as "broker" | "realtor";

  const teamIds = resolveTeamAgentIds(manager, seedUsers);

  // Scope campaigns to those authored by this manager
  // (broker sees their own; realtor sees those authored by them)
  const myCampaigns = seedBonusCampaigns.filter((c) =>
    role === "Broker" ? c.authorId === userId : true,
  );

  const active = myCampaigns.filter(
    (c) => c.endDate >= SEED_REFERENCE_DATE,
  );
  const past = myCampaigns.filter(
    (c) => c.endDate < SEED_REFERENCE_DATE,
  );

  const [showCreate, setShowCreate] = React.useState(false);

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
              data-testid="campaigns-title"
              className="font-display text-2xl font-semibold text-ink"
            >
              Awards & Bonuses
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              Drive performance with goal-based campaigns.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            data-testid="create-campaign-cta"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </header>

        {/* Active campaigns */}
        <section data-testid="active-campaigns-section" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-sage-deep" />
              Active Campaigns
            </h2>
            <span className="text-xs text-ink-subtle">
              {active.length} {active.length === 1 ? "campaign" : "campaigns"}
            </span>
          </header>
          {active.length === 0 ? (
            <Card className="!p-5 text-center">
              <p className="text-sm text-ink-muted italic">
                No active campaigns. Create one to drive team performance.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {active.map((c) => (
                <CampaignCard key={c.id} campaign={c} isActive />
              ))}
            </ul>
          )}
        </section>

        {/* Past campaigns */}
        <section data-testid="past-campaigns-section" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink inline-flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-gold-deep" />
              Past Campaigns
            </h2>
            <span className="text-xs text-ink-subtle">
              {past.length} {past.length === 1 ? "campaign" : "campaigns"}
            </span>
          </header>
          {past.length === 0 ? (
            <Card className="!p-5 text-center">
              <p className="text-sm text-ink-muted italic">
                No past campaigns yet.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {past.map((c) => (
                <CampaignCard key={c.id} campaign={c} isActive={false} />
              ))}
            </ul>
          )}
        </section>

        {/* Create sheet */}
        {showCreate ? (
          <div
            data-testid="create-campaign-sheet"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-canvas-raised w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl"
            >
              <header className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-ink">
                  New Campaign
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-ink-subtle hover:text-ink text-sm"
                >
                  Close
                </button>
              </header>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <CreateField label="Campaign name" placeholder="Q3 Listing Push" />
                <CreateField
                  label="Goal"
                  placeholder="Share 20+ listings per agent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <CreateField label="Reward (₱)" placeholder="50000" type="number" />
                  <CreateField label="Target" placeholder="20" type="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CreateField label="Start date" type="date" />
                  <CreateField label="End date" type="date" />
                </div>
                <Button
                  variant="primary"
                  data-testid="confirm-create-campaign"
                  className="w-full"
                >
                  Create Campaign
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function CampaignCard({
  campaign,
  isActive,
}: {
  campaign: BonusCampaign;
  isActive: boolean;
}) {
  // Per-agent progress: for the May Closing Sprint (sales-target type),
  // each agent's contribution comes from their closed deals.
  // For Q2 Developer Partnership Push (listings-shared type), this is
  // illustrative since we don't track shares-per-agent yet — render the
  // engine value with honest labeling.
  const isSalesSprint =
    campaign.name.includes("Closing") || campaign.name.includes("Sales");

  // Compute per-agent progress from underlying deals (for sales sprints)
  const perAgentProgress = campaign.eligibleAgentIds
    .map((agentId) => {
      const agent = seedUsers.find((u) => u.id === agentId);
      const agentDeals = seedDeals.filter(
        (d) =>
          d.agentId === agentId &&
          (d.stage === "Contract Signed" ||
            d.stage === "Commission Processing" ||
            d.stage === "Commission Released"),
      );
      const sales = agentDeals.reduce((s, d) => s + d.contractPrice, 0);
      return {
        agentId,
        agentName: agent?.fullName ?? agentId,
        sales,
        dealsCount: agentDeals.length,
      };
    })
    .sort((a, b) => b.sales - a.sales);

  // Podium = top 3 agents by sales
  const podium = perAgentProgress.slice(0, 3);

  return (
    <li>
      <Card
        data-testid={`campaign-card-${campaign.id}`}
        data-active={isActive}
        data-progress-pct={campaign.progressPercent}
        className="!p-5"
      >
        <header className="flex items-start justify-between gap-2 flex-wrap mb-2">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <h3 className="font-display text-base font-semibold text-ink truncate">
                {campaign.name}
              </h3>
              {isActive ? (
                <StatusBadge variant="paid">Active</StatusBadge>
              ) : (
                <StatusBadge variant="neutral">Ended</StatusBadge>
              )}
            </div>
            <p className="text-xs text-ink-muted">{campaign.goal}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
              Reward
            </p>
            <p className="font-display text-base font-semibold text-gold-deep tabular-nums">
              {formatPHPWhole(campaign.rewardAmount)}
            </p>
          </div>
        </header>

        {/* Date row + progress */}
        <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-ink-subtle">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatShortDate(campaign.startDate)} → {formatShortDate(campaign.endDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {campaign.eligibleAgentIds.length} eligible
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
              Team Progress
            </span>
            <span
              data-testid={`campaign-${campaign.id}-progress`}
              className="text-xs tabular-nums font-medium text-ink"
            >
              {campaign.progressPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-canvas-sunken overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isActive ? "bg-sage-deep" : "bg-ink-muted",
              )}
              style={{
                width: `${Math.min(100, campaign.progressPercent)}%`,
              }}
            />
          </div>
        </div>

        {/* Per-agent progress (top 5) */}
        {isSalesSprint && perAgentProgress.length > 0 ? (
          <div
            data-testid={`campaign-${campaign.id}-per-agent`}
            className="mt-3 pt-3 border-t border-line-soft space-y-1.5"
          >
            <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mb-1.5">
              Top Performers
            </p>
            {perAgentProgress.slice(0, 5).map((p, i) => {
              const pct =
                perAgentProgress[0]!.sales > 0
                  ? Math.round((p.sales / perAgentProgress[0]!.sales) * 100)
                  : 0;
              return (
                <div
                  key={p.agentId}
                  data-testid={`campaign-${campaign.id}-agent-${p.agentId}`}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="text-ink-subtle font-medium w-3 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-ink truncate flex-1 min-w-[5rem]">
                    {p.agentName}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-canvas-sunken overflow-hidden max-w-[8rem]">
                    <div
                      className="h-full bg-sage-deep rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-ink-muted shrink-0">
                    {formatPHPCompact(p.sales)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Rewards podium (1st/2nd/3rd) */}
        {campaign.podium ? (
          <div
            data-testid={`campaign-${campaign.id}-podium`}
            className="mt-3 pt-3 border-t border-line-soft grid grid-cols-3 gap-2"
          >
            <PodiumChip
              rank={1}
              amount={campaign.podium.first}
              agentName={podium[0]?.agentName}
            />
            <PodiumChip
              rank={2}
              amount={campaign.podium.second}
              agentName={podium[1]?.agentName}
            />
            <PodiumChip
              rank={3}
              amount={campaign.podium.third}
              agentName={podium[2]?.agentName}
            />
          </div>
        ) : null}
      </Card>
    </li>
  );
}

function PodiumChip({
  rank,
  amount,
  agentName,
}: {
  rank: 1 | 2 | 3;
  amount: number;
  agentName?: string;
}) {
  const bg =
    rank === 1
      ? "bg-gold-soft/40 border-gold/30"
      : rank === 2
      ? "bg-canvas-sunken/40 border-line"
      : "bg-terracotta-soft/30 border-terracotta/20";
  const dotBg =
    rank === 1
      ? "bg-gold-deep text-canvas-raised"
      : rank === 2
      ? "bg-ink-muted text-canvas-raised"
      : "bg-terracotta-deep text-canvas-raised";
  return (
    <div
      data-testid={`podium-rank-${rank}`}
      className={cn("rounded-xl border p-2 text-center", bg)}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-semibold",
          dotBg,
        )}
      >
        {rank}
      </span>
      <p className="font-display text-xs font-semibold text-ink tabular-nums mt-1">
        ₱{(amount / 1000).toFixed(0)}K
      </p>
      <p className="text-[9px] text-ink-subtle truncate mt-0.5">
        {agentName ?? "—"}
      </p>
    </div>
  );
}

function CreateField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg bg-canvas-raised border border-line px-3 h-9 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-gold/60"
      />
    </label>
  );
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
