/**
 * VERIFY SUITE — Living Spec
 * ===========================================================================
 *
 * Run with: `npm run verify`
 *
 * This is the safety net that catches regressions across sessions. It asserts:
 *
 *   1. FK INTEGRITY: every reference between entities resolves.
 *   2. STRUCTURAL INVARIANTS: enum coverage, split-sum reconciliation,
 *      uniqueness of IDs, presence of demo anchors.
 *   3. BEHAVIORAL PROOFS for the four demo narratives:
 *        - Cold noise inquiry lead present and unqualified.
 *        - Engine-vs-seed contradiction visible (editorial Hot, engine Cold).
 *        - Nurture-beat: brochure share lifts lead score AND agent health.
 *        - Leaderboard spread present (top vs bottom across 3+ dimensions).
 *   4. ROLE-AWARE AGGREGATION LOCK: a broker viewing the SAME commission
 *      data as an agent sees a different sum — proves perspective bug class
 *      is guarded.
 *   5. COMMISSION TRACKING MOCKUP NUMBERS: documents the data-vs-display
 *      tension explicitly so it stays visible across sessions.
 *   6. PRD COVERAGE: 45 routes registered; reports complete/scaffolded/pending.
 *
 * Output format: a sectioned report with pass/fail counts. Exits non-zero
 * on failure so session-close can rely on `npm run verify` as a gate.
 */

import {
  seedUsers,
  seedDevelopers,
  seedProjects,
  seedUnits,
  seedListings,
  seedLeads,
  seedDeals,
  seedCommissions,
  seedPayoutAccounts,
  seedSiteVisits,
  seedShareCampaigns,
  seedConversationMessages,
  seedPropertyFiles,
  seedTeamUpdates,
  seedBonusCampaigns,
  seedAIActivity,
  seedIntegrations,
  seedNotifications,
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  NURTURE_BEAT_AGENT_ID,
  COLD_NOISE_LEAD_ID,
  CONTRADICTION_LEAD_ID,
  NURTURE_BEAT_LEAD_ID,
} from "@/lib/data";
import {
  scoreLead,
  simulateAction,
  LEAD_SCORE_MAX,
} from "@/lib/logic/leadScoring";
import {
  scoreAgentHealth,
  simulateShare,
  labelHealth,
} from "@/lib/logic/agentHealth";
import {
  RECONCILIATION_EPSILON_PHP,
  splitCommission,
} from "@/lib/logic/commissionSplit";
import {
  amountFor,
  filterVisibleToViewer,
  sumOwnAmount,
  type ViewerContext,
} from "@/lib/logic/roleAwareAmount";
import {
  computeKPIs,
  computeBreakdown,
} from "@/lib/logic/commissionAggregation";
import { prdRoutes, EXPECTED_ROUTE_COUNT } from "./prdManifest";
import type { LeadSource } from "@/lib/types";

// ----------------------------------------------------------------------------
// Mini assertion framework
// ----------------------------------------------------------------------------

interface Assertion {
  section: string;
  name: string;
  passed: boolean;
  detail?: string;
}

const results: Assertion[] = [];

function ok(section: string, name: string, detail?: string) {
  results.push({ section, name, passed: true, detail });
}

function fail(section: string, name: string, detail: string) {
  results.push({ section, name, passed: false, detail });
}

function check(section: string, name: string, cond: boolean, detail = "") {
  if (cond) ok(section, name, detail);
  else fail(section, name, detail || "(condition false)");
}

function approxEqual(a: number, b: number, eps = RECONCILIATION_EPSILON_PHP) {
  return Math.abs(a - b) <= eps;
}

// ----------------------------------------------------------------------------
// 1. FK Integrity
// ----------------------------------------------------------------------------

