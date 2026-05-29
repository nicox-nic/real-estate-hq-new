"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Info,
  User,
  Building2,
  FileText,
  ChevronRight,
  X,
  Trophy,
  Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedDeals,
  seedCommissions,
  seedLeads,
  seedListings,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import { DEAL_STAGES } from "@/lib/types";
import {
  STAGE_REQUIREMENTS,
  advancementGateFor,
  nextStage,
  stageIndex,
  suggestNextAction,
  expectedCommissionStatusFor,
  isClosedWon,
  pipelineProgress,
} from "@/lib/logic/dealStageDerivations";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";

/**
 * Deal Detail (#25 sub-page).
 *
 * Composition:
 *   - Header: buyer + listing + deal value + current stage + days in stage
 *   - Pipeline progress strip — all 9 stages with current emphasized
 *   - AI Suggested Next Action panel with rule transparency
 *   - Stage advancement card with required-document checklist
 *   - Linked entities (lead conversation, listing, commission row)
 *   - Closed Deal Logging sheet (modal) triggered when entering Closing
 */
export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();

  const deal = seedDeals.find((d) => d.id === params.id);
  if (!deal) notFound();

  const lead = seedLeads.find(
    (l) => l.buyer.id === deal.buyerProfileId,
  );
  const listing = seedListings.find((l) => l.id === deal.listingId);
  const commission = deal.commissionId
    ? seedCommissions.find((c) => c.id === deal.commissionId)
    : undefined;
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  // Local advancement state — UI mutation for the demo. Backend wiring later.
  const [localStage, setLocalStage] = React.useState(deal.stage);
  const [localMissing, setLocalMissing] = React.useState<string[]>(
    deal.missingDocuments ?? [],
  );

  // Composite a synthetic deal for derivation calls
  const syntheticDeal = React.useMemo(
    () => ({ ...deal, stage: localStage, missingDocuments: localMissing }),
    [deal, localStage, localMissing],
  );

  const gate = advancementGateFor(syntheticDeal);
  const ai = suggestNextAction(syntheticDeal);
  const progress = pipelineProgress(localStage);

  const [closeDealOpen, setCloseDealOpen] = React.useState(false);

  const handleAdvance = () => {
    if (!gate.canAdvance || !gate.next) return;
    // If advancing into Contract Signed, surface the Closed Deal Logging sheet
    if (gate.next === "Contract Signed") {
      setCloseDealOpen(true);
      return;
    }
    setLocalStage(gate.next);
    // When entering a new stage, populate that stage's "next stage"
    // requirements as the new missing-docs set
    const nextAfterNext = nextStage(gate.next);
    if (nextAfterNext) {
      setLocalMissing([...STAGE_REQUIREMENTS[nextAfterNext]]);
    } else {
      setLocalMissing([]);
    }
  };

  const handleConfirmClose = () => {
    setLocalStage("Contract Signed");
    setLocalMissing([...STAGE_REQUIREMENTS["Commission Processing"]]);
    setCloseDealOpen(false);
  };

  const toggleDoc = (doc: string) => {
    setLocalMissing((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc],
    );
  };

  const closedWon = isClosedWon({ ...deal, stage: localStage });

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={`/${roleSlug}/deals`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>

        {/* Header card */}
        <Card surface="raised">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0 font-semibold text-sm">
              {initials(deal.buyerName)}
            </div>
            <div className="min-w-0 flex-1">
              <h1
                data-testid="deal-buyer-name"
                className="font-display text-lg font-semibold text-ink truncate"
              >
                {deal.buyerName}
              </h1>
              <p className="text-xs text-ink-muted truncate">
                {deal.listingTitle}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge variant={closedWon ? "paid" : "warm"}>
                  {localStage}
                </StatusBadge>
                <span
                  data-testid="deal-value"
                  className="font-display text-base font-semibold text-ink tabular-nums"
                >
                  {formatPHPWhole(deal.contractPrice)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pipeline progress */}
        <Card data-testid="deal-pipeline-strip">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <span className="text-[10px] text-ink-subtle">
              {Math.round(progress * 100)}%
            </span>
          </CardHeader>
          <ol className="relative grid grid-cols-9 gap-1">
            {DEAL_STAGES.map((stage, i) => {
              const currentIdx = stageIndex(localStage);
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <li
                  key={stage}
                  data-testid={`deal-strip-cell-${i}`}
                  data-state={isCurrent ? "current" : isPast ? "past" : "future"}
                  className="flex flex-col items-center gap-1"
                  title={stage}
                >
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full",
                      isCurrent
                        ? "bg-gold-deep ring-4 ring-gold-soft"
                        : isPast
                        ? "bg-sage-deep"
                        : "bg-canvas-sunken border border-line",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] text-center leading-tight line-clamp-2 px-0.5",
                      isCurrent
                        ? "text-ink font-medium"
                        : isPast
                        ? "text-sage-deep"
                        : "text-ink-subtle",
                    )}
                  >
                    {shortLabel(stage)}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* AI Suggested Next Action */}
        <Card
          data-testid="ai-next-action-panel"
          className="!p-4 bg-gold-soft/40 border-gold-deep/15"
        >
          <header className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-gold-deep" />
            <span className="font-medium text-sm text-ink">
              AI Suggested Next Action
            </span>
            <span
              data-testid="ai-next-action-rule"
              className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium ml-1.5"
            >
              · rule: {ai.rule}
            </span>
          </header>
          <p
            data-testid="ai-next-action-label"
            className="font-display text-base text-ink"
          >
            {ai.label}
          </p>
          <p className="text-xs text-ink-muted mt-1 inline-flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            {ai.description}
          </p>
        </Card>

        {/* Stage advancement */}
        {gate.next ? (
          <Card data-testid="advancement-card">
            <CardHeader>
              <CardTitle>Advance to {gate.next}</CardTitle>
              {gate.canAdvance ? (
                <StatusBadge variant="paid">Ready</StatusBadge>
              ) : (
                <StatusBadge variant="warm">
                  {gate.missingForNext.length} missing
                </StatusBadge>
              )}
            </CardHeader>
            <p className="text-xs text-ink-muted mb-3">
              Required documents to enter the next stage. Mark each as
              received to unlock advancement.
            </p>
            <ul
              data-testid="required-docs-checklist"
              data-can-advance={gate.canAdvance}
              className="space-y-2 mb-4"
            >
              {STAGE_REQUIREMENTS[gate.next].map((doc) => {
                const missing = localMissing.includes(doc);
                return (
                  <li key={doc}>
                    <button
                      onClick={() => toggleDoc(doc)}
                      data-testid={`required-doc-${doc.replace(/[^a-z]+/gi, "-").toLowerCase()}`}
                      data-missing={missing}
                      className="w-full flex items-center gap-3 rounded-xl border border-line p-2.5 hover:border-gold/40 transition-colors text-left"
                    >
                      {missing ? (
                        <Circle className="h-4 w-4 text-ink-subtle shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-sage-deep shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          missing ? "text-ink-muted" : "text-ink",
                        )}
                      >
                        {doc}
                      </span>
                    </button>
                  </li>
                );
              })}
              {STAGE_REQUIREMENTS[gate.next].length === 0 ? (
                <li className="text-xs text-ink-subtle italic">
                  No documents required for this transition.
                </li>
              ) : null}
            </ul>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleAdvance}
              disabled={!gate.canAdvance}
              data-testid="advance-button"
            >
              <ArrowRight className="h-4 w-4" />
              Advance to {gate.next}
            </Button>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-ink text-center py-2">
              <Trophy className="inline-block h-4 w-4 mr-1 -mt-0.5 text-gold-deep" />
              This deal has reached the end of the pipeline.
            </p>
          </Card>
        )}

        {/* Commission link */}
        {commission ? (
          <Card data-testid="linked-commission">
            <CardHeader>
              <CardTitle>Commission</CardTitle>
              <StatusBadge variant={commissionVariant(commission.status)}>
                {commission.status}
              </StatusBadge>
            </CardHeader>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-lg font-semibold text-ink tabular-nums">
                {formatPHPCompact(commission.agentAmount)}
              </span>
              <span className="text-xs text-ink-subtle">
                {formatPHPCompact(commission.totalAmount)} total
              </span>
            </div>
            <p className="text-[11px] text-ink-subtle mt-1">
              Expected status at this stage:{" "}
              <span className="text-ink-muted">
                {expectedCommissionStatusFor(localStage)}
              </span>
            </p>
          </Card>
        ) : null}

        {/* Linked entities */}
        <Card>
          <CardHeader>
            <CardTitle>Linked</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-line-soft">
            {lead ? (
              <li>
                <Link
                  href={`/${roleSlug}/leads/${lead.id}`}
                  className="flex items-center gap-2.5 py-2.5 hover:bg-canvas-sunken/40 rounded-lg px-1"
                >
                  <User className="h-4 w-4 text-ink-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {lead.buyer.name}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      Open conversation
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            ) : null}
            {listing ? (
              <li>
                <Link
                  href={`/${roleSlug}/listings/${listing.id}/share?lead=${lead?.id ?? ""}`}
                  className="flex items-center gap-2.5 py-2.5 hover:bg-canvas-sunken/40 rounded-lg px-1"
                >
                  <Building2 className="h-4 w-4 text-ink-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {listing.title}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {formatPHPWhole(listing.price)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-subtle" />
                </Link>
              </li>
            ) : null}
            {deal.notes ? (
              <li className="py-2.5 px-1">
                <p className="text-[11px] text-ink-subtle uppercase tracking-wider font-medium">
                  Notes
                </p>
                <p className="text-sm text-ink-muted mt-1 leading-relaxed">
                  {deal.notes}
                </p>
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      {/* Closed Deal Logging sheet */}
      {closeDealOpen ? (
        <CloseDealSheet
          deal={deal}
          onCancel={() => setCloseDealOpen(false)}
          onConfirm={handleConfirmClose}
        />
      ) : null}
    </AppShell>
  );
}

