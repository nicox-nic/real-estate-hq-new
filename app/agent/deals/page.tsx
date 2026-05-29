"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedDeals,
  seedUsers,
} from "@/lib/data";
import { DEAL_STAGES, type DealStage, type Deal } from "@/lib/types";
import { useCurrentRole } from "@/lib/useCurrentRole";
import {
  STAGE_PHASES,
  phaseFor,
  groupDealsByStage,
  dealsForUser,
  stageIndex,
  type StagePhase,
} from "@/lib/logic/dealStageDerivations";
import { formatPHPCompact } from "@/lib/format";

/**
 * Deals Pipeline (#25) — list / timeline / kanban.
 *
 * Layout decisions:
 *
 *   Mobile (< lg): vertical timeline — one card per stage, deals nested
 *     under each stage card. Calm, scrollable, mobile-first.
 *
 *   Desktop (>= lg): horizontal kanban with COLLAPSIBLE PHASE GROUPS
 *     (option C from the framing). The 9 stages naturally cluster into 3
 *     phases (Discovery / Qualification / Closing), and at any one time
 *     the agent is mostly focused on a few phases. Collapsing the others
 *     keeps the screen calm and information-dense for the focused phase.
 *
 *     Rationale for choosing C over A (fixed narrow columns) or B (sticky
 *     first+last with middle scroll):
 *       - A produces unreadably narrow columns at 9 stages on a 13" screen.
 *       - B preserves first-and-last as anchors but loses the middle
 *         in horizontal scroll, hiding the deals most likely to need
 *         attention (the active middle of the pipeline).
 *       - C lets the agent collapse the early stages (Discovery — already
 *         in motion, nothing urgent) and focus the screen on Qualification
 *         + Closing where document gates and stage advancement happen.
 *         Matches the calm-UX discipline: hide what's not active.
 *
 *     All 3 phases visible by default; collapse is per-phase user toggle.
 */
