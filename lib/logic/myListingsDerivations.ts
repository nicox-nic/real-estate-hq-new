/**
 * My Listings derivations
 *
 * "My Listings" = the listings an agent has been distributed (via
 * assignedAgentIds) OR personally owns (via ownerAgentId).
 *
 * For Broker/Realtor visiting via role mirror, the semantic flips:
 * "listings I've distributed" = listings where the broker is in
 * ownerBrokerId, or where their agents are in assignedAgentIds.
 *
 * Pure module. Verify locks behavior; UI consumes the helpers.
 */

import type { Listing, User, UserRole, TransactionType } from "@/lib/types";

/**
 * Returns listings that should appear in "My Listings" for the given user.
 *
 * Agent: listings where ownerAgentId === me OR assignedAgentIds includes me.
 * Broker: listings where ownerBrokerId === me OR ownerAgentId is one of my agents.
 * Realtor: listings where ownerBrokerId is one of my brokers OR any of those brokers' agents own.
 */
export function listingsForUser(
  user: User,
  allListings: Listing[],
  allUsers: User[],
): Listing[] {
  if (user.role === "Agent") {
    return allListings.filter(
      (l) =>
        l.ownerAgentId === user.id ||
        (l.assignedAgentIds ?? []).includes(user.id),
    );
  }
  if (user.role === "Broker") {
    const myAgents = allUsers
      .filter((u) => u.role === "Agent" && u.parentId === user.id)
      .map((u) => u.id);
    return allListings.filter(
      (l) =>
        l.ownerBrokerId === user.id ||
        (l.ownerAgentId !== undefined && myAgents.includes(l.ownerAgentId)),
    );
  }
  // Realtor
  const myBrokers = allUsers
    .filter((u) => u.role === "Broker" && u.parentId === user.id)
    .map((u) => u.id);
  const myAgents = allUsers
    .filter(
      (u) =>
        u.role === "Agent" &&
        u.parentId !== null &&
        myBrokers.includes(u.parentId),
    )
    .map((u) => u.id);
  return allListings.filter(
    (l) =>
      (l.ownerBrokerId !== undefined && myBrokers.includes(l.ownerBrokerId)) ||
      (l.ownerAgentId !== undefined && myAgents.includes(l.ownerAgentId)) ||
      (l.assignedAgentIds ?? []).some((a) => myAgents.includes(a)),
  );
}

/**
 * "Active" listings = those still Available or Sold Out Soon.
 * "Archived" = Sold or Reserved (sale concluded or in escrow).
 * Per PRD's All / Active / Archived filter.
 */
export type MyListingsActiveFilter = "All" | "Active" | "Archived";

export const ACTIVE_FILTERS: MyListingsActiveFilter[] = [
  "All",
  "Active",
  "Archived",
];

export function applyActiveFilter(
  listings: Listing[],
  filter: MyListingsActiveFilter,
): Listing[] {
  if (filter === "All") return listings;
  if (filter === "Active")
    return listings.filter(
      (l) => l.availability === "Available" || l.availability === "Sold Out Soon",
    );
  // Archived
  return listings.filter(
    (l) => l.availability === "Sold" || l.availability === "Reserved",
  );
}

/**
 * Filter by transaction type. "All" passes through.
 */
export type MyListingsTxnFilter = TransactionType | "All";

export function applyTransactionTypeFilter(
  listings: Listing[],
  filter: MyListingsTxnFilter,
): Listing[] {
  if (filter === "All") return listings;
  return listings.filter((l) => l.transactionType === filter);
}

/**
 * Stable role label for the My Listings header — different per role per
 * framing carry-forward (Agent: "My Listings"; Broker: "Listings I've
 * distributed"; Realtor: "Listings across my network").
 */
export function myListingsHeadingFor(role: UserRole): {
  title: string;
  subtitle: string;
} {
  switch (role) {
    case "Agent":
      return {
        title: "My Listings",
        subtitle:
          "Listings you own or have been assigned. Share with your buyers.",
      };
    case "Broker":
      return {
        title: "Listings I've distributed",
        subtitle:
          "Your own listings plus everything you've assigned to your agents.",
      };
    case "Realtor":
      return {
        title: "Listings across my network",
        subtitle:
          "Listings owned by brokers and agents in your network.",
      };
  }
}