function checkFKIntegrity() {
  const section = "1. FK Integrity";

  const userIds = new Set(seedUsers.map((u) => u.id));
  const developerIds = new Set(seedDevelopers.map((d) => d.id));
  const projectIds = new Set(seedProjects.map((p) => p.id));
  const unitIds = new Set(seedUnits.map((u) => u.id));
  const listingIds = new Set(seedListings.map((l) => l.id));
  const leadIds = new Set(seedLeads.map((l) => l.id));
  const dealIds = new Set(seedDeals.map((d) => d.id));
  const commissionIds = new Set(seedCommissions.map((c) => c.id));
  const payoutAcctIds = new Set(seedPayoutAccounts.map((p) => p.id));
  const fileIds = new Set(seedPropertyFiles.map((f) => f.id));

  // Users.parentId → User
  for (const u of seedUsers) {
    if (u.parentId !== null) {
      check(
        section,
        `User ${u.id} parentId resolves`,
        userIds.has(u.parentId),
        u.parentId,
      );
    }
  }

  // Projects.developerId → Developer
  for (const p of seedProjects) {
    check(
      section,
      `Project ${p.id} developerId resolves`,
      developerIds.has(p.developerId),
      p.developerId,
    );
  }

  // Units.projectId → Project
  for (const u of seedUnits) {
    check(
      section,
      `Unit ${u.id} projectId resolves`,
      projectIds.has(u.projectId),
      u.projectId,
    );
  }

  // Listings: all foreign keys
  for (const l of seedListings) {
    if (l.developerId)
      check(
        section,
        `Listing ${l.id} developerId resolves`,
        developerIds.has(l.developerId),
        l.developerId,
      );
    if (l.projectId)
      check(
        section,
        `Listing ${l.id} projectId resolves`,
        projectIds.has(l.projectId),
        l.projectId,
      );
    if (l.unitId)
      check(
        section,
        `Listing ${l.id} unitId resolves`,
        unitIds.has(l.unitId),
        l.unitId,
      );
    if (l.ownerAgentId)
      check(
        section,
        `Listing ${l.id} ownerAgentId resolves`,
        userIds.has(l.ownerAgentId),
        l.ownerAgentId,
      );
    if (l.ownerBrokerId)
      check(
        section,
        `Listing ${l.id} ownerBrokerId resolves`,
        userIds.has(l.ownerBrokerId),
        l.ownerBrokerId,
      );
  }

  // Leads: assignedAgent + selectedListings
  for (const l of seedLeads) {
    check(
      section,
      `Lead ${l.id} assignedAgentId resolves`,
      userIds.has(l.assignedAgentId),
      l.assignedAgentId,
    );
    for (const lid of l.selectedListingIds) {
      check(
        section,
        `Lead ${l.id} listing ${lid} resolves`,
        listingIds.has(lid),
        lid,
      );
    }
  }

  // Deals: every FK
  for (const d of seedDeals) {
    check(section, `Deal ${d.id} agentId resolves`, userIds.has(d.agentId), d.agentId);
    if (d.brokerId)
      check(
        section,
        `Deal ${d.id} brokerId resolves`,
        userIds.has(d.brokerId),
        d.brokerId,
      );
    if (d.realtorId)
      check(
        section,
        `Deal ${d.id} realtorId resolves`,
        userIds.has(d.realtorId),
        d.realtorId,
      );
    check(
      section,
      `Deal ${d.id} listingId resolves`,
      listingIds.has(d.listingId),
      d.listingId,
    );
    check(
      section,
      `Deal ${d.id} commissionId resolves`,
      commissionIds.has(d.commissionId),
      d.commissionId,
    );
  }

  // Commissions: dealId + payoutAccountId
  for (const c of seedCommissions) {
    check(
      section,
      `Commission ${c.id} dealId resolves`,
      dealIds.has(c.dealId),
      c.dealId,
    );
    if (c.payoutAccountId)
      check(
        section,
        `Commission ${c.id} payoutAccountId resolves`,
        payoutAcctIds.has(c.payoutAccountId),
        c.payoutAccountId,
      );
    check(
      section,
      `Commission ${c.id} agentId resolves`,
      userIds.has(c.agentId),
      c.agentId,
    );
    if (c.brokerId)
      check(
        section,
        `Commission ${c.id} brokerId resolves`,
        userIds.has(c.brokerId),
        c.brokerId,
      );
    if (c.realtorId)
      check(
        section,
        `Commission ${c.id} realtorId resolves`,
        userIds.has(c.realtorId),
        c.realtorId,
      );
  }

  // Site visits
  for (const sv of seedSiteVisits) {
    check(
      section,
      `SiteVisit ${sv.id} leadId resolves`,
      leadIds.has(sv.leadId),
      sv.leadId,
    );
    check(
      section,
      `SiteVisit ${sv.id} listingId resolves`,
      listingIds.has(sv.listingId),
      sv.listingId,
    );
    check(
      section,
      `SiteVisit ${sv.id} agentId resolves`,
      userIds.has(sv.agentId),
      sv.agentId,
    );
  }

  // Share campaigns
  for (const s of seedShareCampaigns) {
    check(
      section,
      `Share ${s.id} listingId resolves`,
      listingIds.has(s.listingId),
      s.listingId,
    );
    check(
      section,
      `Share ${s.id} agentId resolves`,
      userIds.has(s.agentId),
      s.agentId,
    );
    for (const fid of s.attachedFileIds) {
      check(section, `Share ${s.id} attached file ${fid}`, fileIds.has(fid), fid);
    }
  }

  // Conversation messages
  for (const m of seedConversationMessages) {
    check(
      section,
      `Message ${m.id} leadId resolves`,
      leadIds.has(m.leadId),
      m.leadId,
    );
    if (m.attachmentIds) {
      for (const fid of m.attachmentIds) {
        check(section, `Message ${m.id} attachment ${fid}`, fileIds.has(fid), fid);
      }
    }
  }

  // Property files
  for (const f of seedPropertyFiles) {
    check(
      section,
      `File ${f.id} uploaderId resolves`,
      userIds.has(f.uploaderId),
      f.uploaderId,
    );
    if (f.listingId)
      check(
        section,
        `File ${f.id} listingId resolves`,
        listingIds.has(f.listingId),
        f.listingId,
      );
    if (f.projectId)
      check(
        section,
        `File ${f.id} projectId resolves`,
        projectIds.has(f.projectId),
        f.projectId,
      );
    if (f.developerId)
      check(
        section,
        `File ${f.id} developerId resolves`,
        developerIds.has(f.developerId),
        f.developerId,
      );
  }

  // Team updates + bonus campaigns + AI activity
  for (const t of seedTeamUpdates) {
    check(
      section,
      `TeamUpdate ${t.id} authorId resolves`,
      userIds.has(t.authorId),
      t.authorId,
    );
  }
  for (const b of seedBonusCampaigns) {
    check(
      section,
      `Bonus ${b.id} authorId resolves`,
      userIds.has(b.authorId),
      b.authorId,
    );
    for (const aid of b.eligibleAgentIds) {
      check(
        section,
        `Bonus ${b.id} eligible agent ${aid} resolves`,
        userIds.has(aid),
        aid,
      );
    }
    for (const aid of b.participatingAgentIds) {
      check(
        section,
        `Bonus ${b.id} participating agent ${aid} resolves`,
        userIds.has(aid),
        aid,
      );
    }
  }
  for (const a of seedAIActivity) {
    check(
      section,
      `AIActivity ${a.id} forUserId resolves`,
      userIds.has(a.forUserId),
      a.forUserId,
    );
  }

  // Notifications
  for (const n of seedNotifications) {
    check(
      section,
      `Notification ${n.id} userId resolves`,
      userIds.has(n.userId),
      n.userId,
    );
  }

  // Payout accounts
  for (const pa of seedPayoutAccounts) {
    check(
      section,
      `PayoutAccount ${pa.id} userId resolves`,
      userIds.has(pa.userId),
      pa.userId,
    );
  }
}

