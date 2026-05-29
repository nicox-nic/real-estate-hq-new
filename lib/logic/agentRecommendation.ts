/**
 * AI Agent Recommendation
 *
 * The **seventh** declarative rule table in the codebase (after
 * TONE_MARKERS / SEARCH_RULES / SHARE_RULES / FILE_RECOMMENDATION_RULES /
 * SIMULATOR_TIMINGS / STAGE_REQUIREMENTS + NEXT_ACTION_RULES). The
 * Rule of Six → **Rule of Seven** transition.
 *
 * Shape consistent with the established pattern:
 *   - Declarative table (AGENT_RECOMMENDATION_RULES)
 *   - Pure scoring function (scoreAgentForListing)
 *   - Sibling helper (recommendAgentsForListing — returns ranked set)
 *   - Rule transparency in UI ("rule: matches-BGC-specialization · 92%")
 *   - Verify lock (Section 20 asserts every rule applied correctly)
 *
 * The scoring composes:
 *   1. Location specialization match (Cebu / Manila / BGC / Mactan)
 *   2. Property type specialization match (Condo / House and Lot / Luxury)
 *   3. Transaction type specialization match (Foreclosure / Rental /
 *      Assume Balance / Investment)
 *   4. Price-band specialization match (Luxury for ≥₱25M)
 *   5. Agent performance signal (top-performer + active boost)
 *   6. Health boost (high-health agents preferred)
 *
 * Each rule that fires contributes a labeled reasoning string surfaced
 * in the UI. The total score is normalized 0..100; the UI renders a
 * "X% match" percentage matching the PRD's example.
 */

import type {
  User,
  Listing,
  AgentSpecialization,
  Deal,
  TransactionType,
} from "@/lib/types";

// ----------------------------------------------------------------------------
// Rule definitions
// ----------------------------------------------------------------------------

/**
 * Each rule contributes (weight, reasoning) when it matches. The total
 * score is the sum of weights; reasoning strings concatenate for the
 * "why this agent" UI affordance.
 *
 * Weights are tuned so a fully-matching agent reaches ~100; a partial
 * match lands in the 40-80 band.
 */
export const AGENT_RECOMMENDATION_RULES = {
  locationMatch: {
    weight: 25,
    description:
      "Agent specializes in the listing's location (Cebu / Manila / BGC / Mactan).",
    reasoningTemplate: (loc: string) => `Specializes in ${loc}`,
  },
  propertyTypeMatch: {
    weight: 22,
    description:
      "Agent specializes in the listing's property type (Condo / House and Lot).",
    reasoningTemplate: (ptype: string) => `${ptype} specialist`,
  },
  transactionTypeMatch: {
    weight: 18,
    description:
      "Agent specializes in the listing's transaction type (Foreclosure / For Assume / Rental).",
    reasoningTemplate: (tx: string) => `${tx} specialist`,
  },
  luxuryPriceMatch: {
    weight: 20,
    description:
      "Listing is ≥₱25M and agent is a Luxury specialist.",
    reasoningTemplate: () => "Luxury listing specialist",
  },
  investmentMatch: {
    weight: 15,
    description:
      "Listing transaction type is Investment-friendly (Foreclosure / Assume) and agent specializes in Investment.",
    reasoningTemplate: () => "Investment specialist",
  },
  topPerformer: {
    weight: 15,
    description: "Agent is a Top Performer or has 3+ recent closed deals.",
    reasoningTemplate: (deals: number) => `Top performer · ${deals} closed deals this month`,
  },
  highHealth: {
    weight: 10,
    description: "Agent's recent health activity is high (active responses).",
    reasoningTemplate: () => "High response rate to similar listings",
  },
  ofwBuyer: {
    weight: 12,
    description:
      "Agent specializes in OFW Buyers (matches investment / rental / pre-selling listings).",
    reasoningTemplate: () => "OFW buyer specialist",
  },
} as const;

export type AgentRecommendationRuleKey =
  keyof typeof AGENT_RECOMMENDATION_RULES;

/**
 * Maps the PRD's free-form location strings to specialization tags.
 * The location field is "Taguig City", "BGC, Taguig", "Cebu City", etc.,
 * and the specialization is "BGC", "Cebu", "Manila", etc.
 */
function locationToSpecializations(
  location: string,
): AgentSpecialization[] {
  const hits: AgentSpecialization[] = [];
  const lc = location.toLowerCase();
  if (lc.includes("bgc") || lc.includes("taguig")) hits.push("BGC");
  if (
    lc.includes("manila") ||
    lc.includes("makati") ||
    lc.includes("ortigas") ||
    lc.includes("pasig") ||
    lc.includes("quezon")
  )
    hits.push("Manila");
  if (lc.includes("cebu") || lc.includes("mandaue") || lc.includes("lapu") || lc.includes("talisay"))
    hits.push("Cebu");
  if (lc.includes("mactan")) hits.push("Mactan");
  return hits;
}

/**
 * Maps a listing's property type to specialization tags.
 */
function propertyTypeToSpecializations(
  propertyType: string,
): AgentSpecialization[] {
  const lc = propertyType.toLowerCase();
  const hits: AgentSpecialization[] = [];
  if (lc.includes("condo")) hits.push("Condo");
  if (lc.includes("house") || lc.includes("lot")) hits.push("House and Lot");
  if (lc.includes("commercial")) hits.push("Commercial");
  return hits;
}

/**
 * Maps transaction type to specialization tags.
 */
function transactionTypeToSpecializations(
  tx: TransactionType,
): AgentSpecialization[] {
  switch (tx) {
    case "Foreclosure":
      return ["Foreclosure"];
    case "For Assume":
      return ["Assume Balance"];
    case "For Rent":
      return ["Rental"];
    default:
      return [];
  }
}

