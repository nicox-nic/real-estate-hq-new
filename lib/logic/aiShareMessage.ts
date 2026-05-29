/**
 * AI Share Message Generator
 *
 * Generates personalized outbound messages when an agent shares a listing
 * with a buyer. Same posture as lib/logic/aiReply/suggester.ts — rule-driven,
 * profile-aware, no LLM call. Outputs a ReplyDraft that can be passed through
 * applyTone + applyLanguage from the aiReply engine.
 *
 * The MOCKUP message is the demo anchor:
 *   "Hi Maria! Based on your budget and preference for a family-friendly
 *    home in Taguig, I think this property might be a great fit for you.
 *    Laurel Hills Estate is a 4BR house and lot near schools, malls, and
 *    major roads. Would you like me to send the sample computation?"
 *
 * This output emerges naturally from the "family-friendly end-user" rule
 * applied to Maria's profile + Laurel Hills' listing. Verify locks both
 * the rule routing and the semantic shape.
 *
 * Rule set (priority order):
 *   1. ofw-buyer            — buyer.isOFW
 *   2. investor             — buyer.purposeOfPurchase === "Investment"
 *   3. luxury-buyer         — listing.price >= 25M
 *   4. family-end-user      — buyer.purposeOfPurchase === "End-User" AND familySize >= 3
 *   5. first-time-buyer     — buyer.purposeOfPurchase === "End-User" AND not family
 *   6. rental-yield         — listing.transactionType === "For Rent"
 *   7. default-introduction — fallback warm intro
 *
 * Each rule produces a ReplyDraft with a SuggestedAction recommending the
 * sample computation attachment (matching the mockup's "Would you like me
 * to send the sample computation?" closer).
 */

import type { ReplyDraft } from "@/lib/logic/aiReply/tones";
import type { SuggestedAction } from "@/lib/logic/aiReply/suggester";
import type { Listing, Lead, BuyerProfile } from "@/lib/types";

/**
 * The rule names — declarative table for transparency. Verify locks the
 * total set; UI can surface the active rule name in the AI message panel
 * header (same discipline as 3B's reply panel).
 */
export const SHARE_RULES = {
  ofwBuyer: {
    description: "OFW buyer — emphasize Pag-IBIG / OFW loan / remote process",
    priority: 1,
  },
  investor: {
    description: "Investment buyer — emphasize yield, ROI, appreciation",
    priority: 2,
  },
  luxury: {
    description: "Luxury listing (≥₱25M) — emphasize amenities, exclusivity",
    priority: 3,
  },
  familyEndUser: {
    description: "Family end-user (≥3 family size) — schools, malls, safety",
    priority: 4,
  },
  firstTimeBuyer: {
    description: "First-time end-user buyer — location convenience, terms",
    priority: 5,
  },
  rentalYield: {
    description: "Rental property — yield-focused framing",
    priority: 6,
  },
  defaultIntroduction: {
    description: "Default warm introduction matching budget + property type",
    priority: 99,
  },
} as const;

export type ShareRule = keyof typeof SHARE_RULES;

export interface ShareMessageRequest {
  listing: Listing;
  /** The selected buyer lead (carries buyer profile + agent context). */
  lead: Lead;
  /** The sharing agent's first name, used for sign-off if needed. */
  agentFirstName?: string;
}

export interface ShareMessageResult {
  /** Which rule fired. Surfaced in the UI for transparency. */
  rule: ShareRule;
  /** Description of the rule. */
  ruleDescription: string;
  /** The structured draft. Pass through applyTone + applyLanguage from aiReply. */
  draft: ReplyDraft;
  /** Suggested attachments / next actions to surface beneath the message. */
  actions: SuggestedAction[];
}

// ----------------------------------------------------------------------------
// Generation
// ----------------------------------------------------------------------------

/**
 * Pure: same input → same output. Determinism locked by verify.
 */