// ----------------------------------------------------------------------------
// 2. Structural invariants
// ----------------------------------------------------------------------------

function checkStructuralInvariants() {
  const section = "2. Structural invariants";

  // ID uniqueness across all collections
  const allCollections: Array<{ name: string; ids: string[] }> = [
    { name: "users", ids: seedUsers.map((u) => u.id) },
    { name: "developers", ids: seedDevelopers.map((d) => d.id) },
    { name: "projects", ids: seedProjects.map((p) => p.id) },
    { name: "units", ids: seedUnits.map((u) => u.id) },
    { name: "listings", ids: seedListings.map((l) => l.id) },
    { name: "leads", ids: seedLeads.map((l) => l.id) },
    { name: "deals", ids: seedDeals.map((d) => d.id) },
    { name: "commissions", ids: seedCommissions.map((c) => c.id) },
    { name: "siteVisits", ids: seedSiteVisits.map((s) => s.id) },
    { name: "shares", ids: seedShareCampaigns.map((s) => s.id) },
    { name: "messages", ids: seedConversationMessages.map((m) => m.id) },
    { name: "files", ids: seedPropertyFiles.map((f) => f.id) },
    { name: "teamUpdates", ids: seedTeamUpdates.map((t) => t.id) },
    { name: "bonusCampaigns", ids: seedBonusCampaigns.map((b) => b.id) },
    { name: "aiActivity", ids: seedAIActivity.map((a) => a.id) },
    { name: "integrations", ids: seedIntegrations.map((i) => i.id) },
    { name: "notifications", ids: seedNotifications.map((n) => n.id) },
    { name: "payoutAccounts", ids: seedPayoutAccounts.map((p) => p.id) },
  ];
  for (const col of allCollections) {
    const set = new Set(col.ids);
    check(
      section,
      `${col.name} IDs are unique (${col.ids.length})`,
      set.size === col.ids.length,
      `dup count: ${col.ids.length - set.size}`,
    );
  }

  // All 16 lead sources covered in seed leads
  const allSources: LeadSource[] = [
    "Facebook Lead Ads",
    "Instagram Lead Ads",
    "TikTok Lead Forms",
    "Google Ads Lead Forms",
    "Website Forms",
    "Landing Pages",
    "QR Codes",
    "Open House Forms",
    "Property Portals",
    "Referrals",
    "Manual Entry",
    "Messenger",
    "Instagram DM",
    "WhatsApp",
    "SMS",
    "Email",
  ];
  const presentSources = new Set(seedLeads.map((l) => l.source));
  for (const src of allSources) {
    check(
      section,
      `Lead source present: ${src}`,
      presentSources.has(src),
      "",
    );
  }

  // All 7 transaction types covered with at least 2 listings each
  const txTypes = [
    "For Sale",
    "For Rent",
    "Foreclosure",
    "For Assume",
    "Pre-Selling",
    "RFO",
    "Commercial",
  ] as const;
  for (const t of txTypes) {
    const count = seedListings.filter((l) => l.transactionType === t).length;
    check(
      section,
      `≥2 listings in transaction type "${t}" (have ${count})`,
      count >= 2,
      "",
    );
  }

  // Commission split sums equal totalAmount within ±₱1
  for (const c of seedCommissions) {
    const sum = c.realtyAmount + c.brokerAmount + c.agentAmount;
    check(
      section,
      `Commission ${c.id} splits sum to totalAmount`,
      approxEqual(sum, c.totalAmount),
      `realty + broker + agent = ${sum}, totalAmount = ${c.totalAmount}`,
    );
  }

  // Commission total derives from contractPrice × rate (linked via deal)
  const dealById = new Map(seedDeals.map((d) => [d.id, d]));
  for (const c of seedCommissions) {
    const deal = dealById.get(c.dealId);
    if (!deal) continue;
    const expected = Math.round(deal.contractPrice * deal.commissionRate);
    check(
      section,
      `Commission ${c.id} totalAmount matches deal price × rate`,
      approxEqual(c.totalAmount, expected),
      `expected ${expected}, got ${c.totalAmount}`,
    );
  }

  // Lead-score max is 100
  check(section, "LEAD_SCORE_MAX = 100", LEAD_SCORE_MAX === 100);

  // Demo anchor IDs exist
  check(
    section,
    "Demo agent exists",
    seedUsers.some((u) => u.id === DEMO_AGENT_ID),
  );
  check(
    section,
    "Demo broker exists",
    seedUsers.some((u) => u.id === DEMO_BROKER_ID),
  );
  check(
    section,
    "Demo realtor exists",
    seedUsers.some((u) => u.id === DEMO_REALTOR_ID),
  );
  check(
    section,
    "Nurture-beat agent exists",
    seedUsers.some((u) => u.id === NURTURE_BEAT_AGENT_ID),
  );
  check(
    section,
    "Cold noise lead exists",
    seedLeads.some((l) => l.id === COLD_NOISE_LEAD_ID),
  );
  check(
    section,
    "Contradiction lead exists",
    seedLeads.some((l) => l.id === CONTRADICTION_LEAD_ID),
  );
  check(
    section,
    "Nurture-beat lead exists",
    seedLeads.some((l) => l.id === NURTURE_BEAT_LEAD_ID),
  );

  // 18 integrations present
  check(
    section,
    "18 integrations seeded",
    seedIntegrations.length === 18,
    `got ${seedIntegrations.length}`,
  );
}

