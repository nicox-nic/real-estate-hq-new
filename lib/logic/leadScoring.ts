/**
 * Lead Scoring — pure function per PRD specification.
 *
 * Weights from PRD:
 *   Budget matches property:    +20
 *   Buying within 3 months:     +20
 *   Asked for computation:      +15
 *   Booked site visit:          +25
 *   Opened brochure:             +5
 *   Watched walkthrough:         +5
 *   Replied quickly (<60min):   +10
 *
 * Categories:
 *   Hot:     ≥70
 *   Warm:    50–69
 *   Nurture: 30–49
 *   Cold:    <30
 *
 * Returns BOTH total and per-criterion breakdown so the UI can show "why."
 * Returns the engine-computed category so callers can compare to seed scores
 * (the contradiction-visibility pattern).
 */

import type { BuyerProfile, LeadScoreCategory } from "@/lib/types";

export interface LeadScoreBreakdownItem {
  label: string;
  weight: number;
  earned: number;
  triggered: boolean;
}

export interface LeadScoreResult {
  total: number;
  category: LeadScoreCategory;
  breakdown: LeadScoreBreakdownItem[];
}

export interface ScoringInputs {
  buyer: BuyerProfile;
  listingPrice?: number;
}

const WEIGHTS = {
  budgetMatch: 20,
  withinThreeMonths: 20,
  computation: 15,
  siteVisit: 25,
  brochure: 5,
  walkthrough: 5,
  quickReply: 10,
} as const;

export const LEAD_SCORE_MAX =
  WEIGHTS.budgetMatch +
  WEIGHTS.withinThreeMonths +
  WEIGHTS.computation +
  WEIGHTS.siteVisit +
  WEIGHTS.brochure +
  WEIGHTS.walkthrough +
  WEIGHTS.quickReply; // = 100

export function categorize(score: number): LeadScoreCategory {
  if (score >= 70) return "Hot";
  if (score >= 50) return "Warm";
  if (score >= 30) return "Nurture";
  return "Cold";
}

export function scoreLead({ buyer, listingPrice }: ScoringInputs): LeadScoreResult {
  const items: LeadScoreBreakdownItem[] = [];

  // 1. Budget matches property
  const budgetMatches =
    listingPrice !== undefined &&
    buyer.budgetMin !== undefined &&
    buyer.budgetMax !== undefined &&
    listingPrice >= buyer.budgetMin &&
    listingPrice <= buyer.budgetMax;
  items.push({
    label: "Budget matches property",
    weight: WEIGHTS.budgetMatch,
    earned: budgetMatches ? WEIGHTS.budgetMatch : 0,
    triggered: !!budgetMatches,
  });

  // 2. Buying within 3 months
  const withinThree =
    buyer.timeline === "Within 1 Month" || buyer.timeline === "Within 3 Months";
  items.push({
    label: "Buying within 3 months",
    weight: WEIGHTS.withinThreeMonths,
    earned: withinThree ? WEIGHTS.withinThreeMonths : 0,
    triggered: withinThree,
  });

  // 3. Asked for computation
  items.push({
    label: "Asked for computation",
    weight: WEIGHTS.computation,
    earned: buyer.hasAskedForComputation ? WEIGHTS.computation : 0,
    triggered: !!buyer.hasAskedForComputation,
  });

  // 4. Booked site visit
  items.push({
    label: "Booked site visit",
    weight: WEIGHTS.siteVisit,
    earned: buyer.hasBookedSiteVisit ? WEIGHTS.siteVisit : 0,
    triggered: !!buyer.hasBookedSiteVisit,
  });

  // 5. Opened brochure
  items.push({
    label: "Opened brochure",
    weight: WEIGHTS.brochure,
    earned: buyer.hasOpenedBrochure ? WEIGHTS.brochure : 0,
    triggered: !!buyer.hasOpenedBrochure,
  });

  // 6. Watched walkthrough video
  items.push({
    label: "Watched walkthrough video",
    weight: WEIGHTS.walkthrough,
    earned: buyer.hasWatchedWalkthrough ? WEIGHTS.walkthrough : 0,
    triggered: !!buyer.hasWatchedWalkthrough,
  });

  // 7. Replied quickly (under 60 minutes by convention)
  const repliedQuickly =
    buyer.repliedWithinMinutes !== undefined && buyer.repliedWithinMinutes <= 60;
  items.push({
    label: "Replied quickly (<60 min)",
    weight: WEIGHTS.quickReply,
    earned: repliedQuickly ? WEIGHTS.quickReply : 0,
    triggered: repliedQuickly,
  });

  const total = items.reduce((sum, it) => sum + it.earned, 0);

  return {
    total,
    category: categorize(total),
    breakdown: items,
  };
}

/**
 * Compute the lift in score when a specific action is simulated.
 * Used by the nurture-beat demo (and the verify suite locks the magnitude).
 */
export function simulateAction(
  buyer: BuyerProfile,
  action: "brochure" | "computation" | "siteVisit" | "walkthrough",
  listingPrice?: number,
): { before: number; after: number; lift: number } {
  const before = scoreLead({ buyer, listingPrice }).total;
  const next: BuyerProfile = { ...buyer };
  if (action === "brochure") next.hasOpenedBrochure = true;
  if (action === "computation") next.hasAskedForComputation = true;
  if (action === "siteVisit") next.hasBookedSiteVisit = true;
  if (action === "walkthrough") next.hasWatchedWalkthrough = true;
  const after = scoreLead({ buyer: next, listingPrice }).total;
  return { before, after, lift: after - before };
}
