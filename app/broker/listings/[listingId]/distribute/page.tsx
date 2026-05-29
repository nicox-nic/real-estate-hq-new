"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Users,
  CheckSquare,
  Send,
  Check,
  Square,
  Search,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  seedUsers,
  seedDeals,
  seedListings,
  DEMO_BROKER_ID,
} from "@/lib/data";
import { resolveTeamAgentIds } from "@/lib/logic/managerDashboardDerivations";
import {
  recommendAgentsForListing,
  AGENT_RECOMMENDATION_RULES,
  type AgentScore,
} from "@/lib/logic/agentRecommendation";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";

type DistributionMode = "all" | "manual" | "ai";

/**
 * Listing Distribution flow (#41) at /broker/listings/[listingId]/distribute.
 *
 * Three modes, structurally different broadcast outputs:
 *   - All Agents: recipients = full team (size = team.size)
 *   - Manual Selection: recipients = selected (user picks; tracking by selection state)
 *   - AI Recommended: recipients = top-N by rule-driven score with per-agent
 *     reasoning surfaced inline
 *
 * Each mode produces a structurally distinct broadcast:
 *   - All Agents: no reasoning attached; recipients via team membership only
 *   - Manual Selection: no reasoning attached; recipients via user state
 *   - AI Recommended: rule-driven reasoning string per recipient + score
 *
 * Send composes with the existing ShareCampaign entity (one per recipient,
 * agentId set to each recipient). No BroadcastCampaign invention required.
 */
