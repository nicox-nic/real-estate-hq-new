/**
 * Lead Inbox Derivations
 *
 * Pure functions for the inbox's filtering, qualification, search, and the
 * cold-card noise treatment.
 *
 * The noise design is centralized here so the UI never duplicates the
 * "is this card cold" check — the engine has the say, the UI just renders.
 *
 * Engine context: scoring includes the lead's first selected listing's price
 * when available, so the budget-match signal can actually fire. A lead with
 * no selected listing is scored without listing context (budget-match cannot
 * trigger).
 */

import type { Lead, LeadScoreCategory, Listing } from "@/lib/types";
import { scoreLead, type LeadScoreResult } from "./leadScoring";

/** Build a listing-price lookup once; callers reuse it. */
export function buildListingPriceMap(listings: Listing[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of listings) {
    m.set(l.id, l.price > 0 ? l.price : (l.rentalRate ?? 0));
  }
  return m;
}

/** Score a single lead with listing context, when a listing is selected. */
export function scoreLeadWithContext(
  lead: Lead,
  listingPriceById?: Map<string, number>,
): LeadScoreResult {
  const firstListingId = lead.selectedListingIds[0];
  const listingPrice =
    firstListingId && listingPriceById
      ? listingPriceById.get(firstListingId)
      : undefined;
  return scoreLead({ buyer: lead.buyer, listingPrice });
}

/** The 8 inbox filter chips per PRD. */
export type InboxFilter =
  | "All"
  | "Hot"
  | "New"
  | "Site Visit"
  | "Needs Reply"
  | "Financing"
  | "OFW"
  | "Investor";

export const INBOX_FILTERS: InboxFilter[] = [
  "All",
  "Hot",
  "New",
  "Site Visit",
  "Needs Reply",
  "Financing",
  "OFW",
  "Investor",
];

/** Threshold below which a lead is considered "noise" in the inbox. */
export const QUALIFIED_SCORE_THRESHOLD = 20;

/**
 * Returns true if a lead clears the noise threshold for the engine-only view,
 * OR the editorial assessment rates it Hot/Warm/Nurture.
 *
 * The editorial bypass is critical for Option Z: a lead the human has flagged
 * Hot should never be hidden by the qualified-only filter, even when the
 * engine sees no signals. The disagreement icon does the work of warning the
 * agent that the engine disagrees.
 */
export function isQualified(
  lead: Lead,
  listingPriceById?: Map<string, number>,
): boolean {
  const engineScore = scoreLeadWithContext(lead, listingPriceById).total;
  if (engineScore >= QUALIFIED_SCORE_THRESHOLD) return true;
  // Editorial bypass: Hot/Warm/Nurture editorial categories stay visible
  // regardless of engine score, so the disagreement can be surfaced.
  return (
    lead.seedScoreCategory === "Hot" ||
    lead.seedScoreCategory === "Warm" ||
    lead.seedScoreCategory === "Nurture"
  );
}

/** Returns true if engine disagrees with editorial seedScoreCategory. */
export function hasEngineEditorialDisagreement(
  lead: Lead,
  listingPriceById?: Map<string, number>,
): boolean {
  const engine = scoreLeadWithContext(lead, listingPriceById).category;
  return engine !== lead.seedScoreCategory;
}

/**
 * Returns true if the lead should render with reduced visual weight in the
 * inbox (engine sees no qualifying signals). The four-pronged structural
 * proof in verify hangs off this predicate.
 *
 * Even editorial-Hot leads with no engine signals render at low weight,
 * with the disagreement icon doing the disambiguation. That keeps the
 * visual ranking honest: the row looks unconvincing AND tells the agent
 * why the engine isn't convinced.
 */
export function isLowWeightCard(
  lead: Lead,
  listingPriceById?: Map<string, number>,
): boolean {
  const score = scoreLeadWithContext(lead, listingPriceById).total;
  return score < QUALIFIED_SCORE_THRESHOLD;
}

/**
 * Top-level filter: combines the chip filter, qualified-only toggle, and
 * the free-text search. Returns the filtered list in insertion order.
 *
 * The "All" chip with qualifiedOnly=false returns everything; with
 * qualifiedOnly=true returns only leads passing the isQualified() bar
 * (which includes editorial-Hot/Warm/Nurture as a bypass).
 */