// ----------------------------------------------------------------------------
// 3. Behavioral demo-beat proofs
// ----------------------------------------------------------------------------

function checkDemoBeats() {
  const section = "3. Demo beats";

  // BEAT 1: Cold noise inquiry
  const noise = seedLeads.find((l) => l.id === COLD_NOISE_LEAD_ID);
  if (!noise) {
    fail(section, "Cold noise lead present", "missing");
  } else {
    check(section, "Cold noise lead is Cold category", noise.category === "Cold Buyer");
    check(section, "Cold noise lead needs reply", noise.needsReply);
    check(
      section,
      "Cold noise lead has no qualification data",
      !noise.buyer.budgetMin && !noise.buyer.budgetMax && !noise.buyer.timeline,
    );
    check(
      section,
      "Cold noise lead has terse message",
      noise.lastMessagePreview.length < 40,
    );
  }

  // BEAT 2: Engine-vs-seed contradiction
  const contradiction = seedLeads.find((l) => l.id === CONTRADICTION_LEAD_ID);
  if (!contradiction) {
    fail(section, "Contradiction lead present", "missing");
  } else {
    // Editorial seed says Hot
    check(
      section,
      "Editorial seedScoreCategory is Hot",
      contradiction.seedScoreCategory === "Hot",
    );
    check(
      section,
      "Editorial seedScore ≥ 70",
      contradiction.seedScore >= 70,
      `got ${contradiction.seedScore}`,
    );
    // Engine should compute LOW score (no signals)
    const engine = scoreLead({ buyer: contradiction.buyer });
    check(
      section,
      "Engine scores contradiction lead < 30 (Cold)",
      engine.total < 30,
      `engine total: ${engine.total}, category: ${engine.category}`,
    );
    check(
      section,
      "Engine category for contradiction is Cold",
      engine.category === "Cold",
    );
    // The contradiction is visible (both numbers persist; UI is responsible
    // for surfacing both — this is the data-level proof)
    const editorialHot = contradiction.seedScoreCategory === "Hot";
    const engineCold = engine.category === "Cold";
    check(
      section,
      "Contradiction is visible (editorial Hot ⊥ engine Cold)",
      editorialHot && engineCold,
    );
  }

  // BEAT 3: Nurture-beat lift on share
  const nurture = seedLeads.find((l) => l.id === NURTURE_BEAT_LEAD_ID);
  if (!nurture) {
    fail(section, "Nurture-beat lead present", "missing");
  } else {
    check(
      section,
      "Nurture-beat lead assigned to NURTURE_BEAT_AGENT_ID",
      nurture.assignedAgentId === NURTURE_BEAT_AGENT_ID,
    );
    check(
      section,
      "Nurture-beat lead currently Cold",
      nurture.seedScoreCategory === "Cold",
    );

    // Simulate a brochure share action on this buyer
    const lift = simulateAction(nurture.buyer, "brochure");
    check(
      section,
      "Lead score before share is in Cold band (<30)",
      lift.before < 30,
      `before=${lift.before}`,
    );
    check(
      section,
      "Brochure share lifts lead score by exactly +5",
      lift.lift === 5,
      `lift=${lift.lift}`,
    );

    // Agent health lift on share — inputs calibrated so Jason sits in the
    // Needs Coaching band (50-69) at baseline. The lift on adding a single
    // listing-share is small but positive — exactly the demo beat.
    const jasonInputs = {
      newLeadsContacted: 12,
      followUpsCompleted: 9,
      listingsShared: 8,
      siteVisitsBooked: 6,
      dealsMovedForward: 5,
      closedDeals: 1,
    };
    const healthLift = simulateShare(jasonInputs);
    check(
      section,
      "Sharing a listing lifts Jason's health score",
      healthLift.lift > 0,
      `before=${healthLift.before}, after=${healthLift.after}, lift=${healthLift.lift}`,
    );
    // Bounds check: should lift by 1-2 points given the weights
    check(
      section,
      "Health lift on share is between 1 and 3 points",
      healthLift.lift >= 1 && healthLift.lift <= 3,
      `lift=${healthLift.lift}`,
    );
    check(
      section,
      "Jason starts in Needs Coaching band (50–69) at baseline",
      labelHealth(healthLift.before) === "Needs Coaching",
      `baseline=${healthLift.before}, label=${labelHealth(healthLift.before)}`,
    );
  }

  // BEAT 4: Leaderboard spread
  // Use derivedAgentStatus markers as a proxy for the multi-dim spread.
  const agents = seedUsers.filter((u) => u.role === "Agent");
  const topPerformers = agents.filter(
    (a) => a.derivedAgentStatus === "Top Performer",
  ).length;
  const lowActivity = agents.filter(
    (a) => a.derivedAgentStatus === "Low Activity",
  ).length;
  const needsCoaching = agents.filter(
    (a) => a.derivedAgentStatus === "Needs Coaching",
  ).length;
  check(
    section,
    "Leaderboard spread: ≥1 Top Performer",
    topPerformers >= 1,
    `count=${topPerformers}`,
  );
  check(
    section,
    "Leaderboard spread: ≥1 Low Activity",
    lowActivity >= 1,
    `count=${lowActivity}`,
  );
  check(
    section,
    "Leaderboard spread: ≥1 Needs Coaching",
    needsCoaching >= 1,
    `count=${needsCoaching}`,
  );
  // Dimensional spread: closed deals across agents — we should see at least
  // two agents with closed deals and at least one agent with none.
  const closedByAgent = new Map<string, number>();
  for (const d of seedDeals) {
    if (d.stage === "Commission Released") {
      closedByAgent.set(d.agentId, (closedByAgent.get(d.agentId) ?? 0) + 1);
    }
  }
  check(
    section,
    "≥2 agents with closed deals",
    closedByAgent.size >= 2,
    `agents with closes: ${closedByAgent.size}`,
  );
}

