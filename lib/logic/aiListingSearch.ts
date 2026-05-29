/**
 * AI Listing Search
 * ===========================================================================
 *
 * Per PRD: "Allow natural language search: 'Show me Landmasters condos under
 * ₱8M in Cebu.' / 'Find private house and lot listings in Banawa with at
 * least 2% commission.' / etc."
 *
 * Implementation: deterministic rule-based keyword extraction. Same posture
 * as the AI Reply engine in Session 3B — no real LLM call; a curated set of
 * extraction rules whose behavior is fully verify-locked. The "AI" framing
 * holds because the value is in (a) the natural-language input, (b) the
 * structured output, and (c) the transparency of showing which keywords
 * were extracted (just like the Reply panel surfaces the rule name).
 *
 * Architecture mirrors lib/logic/aiReply/:
 *   - Pure functions only (no side effects, no state).
 *   - Extraction is rule-based; rules run in declared order.
 *   - Output is a structured ExtractedQuery; the FILTER application is
 *     a separate pure function.
 *   - Test harness pairs (input → extraction → matched listings).
 *
 * Future expansion: add more keyword rules (developer name match, OFW intent,
 * "near schools", etc.) without changing the ExtractedQuery shape.
 */

import type { Listing } from "@/lib/types";

// ----------------------------------------------------------------------------
// Extracted query shape
// ----------------------------------------------------------------------------

export interface ExtractedQuery {
  /** Free-text terms not absorbed by other rules; matched as case-insensitive substrings on title + tags + location. */
  freeText: string[];
  /** Bedroom count filter: e.g. "2BR" extracts 2. */
  bedrooms?: number;
  /** Maximum price (PHP). "under 10M" / "below 8 million" extracts 10_000_000 / 8_000_000. */
  maxPrice?: number;
  /** Minimum price (PHP). "above 20M" extracts 20_000_000. */
  minPrice?: number;
  /** Transaction type (For Sale / For Rent / Foreclosure / etc.). */
  transactionType?: Listing["transactionType"];
  /** Property type ("condo" / "house and lot" / "lot" / "townhouse" / "commercial"). */
  propertyType?: string;
  /** Location substring (city / district name). */
  location?: string;
  /** Minimum commission rate as decimal: "≥3%" → 0.03. */
  minCommission?: number;
}

// ----------------------------------------------------------------------------
// Rule definitions — declarative table for transparency
// ----------------------------------------------------------------------------

/**
 * Vocabulary table. Each rule has:
 *   - name: surfaced in the transparency chip (mirrors Reply rule-name pattern)
 *   - matches: regex
 *   - extract: how to coerce the match into the ExtractedQuery field
 *
 * This table is the public, verify-locked contract — tests assert each rule
 * fires on its example input.
 */
export const SEARCH_RULES = {
  bedrooms: {
    description: "Bedroom count (e.g. '2BR', '3 bedroom')",
    pattern: /(\d+)\s?(?:br|bedroom|bed)/i,
  },
  maxPriceM: {
    description: "Max price in millions (e.g. 'under 10M', 'below 8 million')",
    pattern: /(?:under|below|less than|max|up to|at most)\s+(?:₱|php)?\s?(\d+(?:\.\d+)?)\s?(?:m|mn|million)\b/i,
  },
  minPriceM: {
    description: "Min price in millions (e.g. 'above 20M', 'over 15 million')",
    pattern: /(?:above|over|more than|min|at least|starting at)\s+(?:₱|php)?\s?(\d+(?:\.\d+)?)\s?(?:m|mn|million)\b/i,
  },
  minCommission: {
    description: "Min commission rate (e.g. 'at least 3% commission', '≥2.5%')",
    pattern: /(?:at\s?least|min|minimum|over|above|≥|>=)\s*(\d+(?:\.\d+)?)\s?%/i,
  },
  forRent: {
    description: "For Rent transaction (keyword: 'rent', 'rental')",
    pattern: /\b(for rent|rental[s]?|to rent|to lease|lease)\b/i,
  },
  foreclosure: {
    description: "Foreclosure transaction",
    pattern: /\b(foreclosure[s]?|bank[-\s]?acquired|distressed)\b/i,
  },
  forAssume: {
    description: "For Assume / Assume Balance",
    pattern: /\b(for assume|assume balance|assumed)\b/i,
  },
  preSelling: {
    description: "Pre-Selling transaction",
    pattern: /\b(pre[-\s]?selling|pre[-\s]?sale[s]?)\b/i,
  },
  rfo: {
    description: "Ready For Occupancy",
    pattern: /\b(rfo|ready for occupancy|move[-\s]?in)\b/i,
  },
  commercial: {
    description: "Commercial transaction",
    pattern: /\b(commercial|office space|retail space)\b/i,
  },
  condo: {
    description: "Condo property type",
    pattern: /\bcondo(?:minium)?[s]?\b/i,
  },
  houseAndLot: {
    description: "House and Lot property type",
    pattern: /\b(house[s]? and lot[s]?|house\s?&\s?lot|h&l|single[-\s]?detached)\b/i,
  },
  townhouse: {
    description: "Townhouse property type",
    pattern: /\btownhouse[s]?|townhome[s]?\b/i,
  },
  lotOnly: {
    description: "Lot Only property type",
    pattern: /\b(lot only|vacant lot|subdivision lot)\b/i,
  },
} as const;