export function filterInbox(
  leads: Lead[],
  opts: {
    chip: InboxFilter;
    qualifiedOnly: boolean;
    search: string;
    listingPriceById?: Map<string, number>;
  },
): Lead[] {
  const search = opts.search.trim().toLowerCase();

  return leads.filter((l) => {
    // Qualification filter
    if (opts.qualifiedOnly && !isQualified(l, opts.listingPriceById))
      return false;

    // Chip filter
    if (!matchesChip(l, opts.chip, opts.listingPriceById)) return false;

    // Search
    if (search.length > 0) {
      const haystack = [
        l.buyer.name,
        l.category,
        l.source,
        ...(l.tags ?? []),
        l.lastMessagePreview,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function matchesChip(
  lead: Lead,
  chip: InboxFilter,
  listingPriceById?: Map<string, number>,
): boolean {
  switch (chip) {
    case "All":
      return true;
    case "Hot": {
      // Engine OR editorial — surfaces both views per Option Z.
      const engine = scoreLeadWithContext(lead, listingPriceById).category;
      return engine === "Hot" || lead.seedScoreCategory === "Hot";
    }
    case "New":
      // New = created in the last 7 days (relative to seed reference Apr 28..May 29)
      // For prototype purposes: anything dated in the last 7 days of the seed.
      return isInLastSevenDays(lead.createdAt);
    case "Site Visit":
      return (
        lead.buyer.hasBookedSiteVisit === true ||
        (lead.tags ?? []).some((t) => t.includes("site-visit"))
      );
    case "Needs Reply":
      return lead.needsReply;
    case "Financing":
      return (
        lead.category === "Needs Financing" ||
        lead.buyer.paymentPreference === "Bank Financing" ||
        lead.buyer.paymentPreference === "In-House Financing" ||
        lead.buyer.paymentPreference === "Pag-IBIG" ||
        (lead.tags ?? []).some((t) =>
          t.toLowerCase().includes("financing"),
        )
      );
    case "OFW":
      return (
        lead.category === "OFW Buyer" ||
        lead.buyer.isOFW === true ||
        (lead.tags ?? []).some((t) => t.toLowerCase() === "ofw")
      );
    case "Investor":
      return (
        lead.category === "Investor Buyer" ||
        lead.buyer.purposeOfPurchase === "Investment" ||
        (lead.tags ?? []).some((t) =>
          t.toLowerCase().includes("investor"),
        )
      );
  }
}

/** Stable demo cutoff for "last 7 days" — relative to seed reference May 29 2025. */
const SEED_REFERENCE_ISO = "2025-05-29T00:00:00.000Z";

function isInLastSevenDays(iso: string): boolean {
  const created = new Date(iso).getTime();
  const ref = new Date(SEED_REFERENCE_ISO).getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return ref - created <= sevenDaysMs;
}

/**
 * Counts per chip — used for badge counters next to filter chips.
 * Computed with qualifiedOnly=true so the chip counts reflect what the
 * default view would show (Cold inquiries don't inflate the badges).
 */
export function chipCounts(
  leads: Lead[],
  qualifiedOnly = true,
  listingPriceById?: Map<string, number>,
): Record<InboxFilter, number> {
  const result = {} as Record<InboxFilter, number>;
  for (const chip of INBOX_FILTERS) {
    result[chip] = filterInbox(leads, {
      chip,
      qualifiedOnly,
      search: "",
      listingPriceById,
    }).length;
  }
  return result;
}

/**
 * Display badge variant for a lead's score category. By Option Z, the row
 * shows the editorial value; engine disagreement is signalled by the icon.
 */
export function badgeVariantForLead(
  lead: Lead,
): "hot" | "warm" | "nurture" | "cold" {
  return categoryToVariant(lead.seedScoreCategory);
}

function categoryToVariant(
  c: LeadScoreCategory,
): "hot" | "warm" | "nurture" | "cold" {
  return c === "Hot"
    ? "hot"
    : c === "Warm"
      ? "warm"
      : c === "Nurture"
        ? "nurture"
        : "cold";
}

/**
 * Build the bucket of "engine view" data used by the Buyer Profile's
 * scoring breakdown panel. Wraps scoreLead so the UI doesn't import the
 * scoring engine directly.
 */
export function getEngineView(
  lead: Lead,
  listingPriceById?: Map<string, number>,
) {
  return scoreLeadWithContext(lead, listingPriceById);
}
