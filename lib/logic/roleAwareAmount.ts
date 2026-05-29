/**
 * Role-Aware Amount Selector
 * ============================================================================
 *
 * THE KEYSTONE that prevents the "broker dashboard shows agent's commission"
 * bug class. Every commission display and every commission aggregation MUST
 * route through this function. Verify locks this with assertions that prove
 * a broker viewing the same data sees a different sum than an agent.
 *
 * Rules:
 *   - An Agent viewing their own commission sees `agentAmount`.
 *   - A Broker viewing team commissions sees `brokerAmount` (the broker's
 *     own slice — NOT the team's combined slice and NOT the agent's slice).
 *   - A Realtor viewing network commissions sees `realtyAmount`.
 *   - Anyone viewing a deal they didn't participate in (e.g. an unrelated
 *     broker browsing) sees nothing — return 0.
 *
 * The "what slice" question is settled here, exactly once.
 */

import type { Commission, User, UserRole } from "@/lib/types";

export interface ViewerContext {
  userId: string;
  role: UserRole;
}

/**
 * Returns the amount this viewer is entitled to see in their own perspective.
 * For a deal they participate in but not in their role's share, returns 0.
 */
export function amountFor(commission: Commission, viewer: ViewerContext): number {
  switch (viewer.role) {
    case "Agent":
      return commission.agentId === viewer.userId ? commission.agentAmount : 0;
    case "Broker":
      return commission.brokerId === viewer.userId ? commission.brokerAmount : 0;
    case "Realtor":
      return commission.realtorId === viewer.userId ? commission.realtyAmount : 0;
  }
}

/**
 * Returns true if the viewer participates in this deal in their declared role.
 * Used to filter lists so a viewer doesn't see other people's commissions.
 */
export function viewerParticipates(
  commission: Commission,
  viewer: ViewerContext,
): boolean {
  switch (viewer.role) {
    case "Agent":
      return commission.agentId === viewer.userId;
    case "Broker":
      return commission.brokerId === viewer.userId;
    case "Realtor":
      return commission.realtorId === viewer.userId;
  }
}

/**
 * For team-level aggregations (a broker viewing their TEAM's overall sales):
 * the broker is interested in the sum of agent amounts UNDER them. This is a
 * DIFFERENT perspective from `amountFor` — it's not asking "what do I earn"
 * but "what does my team earn." Both are legitimate; centralizing both here
 * prevents the conflation that causes bugs.
 */
export function teamAgentAmount(
  commission: Commission,
  teamLead: ViewerContext,
): number {
  // For a broker: include if this broker is the broker on the deal.
  // For a realtor: include if this realtor is the realtor on the deal.
  // The team-lead's perspective on team performance includes the AGENT share
  // (since that's what the team produced for the agent's pocket — used for
  // metrics like "team total sales contribution to agents").
  if (!viewerParticipates(commission, teamLead)) return 0;
  return commission.agentAmount;
}

/**
 * Sum of the viewer's OWN slice across many commissions.
 */
export function sumOwnAmount(
  commissions: Commission[],
  viewer: ViewerContext,
): number {
  return commissions.reduce((sum, c) => sum + amountFor(c, viewer), 0);
}

/**
 * Sum of the deal totals where the viewer participates (used for "total sales
 * value" KPI — which is contract-price-based, not commission-based).
 */
export function sumParticipatingContractValue(
  commissions: Commission[],
  contractByCommissionId: Map<string, number>,
  viewer: ViewerContext,
): number {
  let sum = 0;
  for (const c of commissions) {
    if (viewerParticipates(c, viewer)) {
      sum += contractByCommissionId.get(c.id) ?? 0;
    }
  }
  return sum;
}

/** Filter a commission list to those visible to the viewer. */
export function filterVisibleToViewer(
  commissions: Commission[],
  viewer: ViewerContext,
): Commission[] {
  return commissions.filter((c) => viewerParticipates(c, viewer));
}

/** Convenience for building a viewer context from a User. */
export function viewerFromUser(user: User): ViewerContext {
  return { userId: user.id, role: user.role };
}
