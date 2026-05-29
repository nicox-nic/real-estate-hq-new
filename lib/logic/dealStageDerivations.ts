/**
 * Deal Stage Derivations
 *
 * The deal pipeline's pure logic concentration point. Every decision about
 * what stage a deal is in, what's required to advance, what action the agent
 * should take next, and which deals each role sees — all computed here.
 *
 * Per the PRD's 9 stages:
 *   1. Lead Generated
 *   2. Buyer Qualified
 *   3. Site Visit Done
 *   4. Reservation Paid
 *   5. Documents Submitted
 *   6. Financing Approved   (PRD says "Financing / Payment Approved")
 *   7. Contract Signed
 *   8. Commission Processing
 *   9. Commission Released
 *
 * Followed by terminal Closed Lost (off-pipeline) — represented as a status
 * field, NOT a stage. Modeled as Deal.notes / Deal.stage staying at its last
 * pre-loss value; for the prototype we don't render Closed Lost separately.
 *
 * Architectural posture: same declarative-table shape as
 * SHARE_RULES / FILE_RECOMMENDATION_RULES — Rule of Six now (TONE_MARKERS,
 * SEARCH_RULES, SHARE_RULES, FILE_RECOMMENDATION_RULES, SIMULATOR_TIMINGS,
 * STAGE_REQUIREMENTS).
 */

import type { Deal, DealStage, UserRole, User } from "@/lib/types";
import { DEAL_STAGES } from "@/lib/types";

// ----------------------------------------------------------------------------
// STAGE_REQUIREMENTS — declarative table of required documents per stage
// ----------------------------------------------------------------------------

/**
 * For each stage, what document(s) are required to ENTER that stage (i.e.,
 * to advance FROM the previous stage TO this one). The PRD doesn't spell
 * this out exhaustively; the requirements below are the natural document
 * gates for each pipeline stage:
 *
 *   Lead Generated         — no entry requirements (the start)
 *   Buyer Qualified        — Qualification notes
 *   Site Visit Done        — Site visit confirmation
 *   Reservation Paid       — Reservation fee receipt
 *   Documents Submitted    — Buyer ID, Income proof, Reservation agreement
 *   Financing Approved     — Bank letter of approval, signed financing terms
 *   Contract Signed        — Contract to Sell (CTS), signed by both parties
 *   Commission Processing  — Endorsement letter (broker → realty → developer)
 *   Commission Released    — Payout confirmation (BIR forms, official receipt)
 */
export const STAGE_REQUIREMENTS: Record<DealStage, string[]> = {
  "Lead Generated": [],
  "Buyer Qualified": ["Qualification notes"],
  "Site Visit Done": ["Site visit confirmation"],
  "Reservation Paid": ["Reservation fee receipt"],
  "Documents Submitted": [
    "Buyer valid ID",
    "Income proof / employment certificate",
    "Reservation agreement",
  ],
  "Financing Approved": [
    "Bank letter of approval",
    "Signed financing terms",
  ],
  "Contract Signed": ["Contract to Sell (CTS)"],
  "Commission Processing": ["Endorsement letter"],
  "Commission Released": ["Official receipt"],
};

// ----------------------------------------------------------------------------
// Pipeline navigation
// ----------------------------------------------------------------------------

/** Zero-based index of a stage in the canonical 9-stage pipeline. */
export function stageIndex(stage: DealStage): number {
  return DEAL_STAGES.indexOf(stage);
}

/** Returns the next stage if one exists, else undefined (already at end). */
export function nextStage(stage: DealStage): DealStage | undefined {
  const i = stageIndex(stage);
  if (i < 0 || i >= DEAL_STAGES.length - 1) return undefined;
  return DEAL_STAGES[i + 1];
}

/** Returns the previous stage if one exists. */
export function previousStage(stage: DealStage): DealStage | undefined {
  const i = stageIndex(stage);
  if (i <= 0) return undefined;
  return DEAL_STAGES[i - 1];
}

/** Percentage progress through the pipeline, 0..1. */
export function pipelineProgress(stage: DealStage): number {
  const i = stageIndex(stage);
  if (i < 0) return 0;
  return i / (DEAL_STAGES.length - 1);
}

// ----------------------------------------------------------------------------
// Advancement gate
// ----------------------------------------------------------------------------

export interface AdvancementGate {
  /** Can this deal advance to the next stage right now? */
  canAdvance: boolean;
  /** Which documents are still missing from the NEXT stage's requirements. */
  missingForNext: string[];
  /** The next stage (undefined if at end). */
  next: DealStage | undefined;
}

/**
 * Pure: can this deal advance to the next stage? A deal at stage N can
 * advance to stage N+1 only when all documents required by stage N+1 are
 * present (i.e. NOT in deal.missingDocuments).
 */
export function advancementGateFor(deal: Deal): AdvancementGate {
  const next = nextStage(deal.stage);
  if (!next) {
    return { canAdvance: false, missingForNext: [], next: undefined };
  }
  const required = STAGE_REQUIREMENTS[next];
  const missing = required.filter((doc) =>
    (deal.missingDocuments ?? []).includes(doc),
  );
  return {
    canAdvance: missing.length === 0,
    missingForNext: missing,
    next,
  };
}

