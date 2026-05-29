/**
 * Manager Dashboard Derivations — Broker + Realtor aggregations.
 *
 * Same posture as 5C's `dealStageDerivations.ts` and 3A's
 * `dashboardDerivations.ts`: pure-function module concentrating all the
 * role-aware aggregation logic for the broker/realtor dashboards.
 *
 * Single concentration point so the dashboard pages render values, not
 * compute them. Verify locks every value.
 *
 * Parameterization principle: same KPI shape for broker and realtor; the
 * difference is the TEAM RESOLUTION (broker = direct reports;
 * realtor = direct reports + transitive agents under child brokers).
 */

import type {
  User,
  Deal,
  Commission,
  SiteVisit,
  Lead,
  AgentStatusLabel,
} from "@/lib/types";
import {
  scoreAgentHealth,
  labelHealth,
} from "./agentHealth";

/**
 * Builds AgentHealthInputs from raw seed data for a given agent.
 * Centralizes the shape mapping so manager dashboards AND Agent Profile
 * read the same underlying numbers. Exported so the Agent Profile UI
 * can render the same engine inputs.
 */
export function buildAgentHealthInputs(
  agentId: string,
  deals: Deal[],
  siteVisits: SiteVisit[],
  leads: Lead[],
) {
  return {
    newLeadsContacted: leads.filter(
      (l) => l.assignedAgentId === agentId,
    ).length,
    followUpsCompleted: 0, // not yet seeded — leaves contribution at floor
    listingsShared: 0, // shareCampaigns aren't filtered by agent yet
    siteVisitsBooked: siteVisits.filter(
      (sv) =>
        sv.agentId === agentId &&
        (sv.status === "Confirmed" ||
          sv.status === "Reminder Sent" ||
          sv.status === "Completed"),
    ).length,
    dealsMovedForward: deals.filter(
      (d) =>
        d.agentId === agentId &&
        d.stage !== "Lead Generated",
    ).length,
    closedDeals: deals.filter(
      (d) =>
        d.agentId === agentId &&
        (d.stage === "Contract Signed" ||
          d.stage === "Commission Processing" ||
          d.stage === "Commission Released"),
    ).length,
  };
}

// ----------------------------------------------------------------------------
// Team resolution — broker vs realtor scope
// ----------------------------------------------------------------------------

/**
 * For a given manager (Broker or Realtor), returns the set of agent IDs
 * whose data feeds into their dashboard.
 *
 *   Broker → direct reports only (users where parentId === broker.id and role === "Agent")
 *   Realtor → direct reports + transitive agents under child brokers
 *
 * Pure function — caller passes the full users list to keep this stateless.
 */
export function resolveTeamAgentIds(
  manager: User,
  allUsers: User[],
): Set<string> {
  if (manager.role === "Agent") {
    return new Set([manager.id]);
  }
  if (manager.role === "Broker") {
    return new Set(
      allUsers
        .filter((u) => u.parentId === manager.id && u.role === "Agent")
        .map((u) => u.id),
    );
  }
  // Realtor: direct + transitive
  const direct = allUsers.filter((u) => u.parentId === manager.id);
  const directAgentIds = direct.filter((u) => u.role === "Agent").map((u) => u.id);
  const directBrokerIds = direct.filter((u) => u.role === "Broker").map((u) => u.id);
  const transitiveAgentIds: string[] = [];
  for (const u of allUsers) {
    if (
      u.role === "Agent" &&
      u.parentId &&
      directBrokerIds.includes(u.parentId)
    ) {
      transitiveAgentIds.push(u.id);
    }
  }
  return new Set([...directAgentIds, ...transitiveAgentIds]);
}

// ----------------------------------------------------------------------------
// Manager Dashboard KPIs (shared shape for broker + realtor)
// ----------------------------------------------------------------------------

export interface ManagerDashboardKPIs {
  /** Number of agents on this manager's team (broker) or network (realtor). */
  activeAgents: number;
  /** Mean agent health score across the team. */
  agentHealthScore: number;
  /** Label for the average health score. */
  agentHealthLabel: AgentStatusLabel;
  /** Total site visits booked (future + active states) across team. */
  siteVisitsBooked: number;
  /** Deals in For Closing / Contract Signed stage across team. */
  forClosing: number;
  /** Deals at Contract Signed and beyond (closed-won) across team. */
  dealsClosed: number;
  /** Sum of contract prices for closed deals across team this period. */
  totalSales: number;
  /** Sum of For Approval / For Closing / For Payout commission amounts (manager's share) across team. */
  pendingCommissions: number;
}

export interface ManagerKPIsInput {
  manager: User;
  allUsers: User[];
  deals: Deal[];
  commissions: Commission[];
  siteVisits: SiteVisit[];
  leads: Lead[];
  /** ISO reference date used as "today". */
  referenceIso: string;
}

