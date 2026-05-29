/**
 * AI File Recommendation
 *
 * Given a buyer + listing + available files, returns the recommended subset
 * with explanation. Pure function — no LLM, no IO. Surfaces inside the
 * Attach Files bottom sheet per the Session 5A routing decision:
 *
 *   "AI recommendations surface in the contextual sheet where the relevant
 *    decision is made, not as permanent sidebars."
 *
 * Rule set mirrors the AI Share Message engine: same profile signals drive
 * the recommendation, so the messaging and the attachments are in agreement
 * (a family-end-user gets a family-friendly message AND a family-friendly
 * file pack). This is the codebase's third declarative rule table after
 * TONE_MARKERS and SEARCH_RULES, and the fifth after SHARE_RULES + AI Reply
 * rules — Rule of Five for declarative rule tables.
 *
 * Routing:
 *   - Investor → brochure + computation + (yield-bearing file if present)
 *   - OFW → brochure + computation + payment terms (Pag-IBIG / OFW terms)
 *   - Family end-user → brochure + computation + floor plan + location map
 *   - Luxury (≥₱25M listing) → brochure + photos + floor plan
 *   - First-time end-user → brochure + computation
 *   - Rental → brochure + price list
 *   - Default → brochure + computation
 *
 * Verify locks the routing per profile + the "different buyers get different
 * recommendations on the same listing" structural proof.
 */

import type {
  Lead,
  Listing,
  PropertyFile,
  FileCategory,
} from "@/lib/types";

export const FILE_RECOMMENDATION_RULES = {
  investor: {
    description:
      "Investor buyer — brochure, computation, and yield/comparables if available",
    categories: ["Brochures", "Computations", "Price List"] as FileCategory[],
  },
  ofw: {
    description:
      "OFW buyer — brochure, computation, payment terms (Pag-IBIG / OFW)",
    categories: ["Brochures", "Computations", "Payment Terms"] as FileCategory[],
  },
  familyEndUser: {
    description:
      "Family end-user — brochure, computation, floor plan, location map (schools, malls, neighborhood context)",
    categories: [
      "Brochures",
      "Computations",
      "Floor Plans",
      "Location Map",
    ] as FileCategory[],
  },
  luxury: {
    description:
      "Luxury buyer (listing ≥₱25M) — brochure, photos, floor plan",
    categories: ["Brochures", "Photos", "Floor Plans"] as FileCategory[],
  },
  firstTimeBuyer: {
    description: "First-time end-user — brochure + computation",
    categories: ["Brochures", "Computations"] as FileCategory[],
  },
  rental: {
    description: "Rental property — brochure + price list",
    categories: ["Brochures", "Price List"] as FileCategory[],
  },
  default: {
    description: "Default — brochure + computation",
    categories: ["Brochures", "Computations"] as FileCategory[],
  },
} as const;

export type FileRecommendationRule = keyof typeof FILE_RECOMMENDATION_RULES;

export interface FileRecommendationRequest {
  lead: Lead;
  listing: Listing;
  availableFiles: PropertyFile[];
}

export interface FileRecommendationResult {
  /** Which rule fired. Surfaced in the sheet header for transparency. */
  rule: FileRecommendationRule;
  /** Description of the rule. */
  ruleDescription: string;
  /** The recommended categories in priority order. */
  recommendedCategories: FileCategory[];
  /** The recommended file IDs — categories resolved to files from
   *  availableFiles. At most one file per category (the first match
   *  with the most engagement signal, or the official developer file
   *  if present). */
  recommendedFileIds: string[];
}

/**
 * Pure: same input → same output. Determinism locked by verify.
 */
export function recommendFilesFor(
  req: FileRecommendationRequest,
): FileRecommendationResult {
  const buyer = req.lead.buyer;
  const listing = req.listing;

  // Rule routing — same priority order as aiShareMessage
  let rule: FileRecommendationRule;
  if (buyer.isOFW) {
    rule = "ofw";
  } else if (buyer.purposeOfPurchase === "Investment") {
    rule = "investor";
  } else if (listing.price >= 25_000_000) {
    rule = "luxury";
  } else if (
    buyer.purposeOfPurchase === "End-User" &&
    (buyer.familySize ?? 0) >= 3
  ) {
    rule = "familyEndUser";
  } else if (buyer.purposeOfPurchase === "End-User") {
    rule = "firstTimeBuyer";
  } else if (listing.transactionType === "For Rent") {
    rule = "rental";
  } else {
    rule = "default";
  }

  const spec = FILE_RECOMMENDATION_RULES[rule];
  const recommendedCategories = [...spec.categories];

  // Resolve categories → file IDs. Prefer official developer files when
  // available; otherwise the first file in the category.
  const recommendedFileIds: string[] = [];
  for (const cat of recommendedCategories) {
    const candidates = req.availableFiles.filter((f) => f.category === cat);
    if (candidates.length === 0) continue;
    // Prefer official developer files
    const official = candidates.find((c) => c.isOfficialDeveloperFile);
    recommendedFileIds.push((official ?? candidates[0]!).id);
  }

  return {
    rule,
    ruleDescription: spec.description,
    recommendedCategories,
    recommendedFileIds,
  };
}

/**
 * Helper for verify and the sheet header: list all file categories that
 * appear as recommendations for ANY rule. Useful to assert taxonomy
 * completeness.
 */
export function allRecommendableCategories(): Set<FileCategory> {
  const set = new Set<FileCategory>();
  for (const k of Object.keys(FILE_RECOMMENDATION_RULES) as FileRecommendationRule[]) {
    for (const c of FILE_RECOMMENDATION_RULES[k].categories) {
      set.add(c);
    }
  }
  return set;
}