export function generateShareMessage(
  req: ShareMessageRequest,
): ShareMessageResult {
  const { listing, lead } = req;
  const buyer = lead.buyer;
  const firstName = firstNameOf(buyer.name);

  // Rule routing in priority order.
  if (buyer.isOFW) {
    return ofwRule(firstName, buyer, listing);
  }
  if (buyer.purposeOfPurchase === "Investment") {
    return investorRule(firstName, buyer, listing);
  }
  if (listing.price >= 25_000_000) {
    return luxuryRule(firstName, buyer, listing);
  }
  if (
    buyer.purposeOfPurchase === "End-User" &&
    (buyer.familySize ?? 0) >= 3
  ) {
    return familyEndUserRule(firstName, buyer, listing);
  }
  if (buyer.purposeOfPurchase === "End-User") {
    return firstTimeBuyerRule(firstName, buyer, listing);
  }
  if (listing.transactionType === "For Rent") {
    return rentalRule(firstName, buyer, listing);
  }
  return defaultRule(firstName, buyer, listing);
}

// ----------------------------------------------------------------------------
// Rule implementations
// ----------------------------------------------------------------------------

function familyEndUserRule(
  firstName: string,
  buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const location = primaryLocation(buyer, listing);
  const bodyL1 = `Based on your budget and preference for a family-friendly home in ${location}, I think this property might be a great fit for you.`;
  const propertySummary = describeProperty(listing);
  const bodyL2 = `${listing.title} is ${propertySummary} near schools, malls, and major roads.`;
  const bodyL3 = `Would you like me to send the sample computation?`;
  return {
    rule: "familyEndUser",
    ruleDescription: SHARE_RULES.familyEndUser.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [
      { kind: "send_computation", label: "Attach sample computation" },
      { kind: "send_brochure", label: "Attach brochure" },
      { kind: "book_site_visit", label: "Suggest a site visit" },
    ],
  };
}

function firstTimeBuyerRule(
  firstName: string,
  buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const location = primaryLocation(buyer, listing);
  const bodyL1 = `I think this ${describePropertyShort(listing)} in ${location} might be a good match for what you're looking for.`;
  const bodyL2 = `${listing.title} offers flexible payment terms and is well-located for daily living.`;
  const bodyL3 = `Want me to send the sample computation so you can see the monthly breakdown?`;
  return {
    rule: "firstTimeBuyer",
    ruleDescription: SHARE_RULES.firstTimeBuyer.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [
      { kind: "send_computation", label: "Attach sample computation" },
      { kind: "send_brochure", label: "Attach brochure" },
    ],
  };
}

function ofwRule(
  firstName: string,
  _buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const bodyL1 = `I want to make sure I send you the right options while you're abroad — this property looks like a strong match for your goals.`;
  const bodyL2 = `${listing.title} (${listing.propertyType}) qualifies for Pag-IBIG and OFW-friendly bank financing. The full process can be managed remotely with your SPA representative here.`;
  const bodyL3 = `Want me to send the sample computation with the OFW payment terms?`;
  return {
    rule: "ofwBuyer",
    ruleDescription: SHARE_RULES.ofwBuyer.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [
      { kind: "send_computation", label: "Attach OFW computation" },
      { kind: "send_brochure", label: "Attach brochure" },
    ],
  };
}

function investorRule(
  firstName: string,
  _buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const bodyL1 = `I think this might be worth a look for your portfolio — the numbers work well for the location.`;
  const bodyL2 = `${listing.title} is a ${describePropertyShort(listing)} priced at ${formatPriceCompact(listing.price)} with healthy projected rental yield and ${(listing.commissionRate * 100).toFixed(1)}% commission. The area has consistent appreciation.`;
  const bodyL3 = `Want me to send the ROI computation and projected rental yield?`;
  return {
    rule: "investor",
    ruleDescription: SHARE_RULES.investor.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [
      { kind: "send_computation", label: "Attach ROI computation" },
      { kind: "send_brochure", label: "Attach investment brief" },
    ],
  };
}