// ----------------------------------------------------------------------------
// Location vocabulary (case-insensitive substring match in seed locations)
// ----------------------------------------------------------------------------

/**
 * Known PH location keywords. When a query contains one, we lock it as the
 * "location" filter and remove from freeText. Order matters: longer phrases
 * first so "Cebu Business Park" wins over the substring "Cebu".
 */
export const LOCATION_KEYWORDS = [
  "Cebu Business Park",
  "Cebu IT Park",
  "Cebu City",
  "Quezon City",
  "Ortigas Center",
  "Ortigas",
  "Makati CBD",
  "Makati",
  "Rockwell",
  "Mandaue",
  "Mactan",
  "Lapu-Lapu",
  "Banawa",
  "Banilad",
  "Talamban",
  "Talisay",
  "BGC",
  "Taguig",
  "Pasay",
  "Pasig",
  "Parañaque",
  "Fairview",
  "Ayala Heights",
  "Manila",
  // Standalone last so "Cebu Business Park" etc. win first.
  "Cebu",
] as const;

// ----------------------------------------------------------------------------
// Extraction
// ----------------------------------------------------------------------------

/**
 * Parses a free-form query into a structured ExtractedQuery.
 * Deterministic: same input → same output.
 */
export function extractQuery(input: string): ExtractedQuery {
  let remaining = input.trim();
  const out: ExtractedQuery = { freeText: [] };

  // Bedrooms
  const bedM = remaining.match(SEARCH_RULES.bedrooms.pattern);
  if (bedM && bedM[1]) {
    out.bedrooms = parseInt(bedM[1], 10);
    remaining = remaining.replace(bedM[0], " ");
  }

  // Max price
  const maxPriceM = remaining.match(SEARCH_RULES.maxPriceM.pattern);
  if (maxPriceM && maxPriceM[1]) {
    out.maxPrice = Math.round(parseFloat(maxPriceM[1]) * 1_000_000);
    remaining = remaining.replace(maxPriceM[0], " ");
  }

  // Min price
  const minPriceM = remaining.match(SEARCH_RULES.minPriceM.pattern);
  if (minPriceM && minPriceM[1]) {
    out.minPrice = Math.round(parseFloat(minPriceM[1]) * 1_000_000);
    remaining = remaining.replace(minPriceM[0], " ");
  }

  // Min commission
  const minCommM = remaining.match(SEARCH_RULES.minCommission.pattern);
  if (minCommM && minCommM[1]) {
    out.minCommission = parseFloat(minCommM[1]) / 100;
    remaining = remaining.replace(minCommM[0], " ");
  }

  // Transaction type (more specific first)
  const transactionRules: Array<[Listing["transactionType"], RegExp]> = [
    ["For Rent", SEARCH_RULES.forRent.pattern],
    ["Foreclosure", SEARCH_RULES.foreclosure.pattern],
    ["For Assume", SEARCH_RULES.forAssume.pattern],
    ["Pre-Selling", SEARCH_RULES.preSelling.pattern],
    ["RFO", SEARCH_RULES.rfo.pattern],
    ["Commercial", SEARCH_RULES.commercial.pattern],
  ];
  for (const [type, pattern] of transactionRules) {
    if (pattern.test(remaining)) {
      out.transactionType = type;
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  // Property type (more specific first)
  const propTypeRules: Array<[string, RegExp]> = [
    ["House and Lot", SEARCH_RULES.houseAndLot.pattern],
    ["Townhouse", SEARCH_RULES.townhouse.pattern],
    ["Lot Only", SEARCH_RULES.lotOnly.pattern],
    ["Condo", SEARCH_RULES.condo.pattern],
  ];
  for (const [type, pattern] of propTypeRules) {
    if (pattern.test(remaining)) {
      out.propertyType = type;
      remaining = remaining.replace(pattern, " ");
      break;
    }
  }

  // Location (case-insensitive substring; longest-first list)
  for (const loc of LOCATION_KEYWORDS) {
    const re = new RegExp(`\\b${escapeRegex(loc)}\\b`, "i");
    if (re.test(remaining)) {
      out.location = loc;
      remaining = remaining.replace(re, " ");
      break;
    }
  }

  // Whatever survives becomes free-text tokens
  out.freeText = remaining
    .replace(/[^\w\s-]/g, " ") // strip punctuation
    .split(/\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 3 && !STOPWORDS.has(s));

  return out;
}

const STOPWORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "show",
  "me",
  "find",
  "any",
  "all",
  "some",
  "give",
  "list",
  "have",
  "are",
  "near",
  "from",
  "this",
  "that",
  "these",
  "those",
  "want",
  "need",
  "looking",
  "looking-for",
  // Structural words that the search rules already absorb meaning from —
  // their orphan presence after extraction is noise, not a filter signal.
  "properties",
  "property",
  "listings",
  "listing",
  "commission",
  "buyer",
  "buyers",
  "options",
  "available",
  "least",
  "best",
  "good",
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ----------------------------------------------------------------------------
// Application — given an ExtractedQuery, filter a listings array
// ----------------------------------------------------------------------------

export function applyQuery(
  query: ExtractedQuery,
  listings: Listing[],
): Listing[] {
  return listings.filter((l) => matches(query, l));
}

function matches(q: ExtractedQuery, l: Listing): boolean {
  if (q.bedrooms !== undefined) {
    // Listings don't store bedrooms directly; derive from propertyType when possible.
    // For a more accurate match in a real system we'd reach Unit data; here we
    // accept any condo/HL/townhouse with the bedroom number in the title/type.
    const bedroomsInTitle = parseBedroomsFromTitle(l.title, l.propertyType);
    if (bedroomsInTitle !== undefined && bedroomsInTitle !== q.bedrooms)
      return false;
    // If we can't determine bedrooms from a listing's text, don't exclude it
    // — be permissive on ambiguity (transparency chip still shows the filter).
  }
  if (q.maxPrice !== undefined && l.price > q.maxPrice) return false;
  if (q.minPrice !== undefined && l.price < q.minPrice) return false;
  if (q.transactionType !== undefined && l.transactionType !== q.transactionType)
    return false;
  if (q.propertyType !== undefined && l.propertyType !== q.propertyType)
    return false;
  if (q.location !== undefined) {
    if (!l.location.toLowerCase().includes(q.location.toLowerCase())) return false;
  }
  if (q.minCommission !== undefined && l.commissionRate < q.minCommission)
    return false;
  if (q.freeText.length > 0) {
    const hay = (
      l.title +
      " " +
      l.location +
      " " +
      (l.tags ?? []).join(" ")
    ).toLowerCase();
    if (!q.freeText.every((t) => hay.includes(t))) return false;
  }
  return true;
}

/**
 * Pulls a bedroom count out of a title or propertyType string if present.
 * Returns undefined when nothing matches — caller treats undefined as "don't
 * exclude on this axis."
 */
function parseBedroomsFromTitle(
  title: string,
  propertyType: string,
): number | undefined {
  const blob = `${title} ${propertyType}`;
  const m = blob.match(/(\d+)\s?(?:br|bedroom|bed)/i);
  if (m && m[1]) return parseInt(m[1], 10);
  if (/\bstudio\b/i.test(blob)) return 0;
  return undefined;
}

// ----------------------------------------------------------------------------
// Transparency chips — what filters got extracted
// ----------------------------------------------------------------------------

export interface TransparencyChip {
  /** "2BR", "≤₱10M", "BGC", "House and Lot" */
  label: string;
  /** Internal key — verify locks the chip set per query. */
  kind:
    | "bedrooms"
    | "maxPrice"
    | "minPrice"
    | "transactionType"
    | "propertyType"
    | "location"
    | "minCommission"
    | "freeText";
}

/**
 * Renders the ExtractedQuery as user-visible chips. Mirrors the AI Reply
 * panel's "rule: cold-qualifier" transparency: stakeholders see exactly
 * what the search interpreted.
 */
export function transparencyChipsFor(q: ExtractedQuery): TransparencyChip[] {
  const chips: TransparencyChip[] = [];
  if (q.bedrooms !== undefined) {
    chips.push({
      label: q.bedrooms === 0 ? "Studio" : `${q.bedrooms}BR`,
      kind: "bedrooms",
    });
  }
  if (q.propertyType) {
    chips.push({ label: q.propertyType, kind: "propertyType" });
  }
  if (q.transactionType) {
    chips.push({ label: q.transactionType, kind: "transactionType" });
  }
  if (q.location) {
    chips.push({ label: q.location, kind: "location" });
  }
  if (q.maxPrice !== undefined) {
    chips.push({ label: `≤${formatM(q.maxPrice)}`, kind: "maxPrice" });
  }
  if (q.minPrice !== undefined) {
    chips.push({ label: `≥${formatM(q.minPrice)}`, kind: "minPrice" });
  }
  if (q.minCommission !== undefined) {
    chips.push({
      label: `≥${(q.minCommission * 100).toFixed(1).replace(/\.0$/, "")}% comm`,
      kind: "minCommission",
    });
  }
  if (q.freeText.length > 0) {
    chips.push({
      label: `"${q.freeText.join(" ")}"`,
      kind: "freeText",
    });
  }
  return chips;
}

function formatM(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `₱${m.toFixed(m % 1 === 0 ? 0 : 1)}M`;
  }
  return `₱${(n / 1000).toFixed(0)}k`;
}

// ----------------------------------------------------------------------------
// One-shot convenience
// ----------------------------------------------------------------------------

/**
 * End-to-end: take a natural-language input and a listings array; return
 * the structured query, matching listings, and transparency chips.
 */
export interface SearchResult {
  query: ExtractedQuery;
  matches: Listing[];
  chips: TransparencyChip[];
}

export function searchListings(
  input: string,
  listings: Listing[],
): SearchResult {
  const query = extractQuery(input);
  return {
    query,
    matches: applyQuery(query, listings),
    chips: transparencyChipsFor(query),
  };
}