// ----------------------------------------------------------------------------
// 4. Role-aware aggregation lock
// ----------------------------------------------------------------------------

function checkRoleAwareLock() {
  const section = "4. Role-aware aggregation lock";

  const agentViewer: ViewerContext = { userId: DEMO_AGENT_ID, role: "Agent" };
  const brokerViewer: ViewerContext = {
    userId: DEMO_BROKER_ID,
    role: "Broker",
  };
  const realtorViewer: ViewerContext = {
    userId: DEMO_REALTOR_ID,
    role: "Realtor",
  };

  // Sum-own-amount for agent vs broker over the SAME commission list
  // must differ — proves perspective is not conflated.
  const agentSum = sumOwnAmount(seedCommissions, agentViewer);
  const brokerSum = sumOwnAmount(seedCommissions, brokerViewer);
  const realtorSum = sumOwnAmount(seedCommissions, realtorViewer);

  check(
    section,
    "Agent and broker see DIFFERENT sums over the same data",
    agentSum !== brokerSum,
    `agent=${agentSum}, broker=${brokerSum}`,
  );
  check(
    section,
    "Broker and realtor see different sums",
    brokerSum !== realtorSum,
    `broker=${brokerSum}, realtor=${realtorSum}`,
  );

  // Specifically: for deals where agent is DEMO_AGENT_ID, agent sum should
  // equal sum of agentAmount fields on those commissions.
  const demoAgentCommissions = seedCommissions.filter(
    (c) => c.agentId === DEMO_AGENT_ID,
  );
  const expectedAgentSum = demoAgentCommissions.reduce(
    (s, c) => s + c.agentAmount,
    0,
  );
  check(
    section,
    "Agent sum equals hand-summed agentAmount over their commissions",
    agentSum === expectedAgentSum,
    `computed ${agentSum}, expected ${expectedAgentSum}`,
  );

  // Filter visibility: an agent should NOT see commissions on deals they're
  // not on. Pick a commission belonging to a DIFFERENT agent.
  const otherAgentComm = seedCommissions.find(
    (c) => c.agentId !== DEMO_AGENT_ID,
  );
  if (otherAgentComm) {
    const agentVisible = filterVisibleToViewer(seedCommissions, agentViewer);
    const sees = agentVisible.some((c) => c.id === otherAgentComm.id);
    check(
      section,
      "Agent does NOT see another agent's commission in filterVisible",
      !sees,
    );
    // And amountFor on that commission for the demo agent should be 0
    const amt = amountFor(otherAgentComm, agentViewer);
    check(
      section,
      "amountFor returns 0 for an agent on someone else's deal",
      amt === 0,
      `got ${amt}`,
    );
  }
}