/**
 * Computes the marquee 7-card KPI row for broker and realtor dashboards.
 * Mockup 1's broker dashboard composition: Active Agents · Agent Health ·
 * Site Visits Booked · For Closing · Deals Closed · Total Sales ·
 * Pending Commissions.
 */
export function computeManagerKPIs(
  input: ManagerKPIsInput,
): ManagerDashboardKPIs {
  const { manager, allUsers, deals, commissions, siteVisits, leads, referenceIso } = input;

  const teamAgentIds = resolveTeamAgentIds(manager, allUsers);
  const today = referenceIso.slice(0, 10);

  // Active agents — count of agents on team
  const activeAgents = teamAgentIds.size;

  // Agent health — average across the team. Each agent's health is the
  // 6-component formula from agentHealth.ts.
  const teamAgents = allUsers.filter((u) => teamAgentIds.has(u.id));
  let healthSum = 0;
  let healthCount = 0;
  for (const a of teamAgents) {
    const h = scoreAgentHealth(
      buildAgentHealthInputs(a.id, deals, siteVisits, leads),
    );
    healthSum += h.total;
    healthCount++;
  }
  const agentHealthScore =
    healthCount > 0 ? Math.round(healthSum / healthCount) : 0;
  const agentHealthLabel = labelHealth(agentHealthScore);

  // Site visits booked — future visits assigned to team agents
  const siteVisitsBooked = siteVisits.filter(
    (sv) =>
      teamAgentIds.has(sv.agentId) &&
      sv.scheduledAt.slice(0, 10) >= today &&
      (sv.status === "Confirmed" ||
        sv.status === "Reminder Sent" ||
        sv.status === "Proposed"),
  ).length;

  // For Closing — deals in late-pipeline pre-close stages
  const forClosing = deals.filter(
    (d) =>
      teamAgentIds.has(d.agentId) &&
      (d.stage === "Reservation Paid" ||
        d.stage === "Documents Submitted" ||
        d.stage === "Financing Approved"),
  ).length;

  // Deals Closed — past Contract Signed
  const closedDeals = deals.filter(
    (d) =>
      teamAgentIds.has(d.agentId) &&
      (d.stage === "Contract Signed" ||
        d.stage === "Commission Processing" ||
        d.stage === "Commission Released"),
  );
  const dealsClosed = closedDeals.length;

  // Total Sales — sum of closed deal contract prices
  const totalSales = closedDeals.reduce((s, d) => s + d.contractPrice, 0);

  // Pending Commissions — manager's share over team's commissions in pending statuses
  const pendingStatuses = ["For Approval", "For Closing", "For Payout"];
  const managerShareField =
    manager.role === "Broker" ? "brokerAmount" : "realtyAmount";
  const pendingCommissions = commissions
    .filter((c) => {
      if (!pendingStatuses.includes(c.status)) return false;
      // Manager participates either directly OR via team
      if (manager.role === "Broker") {
        return c.brokerId === manager.id || teamAgentIds.has(c.agentId);
      }
      // Realtor
      return c.realtorId === manager.id || teamAgentIds.has(c.agentId);
    })
    .reduce((s, c) => s + (c[managerShareField as keyof Commission] as number ?? 0), 0);

  return {
    activeAgents,
    agentHealthScore,
    agentHealthLabel,
    siteVisitsBooked,
    forClosing,
    dealsClosed,
    totalSales,
    pendingCommissions,
  };
}

// ----------------------------------------------------------------------------
// Top Performers leaderboard
// ----------------------------------------------------------------------------

export interface LeaderboardRow {
  agentId: string;
  agentName: string;
  avatarUrl?: string;
  deals: number;
  sales: number;
  healthScore: number;
  healthLabel: AgentStatusLabel;
  status: AgentStatusLabel;
  /** Recent site visits booked in the period. */
  recentSiteVisits: number;
  /** Recent leads contacted in the period. */
  recentLeadsContacted: number;
}

export interface LeaderboardInput {
  manager: User;
  allUsers: User[];
  deals: Deal[];
  siteVisits: SiteVisit[];
  leads: Lead[];
  referenceIso: string;
}

/**
 * Computes the Top Performers leaderboard for a manager's team.
 *
 * Default sort: deals closed (desc), then total sales (desc), then health
 * (desc). The mockup's leaderboard shows deals + sales prominently, so
 * sort by what the user sees.
 *
 * Returns all team agents; caller truncates with slice(0, N) for the
 * dashboard's compact 5-row view vs full /leaderboard view.
 */
