/**
 * Listings Derivations
 *
 * Pure helpers backing the Listings spine (Menu → Category → Developers →
 * Projects → Units). Centralizes the queries the listing surfaces need so
 * UI components never duplicate filtering logic.
 *
 * Architecturally identical to dashboardDerivations and leadInboxDerivations:
 * a single module that the UI consumes; verify locks the shapes.
 */

import type {
  DeveloperProfile,
  Listing,
  Project,
  TransactionType,
  Unit,
  ListingAvailability,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Listings Menu — category counts
// ---------------------------------------------------------------------------

/** The 7 PRD-listed transaction categories, in display order. */
export const TRANSACTION_CATEGORIES: TransactionType[] = [
  "For Sale",
  "For Rent",
  "Foreclosure",
  "For Assume",
  "Pre-Selling",
  "RFO",
  "Commercial",
];

/**
 * Stable URL slug for each transaction category. Single source of truth —
 * page routes and links both reference this map. Verify locks the URL
 * structure so route renames don't drift.
 */
export const CATEGORY_SLUGS: Record<TransactionType, string> = {
  "For Sale": "for-sale",
  "For Rent": "for-rent",
  Foreclosure: "foreclosure",
  "For Assume": "for-assume",
  "Pre-Selling": "pre-selling",
  RFO: "rfo",
  Commercial: "commercial",
};

/** Reverse lookup: slug → category. */
export function categoryFromSlug(slug: string): TransactionType | undefined {
  for (const c of TRANSACTION_CATEGORIES) {
    if (CATEGORY_SLUGS[c] === slug) return c;
  }
  return undefined;
}

export interface CategoryCount {
  category: TransactionType;
  count: number;
}

/** Returns count of listings per transaction category, in PRD order. */
export function listingsByCategory(listings: Listing[]): CategoryCount[] {
  const counts = new Map<TransactionType, number>();
  for (const c of TRANSACTION_CATEGORIES) counts.set(c, 0);
  for (const l of listings) {
    counts.set(l.transactionType, (counts.get(l.transactionType) ?? 0) + 1);
  }
  return TRANSACTION_CATEGORIES.map((c) => ({
    category: c,
    count: counts.get(c) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Developer-level helpers
// ---------------------------------------------------------------------------

export interface DeveloperWithStats {
  developer: DeveloperProfile;
  projects: Project[];
  totalUnits: number;
  availableUnits: number;
}

/**
 * Returns developer cards enriched with live counts derived from seed
 * projects + units. The static developer fields (priceRangeMin/Max,
 * locationsCovered, etc.) remain authoritative for editorial framing.
 */
export function enrichDevelopers(
  developers: DeveloperProfile[],
  projects: Project[],
  units: Unit[],
): DeveloperWithStats[] {
  return developers.map((d) => {
    const devProjects = projects.filter((p) => p.developerId === d.id);
    const projectIds = new Set(devProjects.map((p) => p.id));
    const devUnits = units.filter((u) => projectIds.has(u.projectId));
    const available = devUnits.filter(
      (u) => u.availability === "Available" || u.availability === "Sold Out Soon",
    );
    return {
      developer: d,
      projects: devProjects,
      totalUnits: devUnits.length,
      availableUnits: available.length,
    };
  });
}

// ---------------------------------------------------------------------------
// Project-level helpers
// ---------------------------------------------------------------------------

export interface ProjectWithStats {
  project: Project;
  totalUnits: number;
  availableUnits: number;
  priceRangeMin: number;
  priceRangeMax: number;
}

/**
 * For a given developer, returns enriched project cards. Available-count is
 * derived live from units (single source of truth) rather than the static
 * `availableUnitsCount` field on Project (which is editorial and may drift).
 */
export function projectsForDeveloper(
  developerId: string,
  projects: Project[],
  units: Unit[],
): ProjectWithStats[] {
  const devProjects = projects.filter((p) => p.developerId === developerId);
  return devProjects.map((p) => {
    const projUnits = units.filter((u) => u.projectId === p.id);
    const available = projUnits.filter(
      (u) => u.availability === "Available" || u.availability === "Sold Out Soon",
    );
    const prices = projUnits.map((u) => u.price);
    const min = prices.length > 0 ? Math.min(...prices) : p.priceRangeMin;
    const max = prices.length > 0 ? Math.max(...prices) : p.priceRangeMax;
    return {
      project: p,
      totalUnits: projUnits.length,
      availableUnits: available.length,
      priceRangeMin: min,
      priceRangeMax: max,
    };
  });
}

// ---------------------------------------------------------------------------
// Unit-level helpers
// ---------------------------------------------------------------------------

/** Returns units for a project, sorted by availability then by price ascending. */
export function unitsForProject(
  projectId: string,
  units: Unit[],
): Unit[] {
  return units
    .filter((u) => u.projectId === projectId)
    .sort((a, b) => {
      const aAvail = availabilitySortKey(a.availability);
      const bAvail = availabilitySortKey(b.availability);
      if (aAvail !== bAvail) return aAvail - bAvail;
      return a.price - b.price;
    });
}

function availabilitySortKey(a: ListingAvailability): number {
  switch (a) {
    case "Available":
      return 0;
    case "Sold Out Soon":
      return 1;
    case "Reserved":
      return 2;
    case "Sold":
      return 3;
  }
}

// ---------------------------------------------------------------------------
// Unit Inventory View filters
// ---------------------------------------------------------------------------

/**
 * Filter chips shown above the Unit Inventory View. Chosen to surface the
 * decisions a buyer-facing agent makes most often.
 */
export type UnitFilter =
  | "All"
  | "Available"
  | "Reserved"
  | "Sold"
  | "Studio"
  | "1BR"
  | "2BR"
  | "3BR+";

export const UNIT_FILTERS: UnitFilter[] = [
  "All",
  "Available",
  "Reserved",
  "Sold",
  "Studio",
  "1BR",
  "2BR",
  "3BR+",
];

export function applyUnitFilter(units: Unit[], filter: UnitFilter): Unit[] {
  if (filter === "All") return units;
  if (filter === "Available")
    return units.filter(
      (u) =>
        u.availability === "Available" || u.availability === "Sold Out Soon",
    );
  if (filter === "Reserved") return units.filter((u) => u.availability === "Reserved");
  if (filter === "Sold") return units.filter((u) => u.availability === "Sold");
  if (filter === "Studio")
    return units.filter((u) => u.bedrooms === 0);
  if (filter === "1BR")
    return units.filter((u) => u.bedrooms === 1);
  if (filter === "2BR")
    return units.filter((u) => u.bedrooms === 2);
  if (filter === "3BR+")
    return units.filter((u) => u.bedrooms >= 3);
  return units;
}

// ---------------------------------------------------------------------------
// Developer / project lookups
// ---------------------------------------------------------------------------

export function findDeveloper(
  developerId: string,
  developers: DeveloperProfile[],
): DeveloperProfile | undefined {
  return developers.find((d) => d.id === developerId);
}

export function findProject(
  projectId: string,
  projects: Project[],
): Project | undefined {
  return projects.find((p) => p.id === projectId);
}
