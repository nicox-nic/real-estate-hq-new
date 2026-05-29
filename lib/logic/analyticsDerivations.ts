/**
 * Manager Analytics Derivations
 *
 * Concentration point for the 6 charts on the Manager Analytics page.
 * Pure-function module mirroring the architectural shape of
 * managerDashboardDerivations (7A) and dealStageDerivations (5C).
 *
 * The 6 derivations:
 *   1. Lead volume over time (weekly buckets, Line chart)
 *   2. Response time distribution (time-bucket histogram, Bar chart)
 *   3. Lead source performance (groupBy source, Donut chart)
 *   4. Conversion rate by stage (groupBy stage, Bar chart)
 *   5. Lead temperature distribution (groupBy seedScoreCategory, Donut)
 *   6. Commission status breakdown (groupBy status, Donut)
 *
 * Engine-honest: every value derives from underlying seed data. No
 * fabricated trends, no smoothed curves to hide thin data. Section 21
 * verifies the cross-file invariant that every chart on the Analytics
 * page references these helpers, not inline Recharts components.
 */

import type {
  User,
  Lead,
  Deal,
  Commission,
  LeadSource,
  LeadScoreCategory,
  DealStage,
  CommissionStatus,
} from "@/lib/types";
import { resolveTeamAgentIds } from "./managerDashboardDerivations";

// ----------------------------------------------------------------------------
// 1. Lead volume over time (weekly buckets)
// ----------------------------------------------------------------------------

export interface LeadVolumePoint {
  /** ISO week-start date "YYYY-MM-DD". */
  weekStartIso: string;
  /** Human label e.g. "May 26". */
  label: string;
  /** Count of leads captured in this week. */
  value: number;
}

/**
 * Buckets leads into weekly counts ending at the reference date.
 * Returns the most recent `weeks` weeks (default 6) in ascending order.
 */
export function computeLeadVolumeOverTime(
  manager: User,
  allUsers: User[],
  leads: Lead[],
  referenceIso: string,
  weeks = 6,
): LeadVolumePoint[] {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const teamLeads = leads.filter((l) => teamIds.has(l.assignedAgentId));

  const refDate = new Date(referenceIso);
  refDate.setUTCHours(0, 0, 0, 0);

  // Snap to start of week (Monday)
  const dayOfWeek = refDate.getUTCDay() || 7;
  const monday = new Date(refDate);
  monday.setUTCDate(refDate.getUTCDate() - dayOfWeek + 1);

  const buckets: LeadVolumePoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(monday);
    start.setUTCDate(monday.getUTCDate() - i * 7);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const count = teamLeads.filter(
      (l) => l.createdAt >= startIso && l.createdAt < endIso,
    ).length;
    buckets.push({
      weekStartIso: startIso.slice(0, 10),
      label: start.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      }),
      value: count,
    });
  }
  return buckets;
}

// ----------------------------------------------------------------------------
// 2. Response time distribution
// ----------------------------------------------------------------------------

export interface ResponseTimeBucket {
  /** Bucket label e.g. "< 1h", "1-4h", "4-24h", "24h+". */
  label: string;
  /** Number of leads whose first-message gap falls in this bucket. */
  value: number;
  /** Bucket bounds in hours (for verify). */
  lowerHours: number;
  upperHours: number;
}

/**
 * Buckets leads by the time gap between createdAt and lastMessageAt
 * (the proxy for first response time we have in the seed).
 *
 * Without firstContactedAt on Lead, we use `lastMessageAt` as the
 * post-creation activity signal — engine-honest given the data.
 */
export function computeResponseTimeDistribution(
  manager: User,
  allUsers: User[],
  leads: Lead[],
): ResponseTimeBucket[] {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const teamLeads = leads.filter((l) => teamIds.has(l.assignedAgentId));

  const buckets: ResponseTimeBucket[] = [
    { label: "< 1h", value: 0, lowerHours: 0, upperHours: 1 },
    { label: "1-4h", value: 0, lowerHours: 1, upperHours: 4 },
    { label: "4-24h", value: 0, lowerHours: 4, upperHours: 24 },
    { label: "24h+", value: 0, lowerHours: 24, upperHours: Infinity },
  ];

  for (const lead of teamLeads) {
    const createdMs = new Date(lead.createdAt).getTime();
    const messageMs = new Date(lead.lastMessageAt).getTime();
    const gapHours = (messageMs - createdMs) / 3_600_000;
    const bucket = buckets.find(
      (b) => gapHours >= b.lowerHours && gapHours < b.upperHours,
    );
    if (bucket) bucket.value++;
  }

  return buckets;
}

// ----------------------------------------------------------------------------
// 3. Lead source performance
// ----------------------------------------------------------------------------

export interface LeadSourcePoint {
  source: LeadSource;
  value: number;
  /** Percentage of total (0-100). */
  pct: number;
}