// ----------------------------------------------------------------------------
// 5. Commission Tracking mockup numbers
// ----------------------------------------------------------------------------

function checkCommissionMockup() {
  const section = "5. Commission Tracking mockup";

  // Mockup transactions table values
  const tableExpected = [
    { dealId: "deal-001", contractPrice: 8_500_000, gross: 255_000, rate: 0.03 },
    { dealId: "deal-002", contractPrice: 6_800_000, gross: 204_000, rate: 0.03 },
    { dealId: "deal-003", contractPrice: 9_200_000, gross: 276_000, rate: 0.03 },
    { dealId: "deal-004", contractPrice: 4_500_000, gross: 135_000, rate: 0.03 },
    { dealId: "deal-005", contractPrice: 3_000_000, gross: 90_000, rate: 0.03 },
    { dealId: "deal-006", contractPrice: 7_500_000, gross: 112_500, rate: 0.015 },
  ];

  const dealById = new Map(seedDeals.map((d) => [d.id, d]));
  const commByDealId = new Map(seedCommissions.map((c) => [c.dealId, c]));

  let tableGrossSum = 0;
  for (const row of tableExpected) {
    const deal = dealById.get(row.dealId);
    const comm = commByDealId.get(row.dealId);
    if (!deal || !comm) {
      fail(section, `Mockup row ${row.dealId} present`, "missing");
      continue;
    }
    check(
      section,
      `Mockup row ${row.dealId} contractPrice matches`,
      deal.contractPrice === row.contractPrice,
      `expected ${row.contractPrice}, got ${deal.contractPrice}`,
    );
    check(
      section,
      `Mockup row ${row.dealId} commissionRate matches`,
      Math.abs(deal.commissionRate - row.rate) < 0.0001,
      `expected ${row.rate}, got ${deal.commissionRate}`,
    );
    check(
      section,
      `Mockup row ${row.dealId} gross commission matches`,
      comm.totalAmount === row.gross,
      `expected ${row.gross}, got ${comm.totalAmount}`,
    );
    tableGrossSum += comm.totalAmount;
  }

  // Document the data-vs-display tension: the mockup KPI cards display
  // different aggregate totals from what the agent's net commissions
  // actually sum to in our data. We DON'T fail on this; we record the
  // observed values explicitly so the reviewer can decide the resolution.
  const agentViewer: ViewerContext = { userId: DEMO_AGENT_ID, role: "Agent" };
  const kpis = computeKPIs(seedCommissions, agentViewer);
  const breakdown = computeBreakdown(seedCommissions, agentViewer);

  // Mockup KPI expected values (for the record)
  const mockupTotal = 523_750;
  const mockupPaid = 245_000;
  const mockupPending = 188_750; // For Closing + For Payout per mockup language
  const mockupOnHold = 90_000;
  const mockupDonutOnHold = 52_500;

  // The mockup numbers cannot be derived from a uniform split of the table values.
  // Record the observed engine-computed values vs the mockup expectations.
  ok(
    section,
    "Recorded: mockup table gross sum",
    `sum of 6 rows = ₱${tableGrossSum.toLocaleString()}`,
  );
  ok(
    section,
    "Recorded: agent NET total (engine, 50/30/20 split)",
    `₱${kpis.totalEarned.toLocaleString()} vs mockup ₱${mockupTotal.toLocaleString()}`,
  );
  ok(
    section,
    "Recorded: agent NET paid (engine)",
    `₱${kpis.paidToDate.toLocaleString()} vs mockup ₱${mockupPaid.toLocaleString()}`,
  );
  ok(
    section,
    "Recorded: agent NET pending (engine, ForApproval+ForClosing+ForPayout)",
    `₱${kpis.pendingPayout.toLocaleString()} vs mockup ₱${mockupPending.toLocaleString()}`,
  );
  ok(
    section,
    "Recorded: agent NET on-hold (engine)",
    `₱${kpis.onHold.toLocaleString()} vs mockup ₱${mockupOnHold.toLocaleString()}`,
  );
  ok(
    section,
    "Recorded: donut on-hold tension (mockup donut vs KPI)",
    `mockup KPI On Hold = ₱${mockupOnHold.toLocaleString()}; mockup donut On Hold = ₱${mockupDonutOnHold.toLocaleString()}`,
  );
  ok(
    section,
    "Recorded: agent NET breakdown",
    `closed=₱${breakdown.closedDealsAmount.toLocaleString()}, forClosing=₱${breakdown.forClosingAmount.toLocaleString()}, forApproval=₱${breakdown.forApprovalAmount.toLocaleString()}, onHold=₱${breakdown.onHoldAmount.toLocaleString()}, forPayout=₱${breakdown.forPayoutAmount.toLocaleString()}`,
  );

  // Active assertion (does NOT pass/fail on the mockup reconciliation):
  // the engine values for the demo agent are stable and self-consistent.
  check(
    section,
    "Engine: agent KPI total ≥ paid + pending + onHold (lower bound)",
    kpis.totalEarned >= kpis.paidToDate + kpis.pendingPayout + kpis.onHold - 1,
    `total=${kpis.totalEarned}, paid+pending+onHold=${kpis.paidToDate + kpis.pendingPayout + kpis.onHold}`,
  );
  check(
    section,
    "Engine: agent KPI total ≤ paid + pending + onHold (upper bound)",
    kpis.totalEarned <= kpis.paidToDate + kpis.pendingPayout + kpis.onHold + 1,
    `total=${kpis.totalEarned}, paid+pending+onHold=${kpis.paidToDate + kpis.pendingPayout + kpis.onHold}`,
  );
}