export function computeLeaderboard(
  input: LeaderboardInput,
): LeaderboardRow[] {
  const { manager, allUsers, deals, siteVisits, leads, referenceIso } = input;
  const teamAgentIds = resolveTeamAgentIds(manager, allUsers);

  const rows: LeaderboardRow[] = [];
  for (const agentId of teamAgentIds) {
    const agent = allUsers.find((u) => u.id === agentId);
    if (!agent) continue;
    const agentDeals = deals.filter(
      (d) =>
        d.agentId === agentId &&
        (d.stage === "Contract Signed" ||
          d.stage === "Commission Processing" ||
          d.stage === "Commission Released"),
    );
    const sales = agentDeals.reduce((s, d) => s + d.contractPrice, 0);
    const h = scoreAgentHealth(
      buildAgentHealthInputs(agentId, deals, siteVisits, leads),
    );

    rows.push({
      agentId,
      agentName: agent.fullName,
      avatarUrl: agent.avatarUrl,
      deals: agentDeals.length,
      sales,
      healthScore: h.total,
      healthLabel: h.label,
      status: h.label,
      recentSiteVisits: siteVisits.filter(
        (sv) =>
          sv.agentId === agentId &&
          (sv.status === "Confirmed" ||
            sv.status === "Reminder Sent" ||
            sv.status === "Completed"),
      ).length,
      recentLeadsContacted: leads.filter(
        (l) => l.assignedAgentId === agentId,
      ).length,
    });
  }

  // Sort: deals desc, sales desc, health desc
  rows.sort((a, b) => {
    if (b.deals !== a.deals) return b.deals - a.deals;
    if (b.sales !== a.sales) return b.sales - a.sales;
    return b.healthScore - a.healthScore;
  });
  return rows;
}

// ----------------------------------------------------------------------------
// Closing Sprint progress (mockup's named campaign — May Closing Sprint)
// ----------------------------------------------------------------------------

export interface ClosingSprintProgress {
  /** Aggregate team sales toward the sprint target. */
  teamProgressAmount: number;
  teamTargetAmount: number;
  /** Percent of target, rounded to nearest integer. 0..100. */
  progressPct: number;
  /** Top closer this sprint period. */
  topCloserName?: string;
  topCloserAmount: number;
  /** Days remaining in the sprint. */
  daysRemaining: number;
  /** The reward podium: 1st / 2nd / 3rd place prizes. */
  rewards: { rank: 1 | 2 | 3; amountPHP: number }[];
}

export interface ClosingSprintInput {
  manager: User;
  allUsers: User[];
  deals: Deal[];
  referenceIso: string;
  /** Sprint period end date ISO. Defaults to end of current month. */
  sprintEndIso?: string;
  /** Team target — defaults to ₱24M (broker mockup). */
  teamTargetAmount?: number;
  /** Rewards podium. */
  rewards?: { rank: 1 | 2 | 3; amountPHP: number }[];
}

export function computeClosingSprintProgress(
  input: ClosingSprintInput,
): ClosingSprintProgress {
  const {
    manager,
    allUsers,
    deals,
    referenceIso,
    sprintEndIso = "2025-05-31",
    teamTargetAmount = 24_000_000,
    rewards = [
      { rank: 1, amountPHP: 50_000 },
      { rank: 2, amountPHP: 30_000 },
      { rank: 3, amountPHP: 20_000 },
    ],
  } = input;

  const teamAgentIds = resolveTeamAgentIds(manager, allUsers);
  const closingStages = new Set([
    "Contract Signed",
    "Commission Processing",
    "Commission Released",
  ]);
  const teamClosedDeals = deals.filter(
    (d) => teamAgentIds.has(d.agentId) && closingStages.has(d.stage),
  );
  const teamProgressAmount = teamClosedDeals.reduce(
    (s, d) => s + d.contractPrice,
    0,
  );

  // Top closer
  const closerTotals = new Map<string, number>();
  for (const d of teamClosedDeals) {
    closerTotals.set(d.agentId, (closerTotals.get(d.agentId) ?? 0) + d.contractPrice);
  }
  let topCloserId: string | undefined;
  let topCloserAmount = 0;
  for (const [id, amt] of closerTotals) {
    if (amt > topCloserAmount) {
      topCloserAmount = amt;
      topCloserId = id;
    }
  }
  const topCloser = topCloserId
    ? allUsers.find((u) => u.id === topCloserId)
    : undefined;

  // Days remaining
  const today = new Date(referenceIso);
  const end = new Date(sprintEndIso + "T00:00:00.000Z");
  const msPerDay = 86_400_000;
  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - today.getTime()) / msPerDay),
  );

  const progressPct =
    teamTargetAmount > 0
      ? Math.min(100, Math.round((teamProgressAmount / teamTargetAmount) * 100))
      : 0;

  return {
    teamProgressAmount,
    teamTargetAmount,
    progressPct,
    topCloserName: topCloser?.fullName,
    topCloserAmount,
    daysRemaining,
    rewards,
  };
}