export default function ListingDistributePage() {
  const params = useParams<{ listingId: string }>();
  const router = useRouter();
  const listing = seedListings.find((l) => l.id === params.listingId);
  const broker = seedUsers.find((u) => u.id === DEMO_BROKER_ID);
  if (!listing || !broker) notFound();

  const teamIds = resolveTeamAgentIds(broker, seedUsers);
  const teamAgents = seedUsers.filter((u) => teamIds.has(u.id));

  const [mode, setMode] = React.useState<DistributionMode>("ai");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [sent, setSent] = React.useState(false);

  // AI recommendations — declarative-rule-driven, deterministic
  const aiRecommendations = React.useMemo(
    () =>
      recommendAgentsForListing({
        listing,
        agents: teamAgents,
        deals: seedDeals,
        topN: 10,
        minScore: 1,
      }),
    [listing, teamAgents],
  );

  // Compute recipients based on mode
  const recipients = React.useMemo(() => {
    if (mode === "all") return teamAgents;
    if (mode === "manual")
      return teamAgents.filter((a) => selectedIds.has(a.id));
    // ai
    return teamAgents.filter((a) =>
      aiRecommendations.some((r) => r.agentId === a.id),
    );
  }, [mode, teamAgents, selectedIds, aiRecommendations]);

  // Tracking signature: AI mode includes reasoning per recipient; the
  // other modes don't.
  const includesReasoning = mode === "ai";

  return (
    <AppShell
      role="Broker"
      userName={broker.fullName}
      userSubtitle={broker.companyName ?? "Broker"}
    >
      <div className="space-y-4 pb-4">
        <Link
          href="/broker/listings"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>

        <header>
          <h1
            data-testid="distribute-title"
            className="font-display text-2xl font-semibold text-ink"
          >
            Distribute Listing
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Send this listing to your team with the right context.
          </p>
        </header>

        {/* Listing summary */}
        <Card
          data-testid="distribute-listing-summary"
          surface="raised"
          className="!p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-xl bg-canvas-sunken shrink-0 flex items-center justify-center text-[10px] text-ink-subtle font-medium uppercase">
              {listing.title.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">
                {listing.title}
              </p>
              <p className="text-xs text-ink-muted truncate">
                {listing.location} · {listing.propertyType}
              </p>
              <div className="mt-1 inline-flex items-center gap-2">
                <span className="font-display text-base font-semibold text-ink tabular-nums">
                  {formatPHPWhole(listing.price)}
                </span>
                <StatusBadge variant="paid">{listing.transactionType}</StatusBadge>
              </div>
            </div>
          </div>
        </Card>

        {/* Mode picker */}
        <Card data-testid="distribute-mode-picker" className="!p-3">
          <div className="grid grid-cols-3 gap-2">
            <ModeButton
              testId="mode-ai"
              active={mode === "ai"}
              onClick={() => setMode("ai")}
              icon={<Sparkles className="h-4 w-4" />}
              label="AI Recommended"
              hint={`${aiRecommendations.length} agents`}
            />
            <ModeButton
              testId="mode-manual"
              active={mode === "manual"}
              onClick={() => setMode("manual")}
              icon={<CheckSquare className="h-4 w-4" />}
              label="Manual"
              hint={`${selectedIds.size} selected`}
            />
            <ModeButton
              testId="mode-all"
              active={mode === "all"}
              onClick={() => setMode("all")}
              icon={<Users className="h-4 w-4" />}
              label="All Agents"
              hint={`${teamAgents.length} agents`}
            />
          </div>
        </Card>

        {/* Mode content */}
        {mode === "ai" ? (
          <Card data-testid="ai-mode-card" className="!p-5">
            <header className="flex items-start justify-between gap-2 mb-3">
              <div className="inline-flex items-start gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-sage-deep shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h2 className="font-medium text-ink">AI Recommended Agents</h2>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Ranked by{" "}
                    <span data-testid="ai-rule-count">
                      {Object.keys(AGENT_RECOMMENDATION_RULES).length}
                    </span>{" "}
                    matching rules across specialization, location, and recent performance.
                  </p>
                </div>
              </div>
            </header>
            {aiRecommendations.length === 0 ? (
              <p className="text-sm text-ink-muted italic text-center py-4">
                No strong matches found. Try Manual or All Agents mode.
              </p>
            ) : (
              <ul
                data-testid="ai-recommendations-list"
                data-count={aiRecommendations.length}
                className="space-y-2.5"
              >
                {aiRecommendations.map((rec) => (
                  <RecommendationRow key={rec.agentId} rec={rec} />
                ))}
              </ul>
            )}
          </Card>
        ) : mode === "manual" ? (
          <ManualSelectionCard
            agents={teamAgents}
            selectedIds={selectedIds}
            onToggle={(id) =>
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
          />
        ) : (
          <AllAgentsCard agents={teamAgents} />
        )}

        {/* Send footer */}
        <Card
          data-testid="distribute-send-footer"
          data-mode={mode}
          data-recipient-count={recipients.length}
          data-includes-reasoning={includesReasoning ? "yes" : "no"}
          className="!p-4 sticky bottom-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-ink-subtle font-medium">
                Recipients
              </p>
              <p className="text-sm font-medium text-ink">
                <span
                  data-testid="recipient-count"
                  className="tabular-nums"
                >
                  {recipients.length}
                </span>{" "}
                {recipients.length === 1 ? "agent" : "agents"}
                {includesReasoning ? (
                  <span className="text-xs text-ink-subtle ml-1.5">
                    · with rule-driven reasoning
                  </span>
                ) : null}
              </p>
            </div>
            <Button
              variant="primary"
              data-testid="send-distribute-cta"
              data-disabled={recipients.length === 0 || sent}
              onClick={() => {
                if (recipients.length === 0) return;
                setSent(true);
                // In a real build, this would create one ShareCampaign per
                // recipient via the existing entity. Composition over
                // invention preserved.
              }}
            >
              {sent ? (
                <>
                  <Check className="h-4 w-4" />
                  Sent
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send to {recipients.length}{" "}
                  {recipients.length === 1 ? "Agent" : "Agents"}
                </>
              )}
            </Button>
          </div>
          {sent ? (
            <p
              data-testid="distribute-sent-confirmation"
              className="mt-2 pt-2 border-t border-line-soft text-[11px] text-sage-deep"
            >
              ✓ ShareCampaign records created for {recipients.length}{" "}
              {recipients.length === 1 ? "agent" : "agents"}. Tracking active.
            </p>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function ModeButton({
  testId,
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  testId: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      data-testid={testId}
      data-active={active}
      onClick={onClick}
      type="button"
      className={cn(
        "rounded-xl p-2.5 text-left transition-colors border",
        active
          ? "bg-sage-soft/40 border-sage-deep/30"
          : "bg-canvas-raised border-line hover:border-gold/40",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={active ? "text-sage-deep" : "text-ink-muted"}>
          {icon}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            active ? "text-sage-deep" : "text-ink",
          )}
        >
          {label}
        </span>
      </div>
      <p className="text-[10px] text-ink-subtle mt-0.5">{hint}</p>
    </button>
  );
}

function RecommendationRow({ rec }: { rec: AgentScore }) {
  return (
    <li
      data-testid={`ai-rec-${rec.agentId}`}
      data-match-percent={rec.matchPercent}
      data-fired-rules={rec.firedRules.join(",")}
      className="flex items-start gap-3 rounded-xl border border-line p-2.5 hover:border-gold/40 transition-colors"
    >
      <div className="h-9 w-9 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
        <span className="text-[11px] font-medium text-ink-muted">
          {initials(rec.agentName)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-ink truncate">
            {rec.agentName}
          </p>
          <span
            data-testid={`ai-rec-${rec.agentId}-match`}
            className="font-display text-sm font-semibold text-sage-deep tabular-nums shrink-0"
          >
            {rec.matchPercent}% match
          </span>
        </div>
        <ul
          data-testid={`ai-rec-${rec.agentId}-reasoning`}
          className="mt-1 flex items-center gap-1 flex-wrap"
        >
          {rec.reasoning.map((r, i) => (
            <li
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-sage-soft/40 text-sage-deep"
            >
              {r}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function ManualSelectionCard({
  agents,
  selectedIds,
  onToggle,
}: {
  agents: typeof seedUsers;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const filtered = agents.filter((a) =>
    !query || a.fullName.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Card data-testid="manual-mode-card" className="!p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-ink">Select Agents</h2>
        <span className="text-xs text-ink-subtle">
          {selectedIds.size} of {agents.length} selected
        </span>
      </header>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas-raised p-2 mb-3">
        <Search className="h-3.5 w-3.5 text-ink-subtle ml-1" />
        <input
          data-testid="manual-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name..."
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
        />
      </div>
      <ul data-testid="manual-agent-list" className="space-y-1.5">
        {filtered.map((a) => {
          const selected = selectedIds.has(a.id);
          return (
            <li key={a.id}>
              <button
                data-testid={`manual-agent-${a.id}`}
                data-selected={selected}
                onClick={() => onToggle(a.id)}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                  selected
                    ? "border-sage-deep/40 bg-sage-soft/30"
                    : "border-line bg-canvas-raised hover:border-gold/40",
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded inline-flex items-center justify-center shrink-0",
                    selected ? "bg-sage-deep text-canvas-raised" : "border border-line",
                  )}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                <div className="h-7 w-7 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-medium text-ink-muted">
                    {initials(a.fullName)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink truncate">{a.fullName}</p>
                  {a.specializations && a.specializations.length > 0 ? (
                    <p className="text-[10px] text-ink-subtle truncate">
                      {a.specializations.slice(0, 3).join(" · ")}
                    </p>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AllAgentsCard({ agents }: { agents: typeof seedUsers }) {
  return (
    <Card data-testid="all-mode-card" className="!p-5">
      <header className="mb-3">
        <h2 className="font-medium text-ink">All Agents</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          This listing will be sent to your entire team. No filtering applied.
        </p>
      </header>
      <div
        data-testid="all-agents-grid"
        data-count={agents.length}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {agents.map((a) => (
          <div
            key={a.id}
            data-testid={`all-agent-${a.id}`}
            className="flex items-center gap-2 rounded-lg bg-canvas-sunken/30 border border-line p-2"
          >
            <div className="h-7 w-7 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium text-ink-muted">
                {initials(a.fullName)}
              </span>
            </div>
            <span className="text-xs text-ink truncate">{a.fullName}</span>
          </div>
        ))}
      </div>
    </Card>
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