function CloseDealSheet({
  deal,
  onCancel,
  onConfirm,
}: {
  deal: (typeof seedDeals)[number];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [finalPrice, setFinalPrice] = React.useState<number>(
    deal.contractPrice,
  );
  const [closingDate, setClosingDate] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      data-testid="close-deal-sheet"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      <button
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div className="relative w-full sm:max-w-md bg-canvas-raised rounded-t-3xl sm:rounded-2xl shadow-lift max-h-[88vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>
        <header className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-line-soft">
          <h2 className="font-medium text-ink inline-flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-gold-deep" />
            Log closed deal
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-ink-subtle hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="px-4 sm:px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
              Final closing price
            </label>
            <input
              type="number"
              value={finalPrice}
              onChange={(e) => setFinalPrice(Number(e.target.value))}
              data-testid="close-final-price"
              className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink tabular-nums focus:outline-none focus:border-gold/60"
            />
            <p className="text-[11px] text-ink-subtle mt-1">
              Original contract price: {formatPHPWhole(deal.contractPrice)}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
              <Calendar className="inline-block h-3 w-3 mr-1 -mt-0.5" />
              Closing date
            </label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              data-testid="close-closing-date"
              className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink focus:outline-none focus:border-gold/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-wider mb-1.5">
              <FileText className="inline-block h-3 w-3 mr-1 -mt-0.5" />
              Handoff notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="close-notes"
              className="w-full rounded-xl bg-canvas-raised border border-line p-3 text-sm text-ink leading-relaxed resize-none focus:outline-none focus:border-gold/60"
            />
          </div>
          <div className="rounded-xl bg-sage-soft/50 border border-sage-deep/15 p-3 text-xs text-ink-muted leading-relaxed">
            <p className="font-medium text-sage-deep mb-1">What happens next</p>
            Deal advances to <span className="font-medium text-ink">Contract Signed</span>.
            Commission flips to{" "}
            <span className="font-medium text-ink">For Closing</span> and
            progresses to <span className="font-medium text-ink">For Payout</span>{" "}
            as the deal moves through Commission Processing.
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              size="md"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onConfirm}
              disabled={!closingDate}
              data-testid="close-deal-confirm"
              className="flex-1"
            >
              <Trophy className="h-4 w-4" />
              Log closed deal
            </Button>
          </div>
        </div>
      </div>
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

function shortLabel(stage: string): string {
  switch (stage) {
    case "Lead Generated":
      return "Lead";
    case "Buyer Qualified":
      return "Qual.";
    case "Site Visit Done":
      return "Visit";
    case "Reservation Paid":
      return "Reserve";
    case "Documents Submitted":
      return "Docs";
    case "Financing Approved":
      return "Finance";
    case "Contract Signed":
      return "Contract";
    case "Commission Processing":
      return "Proc.";
    case "Commission Released":
      return "Released";
    default:
      return stage;
  }
}

function commissionVariant(status: string) {
  switch (status) {
    case "Paid":
      return "paid" as const;
    case "For Closing":
      return "for-closing" as const;
    case "For Payout":
      return "for-payout" as const;
    case "On Hold":
      return "on-hold" as const;
    default:
      return "for-approval" as const;
  }
}