// ----------------------------------------------------------------------------
// Closed Won — the closing action
// ----------------------------------------------------------------------------

/**
 * A deal is considered "closed won" when its stage advances to or past
 * Contract Signed. PRD logs the closing event with contract price, closing
 * date, commission terms etc.
 *
 * Closed Deal Logging is the action that finalizes Contract Signed → marks
 * closingDate, commitsFinalPrice (may differ from listing price), then the
 * linked Commission row flips to "For Payout" (when Commission Released
 * is the immediate next step) or "For Closing" (when Commission Processing
 * is the next intermediate stage).
 *
 * In the prototype: closing happens at the Contract Signed → Commission
 * Processing transition. The commission row's status goes from "For Closing"
 * (the late-pipeline state) to "For Payout" once the deal advances to
 * Commission Released.
 */
export function isClosedWon(deal: Deal): boolean {
  return (
    deal.stage === "Contract Signed" ||
    deal.stage === "Commission Processing" ||
    deal.stage === "Commission Released"
  );
}

/**
 * What commission status should a deal at the given stage have?
 * Used to verify the closed-deal commission flip.
 */
export function expectedCommissionStatusFor(
  stage: DealStage,
): "For Approval" | "For Closing" | "For Payout" | "Paid" {
  if (stage === "Commission Released") return "Paid";
  if (stage === "Commission Processing") return "For Payout";
  if (stage === "Contract Signed") return "For Closing";
  return "For Approval";
}

// ----------------------------------------------------------------------------
// Role-aware visibility
// ----------------------------------------------------------------------------

/**
 * Returns the subset of deals a user can see based on their role.
 *
 *   Agent → only their own deals (deal.agentId === user.id)
 *   Broker → deals where the deal's agent works under this broker
 *            (deal.brokerId === user.id OR deal.agentId in teamAgentIds)
 *   Realtor → deals in their network (deal.realtorId === user.id OR
 *             deal.agentId in networkAgentIds)
 *
 * Cross-file invariant: pages MUST go through this helper rather than
 * filtering inline. Concentration point — same shape as the 5+ existing
 * role-aware helpers.
 *
 * The team / network set is computed from all users where parentId === user.id
 * (passed in as `allUsers` to keep this pure).
 */
export function dealsForUser(
  deals: Deal[],
  user: User,
  allUsers: User[],
): Deal[] {
  switch (user.role) {
    case "Agent":
      return deals.filter((d) => d.agentId === user.id);
    case "Broker": {
      const teamAgentIds = new Set(
        allUsers.filter((u) => u.parentId === user.id).map((u) => u.id),
      );
      return deals.filter(
        (d) =>
          d.brokerId === user.id ||
          (d.agentId !== undefined && teamAgentIds.has(d.agentId)),
      );
    }
    case "Realtor": {
      // Realtor's network = users under realtor (direct) + agents under
      // brokers who are under the realtor (transitive).
      const directIds = new Set(
        allUsers.filter((u) => u.parentId === user.id).map((u) => u.id),
      );
      const transitiveAgentIds = new Set<string>();
      for (const u of allUsers) {
        if (u.parentId && directIds.has(u.parentId) && u.role === "Agent") {
          transitiveAgentIds.add(u.id);
        }
      }
      const networkAgentIds = new Set([
        ...directIds,
        ...transitiveAgentIds,
      ]);
      return deals.filter(
        (d) =>
          d.realtorId === user.id ||
          (d.agentId !== undefined && networkAgentIds.has(d.agentId)),
      );
    }
  }
}

// ----------------------------------------------------------------------------
// AI Suggested Next Action — rule-driven, transparent
// ----------------------------------------------------------------------------

/**
 * Same transparency discipline as aiReply / aiShareMessage / aiFileRecommendation:
 * a declarative table mapping (stage, condition) → suggested action.
 *
 * Surfaced in Deal Detail with the rule name visible. Verify-locked.
 */
export const NEXT_ACTION_RULES = {
  leadGen_noMessage: {
    description: "Lead Generated with no message yet — reach out",
    label: "Send an introductory message",
  },
  buyerQualified_noSiteVisit: {
    description: "Buyer qualified, no site visit booked — offer a slot",
    label: "Book a site visit",
  },
  siteVisitDone_noReservation: {
    description: "Site visit done — collect reservation fee to lock the unit",
    label: "Collect reservation fee",
  },
  reservationPaid_missingDocs: {
    description: "Reservation paid but docs incomplete — chase the requirements",
    label: "Request remaining buyer documents",
  },
  reservationPaid_docsReady: {
    description: "Reservation paid + docs ready — submit the package",
    label: "Submit documents to developer",
  },
  documentsSubmitted_awaitingFinancing: {
    description: "Docs submitted — coordinate financing approval",
    label: "Follow up on financing approval",
  },
  financingApproved_prepareContract: {
    description: "Financing approved — prepare the contract for signing",
    label: "Prepare and route the Contract to Sell",
  },
  contractSigned_processCommission: {
    description: "Contract signed — endorse for commission processing",
    label: "Endorse for commission processing",
  },
  commissionProcessing_awaitPayout: {
    description: "Commission in processing — monitor for release",
    label: "Monitor commission release",
  },
  commissionReleased_celebrate: {
    description: "Commission released — log the closed deal narrative",
    label: "Log the closed-deal narrative",
  },
  fallback: {
    description: "No specific rule fired — keep buyer warm",
    label: "Check in with the buyer",
  },
} as const;