function luxuryRule(
  firstName: string,
  _buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const bodyL1 = `I have an offering I think you'll appreciate.`;
  const bodyL2 = `${listing.title} is an exceptional ${describePropertyShort(listing)} in ${listing.location} at ${formatPriceCompact(listing.price)}. The amenities and finishes match the level you're looking for.`;
  const bodyL3 = `Would you like a private viewing arranged for you?`;
  return {
    rule: "luxury",
    ruleDescription: SHARE_RULES.luxury.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [
      { kind: "book_site_visit", label: "Suggest a private viewing" },
      { kind: "send_brochure", label: "Attach brochure" },
    ],
  };
}

function rentalRule(
  firstName: string,
  _buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const rate = listing.rentalRate ?? listing.price;
  const bodyL1 = `This rental opened up and matches what you mentioned looking for.`;
  const bodyL2 = `${listing.title} in ${listing.location} is available at ${formatPriceCompact(rate)} per month.`;
  const bodyL3 = `Want me to set up a viewing this week?`;
  return {
    rule: "rentalYield",
    ruleDescription: SHARE_RULES.rentalYield.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [{ kind: "book_site_visit", label: "Set up a viewing" }],
  };
}

function defaultRule(
  firstName: string,
  _buyer: BuyerProfile,
  listing: Listing,
): ShareMessageResult {
  const bodyL1 = `I came across a property I'd like to share with you.`;
  const bodyL2 = `${listing.title} is a ${describePropertyShort(listing)} in ${listing.location}, priced at ${formatPriceCompact(listing.price)}.`;
  const bodyL3 = `Want me to send more details?`;
  return {
    rule: "defaultIntroduction",
    ruleDescription: SHARE_RULES.defaultIntroduction.description,
    draft: {
      body: `${bodyL1}\n\n${bodyL2}\n\n${bodyL3}`,
    },
    actions: [{ kind: "send_brochure", label: "Attach brochure" }],
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function firstNameOf(fullName: string): string {
  const first = fullName.split(/\s+/)[0];
  return first ?? fullName;
}

function primaryLocation(buyer: BuyerProfile, listing: Listing): string {
  // Prefer the buyer's preferred location if the listing matches it.
  const buyerLocs = buyer.preferredLocations ?? [];
  for (const loc of buyerLocs) {
    if (listing.location.toLowerCase().includes(loc.toLowerCase())) {
      return loc;
    }
  }
  // Otherwise extract the city/district from the listing location string.
  const parts = listing.location.split(",").map((s) => s.trim());
  return parts[0] ?? listing.location;
}

function describeProperty(listing: Listing): string {
  // "a 4BR house and lot" — extract bedrooms from title or propertyType.
  const blob = `${listing.title} ${listing.propertyType}`;
  const m = blob.match(/(\d+)\s?(?:br|bedroom|bed)/i);
  const bedrooms = m && m[1] ? parseInt(m[1], 10) : undefined;
  // Strip any "NBR" prefix from propertyType to avoid duplication
  // ("4BR House & Lot" → "House & Lot").
  const typeRaw = listing.propertyType.replace(
    /^\s*\d+\s?(?:br|bedroom|bed)\s+/i,
    "",
  );
  const typeLower = typeRaw.toLowerCase();
  if (bedrooms !== undefined) {
    return `a ${bedrooms}BR ${typeLower}`;
  }
  return `a ${typeLower}`;
}

/** Returns just the type noun (no leading article, no bedroom count). */
function describePropertyShort(listing: Listing): string {
  const typeRaw = listing.propertyType.replace(
    /^\s*\d+\s?(?:br|bedroom|bed)\s+/i,
    "",
  );
  return typeRaw.toLowerCase();
}

function formatPriceCompact(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const s = m.toFixed(m % 1 === 0 ? 0 : 1);
    return `₱${s}M`;
  }
  if (n >= 1000) {
    return `₱${(n / 1000).toFixed(0)}k`;
  }
  return `₱${n}`;
}