// ----------------------------------------------------------------------------
// 6. PRD Coverage
// ----------------------------------------------------------------------------

function reportPRDCoverage() {
  const section = "6. PRD Coverage";

  check(
    section,
    `Manifest has exactly ${EXPECTED_ROUTE_COUNT} routes`,
    prdRoutes.length === EXPECTED_ROUTE_COUNT,
    `got ${prdRoutes.length}`,
  );

  // Route IDs unique
  const ids = prdRoutes.map((r) => r.id);
  const idSet = new Set(ids);
  check(
    section,
    "Route IDs are unique",
    ids.length === idSet.size,
    `dup count: ${ids.length - idSet.size}`,
  );

  // Status tallies
  const complete = prdRoutes.filter((r) => r.status === "complete").length;
  const scaffolded = prdRoutes.filter((r) => r.status === "scaffolded").length;
  const pending = prdRoutes.filter((r) => r.status === "pending").length;
  ok(
    section,
    "Coverage summary",
    `complete=${complete}, scaffolded=${scaffolded}, pending=${pending} (of ${prdRoutes.length})`,
  );
}

// ----------------------------------------------------------------------------
// Reporter
// ----------------------------------------------------------------------------

function report() {
  // Group by section
  const bySection = new Map<string, Assertion[]>();
  for (const r of results) {
    const arr = bySection.get(r.section) ?? [];
    arr.push(r);
    bySection.set(r.section, arr);
  }

  const sortedSections = Array.from(bySection.keys()).sort();

  console.log("\n┌─────────────────────────────────────────────────────────");
  console.log("│ REAL ESTATE HQ — VERIFY SUITE");
  console.log("└─────────────────────────────────────────────────────────");

  let totalPass = 0;
  let totalFail = 0;

  for (const section of sortedSections) {
    const assertions = bySection.get(section)!;
    const pass = assertions.filter((a) => a.passed).length;
    const failCount = assertions.length - pass;
    totalPass += pass;
    totalFail += failCount;

    const status = failCount === 0 ? "✓" : "✗";
    console.log(`\n${status} ${section}  —  ${pass}/${assertions.length} passed`);

    // Print failures with detail
    for (const a of assertions) {
      if (!a.passed) {
        console.log(`   ✗ ${a.name}`);
        if (a.detail) console.log(`     → ${a.detail}`);
      }
    }

    // Print recorded "ok" notes (those with detail, indicates important info)
    for (const a of assertions) {
      if (a.passed && a.detail && a.name.startsWith("Recorded")) {
        console.log(`   ◦ ${a.name}: ${a.detail}`);
      }
      if (a.passed && a.detail && a.name === "Coverage summary") {
        console.log(`   ◦ ${a.detail}`);
      }
    }
  }

  console.log("\n─────────────────────────────────────────────────────────");
  console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed`);
  console.log("─────────────────────────────────────────────────────────\n");

  if (totalFail > 0) {
    process.exit(1);
  }
}

// ----------------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------------

checkFKIntegrity();
checkStructuralInvariants();
checkDemoBeats();
checkRoleAwareLock();
checkCommissionMockup();
reportPRDCoverage();
report();