export type NextActionRule = keyof typeof NEXT_ACTION_RULES;

export interface NextActionResult {
  rule: NextActionRule;
  description: string;
  label: string;
}

export function suggestNextAction(deal: Deal): NextActionResult {
  const has = (doc: string) =>
    !(deal.missingDocuments ?? []).includes(doc);

  let rule: NextActionRule;
  switch (deal.stage) {
    case "Lead Generated":
      rule = "leadGen_noMessage";
      break;
    case "Buyer Qualified":
      rule = "buyerQualified_noSiteVisit";
      break;
    case "Site Visit Done":
      rule = "siteVisitDone_noReservation";
      break;
    case "Reservation Paid":
      rule =
        has("Buyer valid ID") &&
        has("Income proof / employment certificate") &&
        has("Reservation agreement")
          ? "reservationPaid_docsReady"
          : "reservationPaid_missingDocs";
      break;
    case "Documents Submitted":
      rule = "documentsSubmitted_awaitingFinancing";
      break;
    case "Financing Approved":
      rule = "financingApproved_prepareContract";
      break;
    case "Contract Signed":
      rule = "contractSigned_processCommission";
      break;
    case "Commission Processing":
      rule = "commissionProcessing_awaitPayout";
      break;
    case "Commission Released":
      rule = "commissionReleased_celebrate";
      break;
    default:
      rule = "fallback";
  }
  const spec = NEXT_ACTION_RULES[rule];
  return { rule, description: spec.description, label: spec.label };
}

// ----------------------------------------------------------------------------
// Site Visit → Deal conversion
// ----------------------------------------------------------------------------

/**
 * Pure: given a Completed site visit, return the new Deal fields. Caller
 * persists.
 *
 * The newly created deal starts at "Site Visit Done" stage (since the visit
 * just completed). Required docs from earlier stages are marked complete;
 * the next-stage requirements (Reservation Paid) are added to missingDocuments.
 */
export interface SiteVisitConversionInput {
  siteVisitId: string;
  leadId: string;
  buyerName: string;
  buyerProfileId: string;
  listingId: string;
  listingTitle: string;
  agentId: string;
  brokerId?: string;
  realtorId?: string;
  contractPrice: number;
  commissionRate: number;
  realtyShare: number;
  brokerShare: number;
  agentShare: number;
  nowIso: string;
}

export function convertSiteVisitToDeal(
  input: SiteVisitConversionInput,
): Omit<Deal, "id" | "commissionId"> {
  return {
    buyerProfileId: input.buyerProfileId,
    buyerName: input.buyerName,
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    stage: "Site Visit Done",
    contractPrice: input.contractPrice,
    commissionRate: input.commissionRate,
    realtyShare: input.realtyShare,
    brokerShare: input.brokerShare,
    agentShare: input.agentShare,
    agentId: input.agentId,
    brokerId: input.brokerId,
    realtorId: input.realtorId,
    missingDocuments: STAGE_REQUIREMENTS["Reservation Paid"].slice(),
    createdAt: input.nowIso,
    updatedAt: input.nowIso,
    notes: `Converted from site visit ${input.siteVisitId}`,
  };
}

// ----------------------------------------------------------------------------
// Stage badge / variant helpers
// ----------------------------------------------------------------------------

/** Group stages into 3 phases for desktop kanban collapsing. */
export const STAGE_PHASES = {
  Discovery: ["Lead Generated", "Buyer Qualified", "Site Visit Done"] as DealStage[],
  Qualification: [
    "Reservation Paid",
    "Documents Submitted",
    "Financing Approved",
  ] as DealStage[],
  Closing: [
    "Contract Signed",
    "Commission Processing",
    "Commission Released",
  ] as DealStage[],
} as const;

export type StagePhase = keyof typeof STAGE_PHASES;

export function phaseFor(stage: DealStage): StagePhase {
  for (const [phase, stages] of Object.entries(STAGE_PHASES) as Array<
    [StagePhase, DealStage[]]
  >) {
    if (stages.includes(stage)) return phase;
  }
  return "Discovery";
}

/** Group deals by stage in pipeline order. Useful for kanban + timeline. */
export function groupDealsByStage(
  deals: Deal[],
): Map<DealStage, Deal[]> {
  const map = new Map<DealStage, Deal[]>();
  for (const stage of DEAL_STAGES) map.set(stage, []);
  for (const d of deals) {
    const arr = map.get(d.stage);
    if (arr) arr.push(d);
  }
  return map;
}