export function computeLeadSourcePerformance(
  manager: User,
  allUsers: User[],
  leads: Lead[],
): LeadSourcePoint[] {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const teamLeads = leads.filter((l) => teamIds.has(l.assignedAgentId));
  const total = teamLeads.length;

  const counts = new Map<LeadSource, number>();
  for (const l of teamLeads) {
    counts.set(l.source, (counts.get(l.source) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, value]) => ({
      source,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

// ----------------------------------------------------------------------------
// 4. Conversion rate by stage
// ----------------------------------------------------------------------------

export interface StageConversionPoint {
  stage: DealStage;
  /** Number of deals that have REACHED this stage (cumulative). */
  reached: number;
  /** Conversion rate from total deals to this stage (0-100). */
  rate: number;
}

const STAGE_ORDER: DealStage[] = [
  "Lead Generated",
  "Buyer Qualified",
  "Site Visit Done",
  "Reservation Paid",
  "Documents Submitted",
  "Financing Approved",
  "Contract Signed",
  "Commission Processing",
  "Commission Released",
];

export function computeConversionByStage(
  manager: User,
  allUsers: User[],
  deals: Deal[],
): StageConversionPoint[] {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const teamDeals = deals.filter((d) => teamIds.has(d.agentId));
  const total = teamDeals.length;

  return STAGE_ORDER.map((stage) => {
    const stageIdx = STAGE_ORDER.indexOf(stage);
    // A deal has "reached" this stage if its current stage is at this
    // index or later.
    const reached = teamDeals.filter((d) => {
      const idx = STAGE_ORDER.indexOf(d.stage);
      return idx >= stageIdx;
    }).length;
    return {
      stage,
      reached,
      rate: total > 0 ? Math.round((reached / total) * 100) : 0,
    };
  });
}

// ----------------------------------------------------------------------------
// 5. Lead temperature distribution
// ----------------------------------------------------------------------------

export interface LeadTemperaturePoint {
  category: LeadScoreCategory;
  value: number;
  pct: number;
}

export function computeLeadTemperatureDistribution(
  manager: User,
  allUsers: User[],
  leads: Lead[],
): LeadTemperaturePoint[] {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const teamLeads = leads.filter((l) => teamIds.has(l.assignedAgentId));
  const total = teamLeads.length;

  const cats: LeadScoreCategory[] = ["Hot", "Warm", "Nurture", "Cold"];
  return cats.map((cat) => {
    const value = teamLeads.filter((l) => l.seedScoreCategory === cat).length;
    return {
      category: cat,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    };
  });
}

// ----------------------------------------------------------------------------
// 6. Commission status breakdown (manager-aggregate)
// ----------------------------------------------------------------------------

export interface CommissionStatusPoint {
  status: CommissionStatus;
  /** Aggregate amount in this status across the team. */
  amount: number;
  /** Percentage of total (0-100). */
  pct: number;
}

/**
 * Manager-aggregate commission breakdown: sums the manager's role
 * share (brokerAmount / realtyAmount) across team commissions in each
 * status. Composes with the existing role-aware aggregation pattern
 * from Session 6 + 7A.
 */
export function computeCommissionStatusBreakdown(
  manager: User,
  allUsers: User[],
  commissions: Commission[],
): CommissionStatusPoint[] {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const shareField =
    manager.role === "Broker" ? "brokerAmount" : "realtyAmount";

  const teamCommissions = commissions.filter((c) => teamIds.has(c.agentId));
  let total = 0;
  const byStatus = new Map<CommissionStatus, number>();
  for (const c of teamCommissions) {
    const amt = (c[shareField as keyof Commission] as number) ?? 0;
    total += amt;
    byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + amt);
  }

  const statuses: CommissionStatus[] = [
    "Paid",
    "For Closing",
    "For Approval",
    "For Payout",
    "On Hold",
  ];
  return statuses.map((status) => {
    const amount = byStatus.get(status) ?? 0;
    return {
      status,
      amount,
      pct: total > 0 ? Math.round((amount / total) * 100) : 0,
    };
  });
}

// ----------------------------------------------------------------------------
// Composite: AnalyticsSnapshot
// ----------------------------------------------------------------------------

export interface AnalyticsSnapshot {
  leadVolume: LeadVolumePoint[];
  responseTime: ResponseTimeBucket[];
  leadSource: LeadSourcePoint[];
  conversionByStage: StageConversionPoint[];
  leadTemperature: LeadTemperaturePoint[];
  commissionStatus: CommissionStatusPoint[];
  /** Total leads in scope (denominator for source pct, temperature pct). */
  totalLeads: number;
}

export function computeAnalyticsSnapshot(
  manager: User,
  allUsers: User[],
  leads: Lead[],
  deals: Deal[],
  commissions: Commission[],
  referenceIso: string,
): AnalyticsSnapshot {
  const teamIds = resolveTeamAgentIds(manager, allUsers);
  const totalLeads = leads.filter((l) => teamIds.has(l.assignedAgentId)).length;

  return {
    leadVolume: computeLeadVolumeOverTime(manager, allUsers, leads, referenceIso),
    responseTime: computeResponseTimeDistribution(manager, allUsers, leads),
    leadSource: computeLeadSourcePerformance(manager, allUsers, leads),
    conversionByStage: computeConversionByStage(manager, allUsers, deals),
    leadTemperature: computeLeadTemperatureDistribution(manager, allUsers, leads),
    commissionStatus: computeCommissionStatusBreakdown(manager, allUsers, commissions),
    totalLeads,
  };
}