export default function DealsPipelinePage() {
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  // Role-aware filter
  const allUsers = seedUsers;
  const visible = React.useMemo(() => {
    if (!user) return [];
    return dealsForUser(seedDeals, user, allUsers);
  }, [user, allUsers]);

  const dealsByStage = React.useMemo(
    () => groupDealsByStage(visible),
    [visible],
  );

  // Phase collapse state — Discovery collapsed by default to focus on
  // active stages.
  const [collapsed, setCollapsed] = React.useState<Set<StagePhase>>(
    new Set(),
  );
  const togglePhase = (phase: StagePhase) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });

  const totalActive = visible.filter(
    (d) =>
      d.stage !== "Commission Released",
  ).length;

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1
              data-testid="pipeline-title"
              className="font-display text-2xl font-semibold text-ink"
            >
              Deals Pipeline
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {visible.length} deals · {totalActive} active across {DEAL_STAGES.length} stages
            </p>
          </div>
        </header>

        {/* Pipeline progress bar */}
        <Card data-testid="pipeline-overview">
          <CardHeader>
            <CardTitle>
              <TrendingUp className="inline-block h-4 w-4 mr-1 -mt-0.5 text-sage-deep" />
              Stage distribution
            </CardTitle>
          </CardHeader>
          <ul className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {DEAL_STAGES.map((stage, i) => {
              const count = dealsByStage.get(stage)?.length ?? 0;
              return (
                <li
                  key={stage}
                  data-testid={`pipeline-stage-cell-${i}`}
                  className={cn(
                    "rounded-lg border p-1.5 text-center",
                    count > 0
                      ? "border-gold/40 bg-gold-soft/40"
                      : "border-line bg-canvas-sunken/30",
                  )}
                >
                  <p className="text-[10px] text-ink-subtle font-medium uppercase tracking-wider">
                    {i + 1}
                  </p>
                  <p
                    className={cn(
                      "font-display text-lg font-semibold",
                      count > 0 ? "text-gold-deep" : "text-ink-subtle",
                    )}
                  >
                    {count}
                  </p>
                  <p className="text-[9px] text-ink-muted line-clamp-2 leading-tight">
                    {shortStageLabel(stage)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Mobile timeline (default) / Desktop kanban (lg+) */}
        <div className="block lg:hidden space-y-3" data-testid="pipeline-timeline">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = dealsByStage.get(stage) ?? [];
            return (
              <StageRow
                key={stage}
                stage={stage}
                deals={stageDeals}
                roleSlug={roleSlug}
              />
            );
          })}
        </div>

        <div
          className="hidden lg:block"
          data-testid="pipeline-kanban"
        >
          <div className="space-y-4">
            {(Object.keys(STAGE_PHASES) as StagePhase[]).map((phase) => {
              const isCollapsed = collapsed.has(phase);
              const phaseStages = STAGE_PHASES[phase];
              const phaseDealCount = phaseStages.reduce(
                (sum, s) => sum + (dealsByStage.get(s)?.length ?? 0),
                0,
              );
              return (
                <section
                  key={phase}
                  data-testid={`pipeline-phase-${phase.toLowerCase()}`}
                  data-collapsed={isCollapsed}
                  className="rounded-2xl border border-line bg-canvas-raised"
                >
                  <button
                    onClick={() => togglePhase(phase)}
                    className="w-full flex items-center justify-between p-4 hover:bg-canvas-sunken/30 rounded-2xl transition-colors"
                    data-testid={`phase-toggle-${phase.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-ink-subtle transition-transform",
                          isCollapsed ? "-rotate-90" : "",
                        )}
                      />
                      <h2 className="font-display text-lg font-semibold text-ink">
                        {phase}
                      </h2>
                      <span className="text-xs text-ink-subtle">
                        ({phaseDealCount} {phaseDealCount === 1 ? "deal" : "deals"})
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-ink-subtle">
                      Stages {stageIndex(phaseStages[0]!) + 1}–
                      {stageIndex(phaseStages[phaseStages.length - 1]!) + 1}
                    </span>
                  </button>
                  {!isCollapsed ? (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-3">
                        {phaseStages.map((stage) => {
                          const stageDeals = dealsByStage.get(stage) ?? [];
                          return (
                            <KanbanColumn
                              key={stage}
                              stage={stage}
                              deals={stageDeals}
                              roleSlug={roleSlug}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StageRow({
  stage,
  deals,
  roleSlug,
}: {
  stage: DealStage;
  deals: Deal[];
  roleSlug: string;
}) {
  const idx = stageIndex(stage);
  return (
    <Card
      data-testid={`timeline-stage-${stage.replace(/\s+/g, "-").toLowerCase()}`}
      data-stage-index={idx}
      data-deal-count={deals.length}
    >
      <CardHeader>
        <CardTitle>
          <span className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mr-2">
            {idx + 1}
          </span>
          {stage}
        </CardTitle>
        <span className="text-xs text-ink-subtle">
          {deals.length} {deals.length === 1 ? "deal" : "deals"}
        </span>
      </CardHeader>
      {deals.length === 0 ? (
        <p className="text-xs text-ink-subtle py-2 text-center italic">
          No deals at this stage.
        </p>
      ) : (
        <ul className="space-y-2">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} roleSlug={roleSlug} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function KanbanColumn({
  stage,
  deals,
  roleSlug,
}: {
  stage: DealStage;
  deals: Deal[];
  roleSlug: string;
}) {
  const idx = stageIndex(stage);
  return (
    <div
      data-testid={`kanban-column-${stage.replace(/\s+/g, "-").toLowerCase()}`}
      data-stage-index={idx}
      data-deal-count={deals.length}
      className="rounded-xl bg-canvas-sunken/40 p-2.5 min-h-[12rem]"
    >
      <header className="mb-2 px-1">
        <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
          {idx + 1} · {deals.length}
        </p>
        <p className="text-xs font-medium text-ink truncate">{stage}</p>
      </header>
      {deals.length === 0 ? (
        <div className="text-[11px] text-ink-subtle text-center py-4 italic">
          —
        </div>
      ) : (
        <ul className="space-y-2">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} roleSlug={roleSlug} compact />
          ))}
        </ul>
      )}
    </div>
  );
}

function DealCard({
  deal,
  roleSlug,
  compact,
}: {
  deal: Deal;
  roleSlug: string;
  compact?: boolean;
}) {
  return (
    <li>
      <Link
        href={`/${roleSlug}/deals/${deal.id}`}
        data-testid={`deal-card-${deal.id}`}
        data-stage={deal.stage}
        className={cn(
          "block rounded-xl border border-line bg-canvas-raised p-2.5 hover:border-gold/40 transition-colors",
          compact ? "" : "",
        )}
      >
        <p className="text-sm font-medium text-ink truncate">
          {deal.buyerName}
        </p>
        <p className="text-[11px] text-ink-muted truncate">
          {deal.listingTitle}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="font-display text-xs font-semibold text-ink tabular-nums">
            {formatPHPCompact(deal.contractPrice)}
          </span>
          {(deal.missingDocuments?.length ?? 0) > 0 ? (
            <StatusBadge variant="warm">
              {deal.missingDocuments?.length ?? 0} docs
            </StatusBadge>
          ) : (
            <Sparkles className="h-3 w-3 text-sage-deep" />
          )}
        </div>
      </Link>
    </li>
  );
}

function shortStageLabel(stage: DealStage): string {
  switch (stage) {
    case "Lead Generated":
      return "Lead Gen";
    case "Buyer Qualified":
      return "Qualified";
    case "Site Visit Done":
      return "Site Visit";
    case "Reservation Paid":
      return "Reserved";
    case "Documents Submitted":
      return "Docs Sub.";
    case "Financing Approved":
      return "Financing";
    case "Contract Signed":
      return "Contract";
    case "Commission Processing":
      return "Comm. Proc.";
    case "Commission Released":
      return "Released";
  }
}
