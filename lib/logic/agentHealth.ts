/**
 * Agent Health Score — pure function per PRD specification.
 *
 * Weights (percent contribution of each criterion, expressed 0..100 within itself):
 *   New leads contacted:   20%
 *   Follow-ups completed:  15%
 *   Listings shared:       15%
 *   Site visits booked:    20%
 *   Deals moved forward:   15%
 *   Closed deals:          15%
 *
 * Each criterion is given as a 0..100 "achievement" value relative to a
 * coaching target (e.g. 10 follow-ups = 100%). The final score is the
 * weighted average, 0..100.
 *
 * Labels:
 *   90–100 Top Performer
 *   70–89  Active
 *   50–69  Needs Coaching
 *   <50    Low Activity
 */

import type { AgentStatusLabel } from "@/lib/types";

export interface AgentHealthInputs {
  /** Number of new leads contacted this period. Target: 20. */
  newLeadsContacted: number;
  /** Follow-ups completed. Target: 15. */
  followUpsCompleted: number;
  /** Listings shared. Target: 12. */
  listingsShared: number;
  /** Site visits booked. Target: 10. */
  siteVisitsBooked: number;
  /** Deals moved forward at least one stage. Target: 8. */
  dealsMovedForward: number;
  /** Closed deals. Target: 3. */
  closedDeals: number;
}

export interface HealthBreakdownItem {
  label: string;
  weight: number; // 0..1
  achievement: number; // 0..100
  contribution: number; // achievement × weight
}

export interface AgentHealthResult {
  total: number;
  label: AgentStatusLabel;
  breakdown: HealthBreakdownItem[];
}

const WEIGHTS = {
  newLeadsContacted: 0.2,
  followUpsCompleted: 0.15,
  listingsShared: 0.15,
  siteVisitsBooked: 0.2,
  dealsMovedForward: 0.15,
  closedDeals: 0.15,
} as const;

const TARGETS = {
  newLeadsContacted: 20,
  followUpsCompleted: 15,
  listingsShared: 12,
  siteVisitsBooked: 10,
  dealsMovedForward: 8,
  closedDeals: 3,
} as const;

function pct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (actual / target) * 100);
}

export function labelHealth(score: number): AgentStatusLabel {
  if (score >= 90) return "Top Performer";
  if (score >= 70) return "Active";
  if (score >= 50) return "Needs Coaching";
  return "Low Activity";
}

export function scoreAgentHealth(inputs: AgentHealthInputs): AgentHealthResult {
  const items: HealthBreakdownItem[] = [
    {
      label: "New leads contacted",
      weight: WEIGHTS.newLeadsContacted,
      achievement: pct(inputs.newLeadsContacted, TARGETS.newLeadsContacted),
      contribution: 0,
    },
    {
      label: "Follow-ups completed",
      weight: WEIGHTS.followUpsCompleted,
      achievement: pct(inputs.followUpsCompleted, TARGETS.followUpsCompleted),
      contribution: 0,
    },
    {
      label: "Listings shared",
      weight: WEIGHTS.listingsShared,
      achievement: pct(inputs.listingsShared, TARGETS.listingsShared),
      contribution: 0,
    },
    {
      label: "Site visits booked",
      weight: WEIGHTS.siteVisitsBooked,
      achievement: pct(inputs.siteVisitsBooked, TARGETS.siteVisitsBooked),
      contribution: 0,
    },
    {
      label: "Deals moved forward",
      weight: WEIGHTS.dealsMovedForward,
      achievement: pct(inputs.dealsMovedForward, TARGETS.dealsMovedForward),
      contribution: 0,
    },
    {
      label: "Closed deals",
      weight: WEIGHTS.closedDeals,
      achievement: pct(inputs.closedDeals, TARGETS.closedDeals),
      contribution: 0,
    },
  ];

  items.forEach((it) => {
    it.contribution = it.achievement * it.weight;
  });

  const total = items.reduce((sum, it) => sum + it.contribution, 0);

  return {
    total: Math.round(total),
    label: labelHealth(total),
    breakdown: items,
  };
}

/**
 * Simulate the impact of sharing a listing on agent health.
 * Used by the nurture-beat demo (one action lifts BOTH the lead score
 * AND the sharing agent's health score).
 */
export function simulateShare(
  inputs: AgentHealthInputs,
): { before: number; after: number; lift: number } {
  const before = scoreAgentHealth(inputs).total;
  const after = scoreAgentHealth({
    ...inputs,
    listingsShared: inputs.listingsShared + 1,
  }).total;
  return { before, after, lift: after - before };
}
