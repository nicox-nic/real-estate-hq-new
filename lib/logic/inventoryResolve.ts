import {
  seedDevelopers,
  seedListings,
  seedProjects,
  seedUnits,
} from "@/lib/data";
import type { Listing, Project, Unit } from "@/lib/types";

export type ResolvedInventory = {
  /** ID in the URL (listing id or unit id). */
  routeId: string;
  listing: Listing;
  unit?: Unit;
  project?: Project;
};

/**
 * Resolve a /listings/[id] route param to a Listing for UI and share flows.
 * Accepts listing ids, unit ids, or listing ids when the param is the linked unit id.
 */
export function resolveInventoryByRouteId(
  routeId: string,
): ResolvedInventory | null {
  const direct = seedListings.find((l) => l.id === routeId);
  if (direct) {
    return enrich(direct, routeId);
  }

  const listingForUnit = seedListings.find((l) => l.unitId === routeId);
  if (listingForUnit) {
    return enrich(listingForUnit, routeId);
  }

  const unit = seedUnits.find((u) => u.id === routeId);
  if (!unit) return null;

  const project = seedProjects.find((p) => p.id === unit.projectId);
  if (!project) return null;

  return {
    routeId,
    listing: syntheticListingFromUnit(unit, project),
    unit,
    project,
  };
}

function enrich(listing: Listing, routeId: string): ResolvedInventory {
  const unit = listing.unitId
    ? seedUnits.find((u) => u.id === listing.unitId)
    : undefined;
  const project = listing.projectId
    ? seedProjects.find((p) => p.id === listing.projectId)
    : undefined;
  return { routeId, listing, unit, project };
}

function syntheticListingFromUnit(unit: Unit, project: Project): Listing {
  const developer = seedDevelopers.find((d) => d.id === project.developerId);
  return {
    id: unit.id,
    title: `${project.name} — ${unit.unitType}`,
    location: project.location,
    propertyType: project.propertyType,
    price: unit.price,
    ownership: "Developer Listing",
    transactionType: "For Sale",
    availability: unit.availability,
    commissionRate: project.commissionRate,
    developerId: project.developerId,
    projectId: project.id,
    unitId: unit.id,
    engagementCount: 0,
    verificationStatus: "Verified",
    tags: developer?.locationsCovered?.slice(0, 2) ?? [],
    createdAt: "2025-04-01T00:00:00.000Z",
    assignedAgentIds: [],
  };
}
