/**
 * AI Suggested Reply — Suggester Engine
 *
 * Pure rule-driven function. NOT an LLM call. Given a lead + listing context
 * + the last buyer message + the chosen tone + language, returns:
 *   - text: the recommended reply (fully toned and translated)
 *   - suggestedActions: composable CTAs the agent can attach to the draft
 *   - agentNote: optional disclaimer for financial/legal/tax topics (per PRD)
 *
 * Same architectural shape as leadScoring.ts — verify can call it directly
 * with shaped inputs and lock the output.
 *
 * The rule set (in priority order):
 *   1. Cold inquiry with no profile signals  → qualifying question, no CTAs
 *   2. Buyer asked about financing/payment   → financing explainer + agent note
 *   3. Buyer asked about price/computation   → computation offer
 *   4. Buyer asked about location/maps       → location share
 *   5. Buyer asked about photos/floor plans  → floor-plan share
 *   6. Hot buyer ready for site visit        → site-visit booking offer
 *   7. Warm buyer engaged but no SV yet      → site-visit soft ask
 *   8. Default (nurture/warm without signal) → friendly check-in
 *
 * Each rule produces a ReplyDraft (greeting / body / signOff slots) that
 * the tone and language layers transform. Suggestions are deterministic
 * given the inputs.
 */

import type { Lead, Listing, PropertyFile } from "@/lib/types";
import { applyTone, type Tone, type ReplyDraft } from "./tones";
import { applyLanguage, type Language } from "./languages";
import { formatPHPCompact } from "@/lib/format";

/** Action the agent can append to the draft (composable CTAs). */
export type SuggestedActionKind =
  | "book_site_visit"
  | "send_computation"
  | "send_brochure"
  | "send_floor_plan"
  | "send_location_map"
  | "ask_qualifying_question"
  | "follow_up_check_in";

export interface SuggestedAction {
  kind: SuggestedActionKind;
  label: string;
  /** If present, a suggested file from the listing's library to attach. */
  attachFileId?: string;
}

export interface SuggestRequest {
  lead: Lead;
  /** Listing the lead is interested in (first selected listing). */
  listing?: Listing;
  /** Files available for the listing. */
  files?: PropertyFile[];
  /** Last inbound buyer message text. */
  lastBuyerMessage?: string;
  tone: Tone;
  language: Language;
}

export interface SuggestResult {
  /** Final toned + translated text ready to send. */
  text: string;
  /** Composable CTAs the agent can tap to attach to the draft. */
  suggestedActions: SuggestedAction[];
  /** Optional internal note (e.g. financial/legal disclaimers). */
  agentNote?: string;
  /** Which rule fired — for verify and for transparency. */
  ruleName: string;
}

/**
 * Keyword sets used for rule matching. Public so verify can sanity-check
 * the regex/keyword surface area.
 */
export const KEYWORDS = {
  financing: [
    "financing",
    "loan",
    "bank",
    "pag-ibig",
    "pagibig",
    "downpayment",
    "amortization",
    "monthly",
    "in-house",
    "payment",
  ],
  price: [
    "price",
    "computation",
    "how much",
    "magkano",
    "cost",
    "afford",
    "total",
  ],
  location: ["where", "location", "map", "directions", "address", "saan"],
  visuals: ["photo", "picture", "floor plan", "floorplan", "layout", "video"],
  siteVisit: [
    "site visit",
    "viewing",
    "ocular",
    "see the unit",
    "tour",
    "visit",
  ],
  qualifying: ["available", "still available", "is this", "info", "details"],
};

/** Topics that should trigger the financial/legal agent note (per PRD). */
const SENSITIVE_TOPICS = [
  "financing",
  "loan",
  "tax",
  "legal",
  "contract",
  "title",
  "capital gains",
  "transfer tax",
  "documentary stamp",
];