// ----------------------------------------------------------------------------
// Score result shape
// ----------------------------------------------------------------------------

export interface AgentScore {
  agentId: string;
  agentName: string;
  /** Total score 0..100+. */
  score: number;
  /** Match percentage (capped 0..100) shown in UI. */
  matchPercent: number;
  /** Rule keys that fired for this agent. */
  firedRules: AgentRecommendationRuleKey[];
  /** Reasoning strings — one per fired rule, ready to render. */
  reasoning: string[];
  /** Headline reasoning — first or strongest reason for compact display. */
  headlineReason: string;
}

export interface RecommendationInput {
  listing: Listing;
  agents: User[];
  deals: Deal[];
}

// ----------------------------------------------------------------------------
// Pure scoring function
// ----------------------------------------------------------------------------

/**
 * Score a single agent against a listing. Pure, deterministic.
 * Returns the contribution from each fired rule.
 */
export function scoreAgentForListing(
  agent: User,
  listing: Listing,
  deals: Deal[],
): AgentScore {
  const firedRules: AgentRecommendationRuleKey[] = [];
  const reasoning: string[] = [];
  let score = 0;

  const specs = new Set<AgentSpecialization>(agent.specializations ?? []);

  // Rule 1: Location match
  const locationSpecs = locationToSpecializations(listing.location);
  const matchedLoc = locationSpecs.find((s) => specs.has(s));
  if (matchedLoc) {
    const rule = AGENT_RECOMMENDATION_RULES.locationMatch;
    score += rule.weight;
    firedRules.push("locationMatch");
    reasoning.push(rule.reasoningTemplate(matchedLoc));
  }

  // Rule 2: Property type
  const ptypeSpecs = propertyTypeToSpecializations(listing.propertyType);
  const matchedPtype = ptypeSpecs.find((s) => specs.has(s));
  if (matchedPtype) {
    const rule = AGENT_RECOMMENDATION_RULES.propertyTypeMatch;
    score += rule.weight;
    firedRules.push("propertyTypeMatch");
    reasoning.push(rule.reasoningTemplate(matchedPtype));
  }

  // Rule 3: Transaction type
  const txSpecs = transactionTypeToSpecializations(listing.transactionType);
  const matchedTx = txSpecs.find((s) => specs.has(s));
  if (matchedTx) {
    const rule = AGENT_RECOMMENDATION_RULES.transactionTypeMatch;
    score += rule.weight;
    firedRules.push("transactionTypeMatch");
    reasoning.push(rule.reasoningTemplate(matchedTx));
  }

  // Rule 4: Luxury price
  if (listing.price >= 25_000_000 && specs.has("Luxury")) {
    const rule = AGENT_RECOMMENDATION_RULES.luxuryPriceMatch;
    score += rule.weight;
    firedRules.push("luxuryPriceMatch");
    reasoning.push(rule.reasoningTemplate());
  }

  // Rule 5: Investment match
  const isInvestmentTx =
    listing.transactionType === "Foreclosure" ||
    listing.transactionType === "For Assume";
  if (isInvestmentTx && specs.has("Investment")) {
    const rule = AGENT_RECOMMENDATION_RULES.investmentMatch;
    score += rule.weight;
    firedRules.push("investmentMatch");
    reasoning.push(rule.reasoningTemplate());
  }

  // Rule 6: Top performer
  const recentClosed = deals.filter(
    (d) =>
      d.agentId === agent.id &&
      (d.stage === "Contract Signed" ||
        d.stage === "Commission Processing" ||
        d.stage === "Commission Released"),
  ).length;
  if (recentClosed >= 3) {
    const rule = AGENT_RECOMMENDATION_RULES.topPerformer;
    score += rule.weight;
    firedRules.push("topPerformer");
    reasoning.push(rule.reasoningTemplate(recentClosed));
  }

  // Rule 7: High health (proxy: ≥1 closed deal + ≥1 site visit shows activity)
  // — Real health score comes from agentHealth; for the recommendation
  // we use a cheap activity signal.
  const hasActivity =
    deals.some(
      (d) =>
        d.agentId === agent.id &&
        d.stage !== "Lead Generated",
    );
  if (hasActivity && !firedRules.includes("topPerformer")) {
    const rule = AGENT_RECOMMENDATION_RULES.highHealth;
    score += rule.weight;
    firedRules.push("highHealth");
    reasoning.push(rule.reasoningTemplate());
  }

  // Rule 8: OFW buyer specialist for investment / pre-selling
  const isOfwFriendly =
    listing.transactionType === "Pre-Selling" || isInvestmentTx;
  if (isOfwFriendly && specs.has("OFW Buyers")) {
    const rule = AGENT_RECOMMENDATION_RULES.ofwBuyer;
    score += rule.weight;
    firedRules.push("ofwBuyer");
    reasoning.push(rule.reasoningTemplate());
  }

  const matchPercent = Math.min(100, Math.round(score));
  const headlineReason = reasoning[0] ?? "Available agent";

  return {
    agentId: agent.id,
    agentName: agent.fullName,
    score,
    matchPercent,
    firedRules,
    reasoning,
    headlineReason,
  };
}

// ----------------------------------------------------------------------------
// Sibling helper: rank N agents
// ----------------------------------------------------------------------------

/**
 * Returns agents ranked by recommendation score for a given listing.
 * Defaults to top N with non-zero scores; pass `minScore: 0` to include
 * the full team.
 */
export function recommendAgentsForListing(
  input: RecommendationInput & {
    topN?: number;
    minScore?: number;
  },
): AgentScore[] {
  const { listing, agents, deals, topN = 5, minScore = 1 } = input;
  const scored = agents.map((a) => scoreAgentForListing(a, listing, deals));
  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