const AGENT_NOTE =
  "Please confirm final figures with the developer, bank, or legal team before sending.";

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function suggestReply(req: SuggestRequest): SuggestResult {
  const ruleHit = selectRule(req);
  const draft = ruleHit.draft;
  const actions = ruleHit.actions;
  const ruleName = ruleHit.name;

  // Apply tone, then language.
  const buyerFirstName = firstNameOf(req.lead.buyer.name);
  const toned = applyTone(draft, req.tone, { buyerFirstName });
  const final = applyLanguage(toned, req.language, { buyerFirstName });

  // Agent note for sensitive topics.
  const note = needsAgentNote(req) ? AGENT_NOTE : undefined;

  return {
    text: final,
    suggestedActions: actions,
    agentNote: note,
    ruleName,
  };
}

function needsAgentNote(req: SuggestRequest): boolean {
  const msg = (req.lastBuyerMessage ?? "").toLowerCase();
  return SENSITIVE_TOPICS.some((t) => msg.includes(t));
}

// ---------------------------------------------------------------------------
// Rule selection
// ---------------------------------------------------------------------------

interface RuleHit {
  name: string;
  draft: ReplyDraft;
  actions: SuggestedAction[];
}

function selectRule(req: SuggestRequest): RuleHit {
  const lead = req.lead;
  const lastMsg = (req.lastBuyerMessage ?? "").toLowerCase();
  const listing = req.listing;

  const isCold =
    lead.seedScoreCategory === "Cold" &&
    !lead.buyer.budgetMin &&
    !lead.buyer.timeline;

  // Rule 1 — Cold inquiry with no profile signals (Cherry-equivalent).
  // Must be checked FIRST and produces only a qualifying question.
  if (isCold) {
    return ruleColdQualifier(lead);
  }

  // Rule 2 — Financing-related keywords. Sensitive topic → adds agent note.
  if (matchesAny(lastMsg, KEYWORDS.financing)) {
    return ruleFinancing(lead, listing);
  }

  // Rule 3 — Price/computation request.
  if (matchesAny(lastMsg, KEYWORDS.price)) {
    return rulePriceComputation(lead, listing, req.files);
  }

  // Rule 4 — Location/map.
  if (matchesAny(lastMsg, KEYWORDS.location)) {
    return ruleLocation(lead, listing, req.files);
  }

  // Rule 5 — Visuals (photos / floor plan / video).
  if (matchesAny(lastMsg, KEYWORDS.visuals)) {
    return ruleVisuals(lead, req.files);
  }

  // Rule 6 — Hot buyer ready for site visit.
  if (
    lead.seedScoreCategory === "Hot" &&
    !lead.buyer.hasBookedSiteVisit &&
    (lead.buyer.timeline === "Within 1 Month" ||
      lead.buyer.timeline === "Within 3 Months" ||
      matchesAny(lastMsg, KEYWORDS.siteVisit))
  ) {
    return ruleHotSiteVisit(lead, listing);
  }

  // Rule 7 — Warm buyer engaged but no site visit booked yet.
  if (
    (lead.seedScoreCategory === "Warm" || lead.seedScoreCategory === "Nurture") &&
    (lead.buyer.hasOpenedBrochure || lead.buyer.hasAskedForComputation)
  ) {
    return ruleWarmSoftAsk(lead, listing);
  }

  // Rule 8 — Default friendly check-in.
  return ruleDefaultCheckIn(lead, listing);
}

// ---------------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------------

function ruleColdQualifier(lead: Lead): RuleHit {
  return {
    name: "cold-qualifier",
    draft: {
      body: "Thanks for reaching out. To make sure I match you with the best options, may I ask: what is your target budget, preferred location, and rough timeline to buy?",
      signOff: "I'll send you a few matches once I know a bit more.",
    },
    actions: [
      {
        kind: "ask_qualifying_question",
        label: "Send qualifying questions",
      },
    ],
  };
}

function ruleFinancing(lead: Lead, listing?: Listing): RuleHit {
  const price = listing?.price ? ` ${formatPHPCompact(listing.price)}` : "";
  return {
    name: "financing-explainer",
    draft: {
      body: `On financing for${price ? ` the${price} unit` : " this unit"}: typical options are bank financing (most common), in-house financing (faster approval, slightly higher rates), and Pag-IBIG for eligible buyers. A 10–20% downpayment is standard, with the balance amortized over 5–25 years.`,
      signOff:
        "I can put together a sample computation for the option that fits you best.",
    },
    actions: [
      { kind: "send_computation", label: "Send sample computation" },
      { kind: "send_brochure", label: "Send brochure" },
    ],
  };
}

function rulePriceComputation(
  lead: Lead,
  listing?: Listing,
  files?: PropertyFile[],
): RuleHit {
  const computationFile = files?.find((f) => f.category === "Computations");
  return {
    name: "price-computation",
    draft: {
      body: `Here are the headline numbers${listing ? ` for ${listing.title}` : ""}: ${listing ? formatPHPCompact(listing.price) : "price on request"}, with flexible payment terms. I can prepare a personalised sample computation based on your budget and preferred term.`,
      signOff: "Want me to send the sample computation now?",
    },
    actions: [
      {
        kind: "send_computation",
        label: "Send sample computation",
        attachFileId: computationFile?.id,
      },
    ],
  };
}

function ruleLocation(
  lead: Lead,
  listing?: Listing,
  files?: PropertyFile[],
): RuleHit {
  const mapFile = files?.find((f) => f.category === "Location Map");
  return {
    name: "location-share",
    draft: {
      body: `${listing ? `${listing.title} is in ${listing.location}.` : "Happy to share the location."} I'll send you the pinned map and the easiest landmarks to get there.`,
      signOff: "Let me know if you'd like to drive by this week.",
    },
    actions: [
      {
        kind: "send_location_map",
        label: "Send location map",
        attachFileId: mapFile?.id,
      },
      { kind: "book_site_visit", label: "Offer site visit slot" },
    ],
  };
}

function ruleVisuals(lead: Lead, files?: PropertyFile[]): RuleHit {
  const floorPlanFile = files?.find((f) => f.category === "Floor Plans");
  const brochureFile = files?.find((f) => f.category === "Brochures");
  return {
    name: "visuals-share",
    draft: {
      body: "I'll send you the photos, floor plan, and brochure right away so you can get a feel for the unit.",
      signOff: "Anything specific you want to see more of?",
    },
    actions: [
      {
        kind: "send_floor_plan",
        label: "Send floor plan",
        attachFileId: floorPlanFile?.id,
      },
      {
        kind: "send_brochure",
        label: "Send brochure",
        attachFileId: brochureFile?.id,
      },
    ],
  };
}

function ruleHotSiteVisit(lead: Lead, listing?: Listing): RuleHit {
  return {
    name: "hot-site-visit",
    draft: {
      body: `${listing ? `${listing.title} is ready for viewing.` : "The unit is ready for viewing."} I have two slots open this week — Saturday morning or Sunday afternoon.`,
      signOff: "Which works better for you?",
    },
    actions: [
      { kind: "book_site_visit", label: "Propose viewing slot" },
      { kind: "send_brochure", label: "Send brochure first" },
    ],
  };
}

function ruleWarmSoftAsk(lead: Lead, listing?: Listing): RuleHit {
  return {
    name: "warm-soft-ask",
    draft: {
      body: `Glad you've been looking through the details${listing ? ` on ${listing.title}` : ""}. A quick walkthrough on-site usually answers the last questions buyers have at this stage.`,
      signOff: "Would a 30-minute viewing this weekend work?",
    },
    actions: [
      { kind: "book_site_visit", label: "Propose viewing slot" },
      { kind: "send_computation", label: "Send computation" },
    ],
  };
}

function ruleDefaultCheckIn(lead: Lead, listing?: Listing): RuleHit {
  return {
    name: "default-check-in",
    draft: {
      body: `Just checking in${listing ? ` on ${listing.title}` : ""} — wanted to see if anything has come to mind. I'm here whenever you want to talk through the next step.`,
      signOff: "No pressure on timing.",
    },
    actions: [
      { kind: "follow_up_check_in", label: "Friendly check-in" },
      { kind: "send_brochure", label: "Send brochure" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesAny(msg: string, keywords: string[]): boolean {
  return keywords.some((k) => msg.includes(k));
}

function firstNameOf(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first ?? fullName;
}
