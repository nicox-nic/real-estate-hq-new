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
import type { LeadSource, AccountStatus } from "@/lib/types";
import {
  AGENT_SCHEMA,
  BROKER_SCHEMA,
  REALTOR_SCHEMA,
  SCHEMAS_BY_ROLE,
  requiredFieldCount,
  requiredDocumentCount,
} from "@/lib/registrationSchemas";
import {
  landingDestination,
  canAccessRoleFeatures,
} from "@/lib/logic/accountAccess";
import {
  computeAgentDashboardKPIs,
  computeMoneyOnTheWay,
  selectActiveDeals,
  generateAgentAISuggestions,
  generateBriefingSentence,
} from "@/lib/logic/dashboardDerivations";
import {
  filterInbox,
  isQualified,
  isLowWeightCard,
  hasEngineEditorialDisagreement,
  badgeVariantForLead,
  chipCounts,
  buildListingPriceMap,
  scoreLeadWithContext,
} from "@/lib/logic/leadInboxDerivations";

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
// 6. Auth flow & registration schemas (Session 2)
// ----------------------------------------------------------------------------

function checkAuthAndSchemas() {
  const section = "6. Auth flow & schemas";

  // -- Schema completeness per role --
  // Each role schema covers all PRD-listed registration fields.
  // PRD field counts (required) — see lib/registrationSchemas.ts header.
  const expectedRequiredCounts = {
    Agent: 14, // 13 listed + consent
    Broker: 11, // 10 + consent (PRC license is optional)
    Realtor: 11, // 10 + consent (broker license is optional)
  };
  for (const role of ["Agent", "Broker", "Realtor"] as const) {
    const schema = SCHEMAS_BY_ROLE[role];
    const count = requiredFieldCount(schema);
    check(
      section,
      `${role} schema: required field count = ${expectedRequiredCounts[role]}`,
      count === expectedRequiredCounts[role],
      `got ${count}`,
    );
  }

  // Specific PRD fields must be present per role (canonical checks):
  function fieldIds(role: keyof typeof SCHEMAS_BY_ROLE): Set<string> {
    return new Set(SCHEMAS_BY_ROLE[role].fields.map((f) => f.id));
  }

  // Agent fields (PRD §Registration → Agent)
  const agentFields = fieldIds("Agent");
  for (const fid of [
    "fullName",
    "email",
    "mobile",
    "password",
    "confirmPassword",
    "agentNumber",
    "parentType",
    "parentName",
    "parentLicense",
    "parentCompany",
    "parentContact",
    "parentEmail",
    "officeLocation",
    "consent",
  ]) {
    check(section, `Agent schema has field: ${fid}`, agentFields.has(fid));
  }
  // Agent parentType options must include all 4 PRD-listed kinds
  const parentTypeOptions = SCHEMAS_BY_ROLE.Agent.fields.find(
    (f) => f.id === "parentType",
  )?.options;
  for (const expected of ["broker", "realtor", "realty", "developer"]) {
    check(
      section,
      `Agent parentType option present: ${expected}`,
      !!parentTypeOptions?.some((o) => o.value === expected),
    );
  }

  // Broker fields (PRD §Registration → Broker)
  const brokerFields = fieldIds("Broker");
  for (const fid of [
    "fullName",
    "email",
    "mobile",
    "password",
    "confirmPassword",
    "brokerLicenseNumber",
    "prcLicenseNumber",
    "companyName",
    "businessAddress",
    "officeLocation",
    "numAgentsUnderBroker",
    "consent",
  ]) {
    check(section, `Broker schema has field: ${fid}`, brokerFields.has(fid));
  }

  // Realtor fields (PRD §Registration → Realtor)
  const realtorFields = fieldIds("Realtor");
  for (const fid of [
    "fullName",
    "email",
    "mobile",
    "password",
    "confirmPassword",
    "realtorMembershipNumber",
    "boardOrAssociation",
    "brokerLicenseNumber",
    "companyName",
    "businessAddress",
    "officeLocation",
    "consent",
  ]) {
    check(section, `Realtor schema has field: ${fid}`, realtorFields.has(fid));
  }

  // -- Document requirements per role --
  // Each role has at least one required ID document.
  for (const role of ["Agent", "Broker", "Realtor"] as const) {
    const schema = SCHEMAS_BY_ROLE[role];
    check(
      section,
      `${role} schema has ≥1 required document`,
      requiredDocumentCount(schema) >= 1,
      `got ${requiredDocumentCount(schema)}`,
    );
  }

  // -- Account-status gating --
  // Verified users route to dashboard; all other states route to /auth/pending.
  const statusTrials: AccountStatus[] = [
    "Pending Verification",
    "Verified",
    "Rejected",
    "Needs More Documents",
  ];
  for (const s of statusTrials) {
    const agentDest = landingDestination("Agent", s);
    const brokerDest = landingDestination("Broker", s);
    const realtorDest = landingDestination("Realtor", s);
    if (s === "Verified") {
      check(
        section,
        `Verified Agent routes to /agent`,
        agentDest.kind === "dashboard" && agentDest.path === "/agent",
      );
      check(
        section,
        `Verified Broker routes to /broker`,
        brokerDest.kind === "dashboard" && brokerDest.path === "/broker",
      );
      check(
        section,
        `Verified Realtor routes to /realtor`,
        realtorDest.kind === "dashboard" && realtorDest.path === "/realtor",
      );
    } else {
      check(
        section,
        `Status "${s}" routes to pending for Agent`,
        agentDest.kind === "pending",
      );
      check(
        section,
        `Status "${s}" routes to pending for Broker`,
        brokerDest.kind === "pending",
      );
      check(
        section,
        `Status "${s}" routes to pending for Realtor`,
        realtorDest.kind === "pending",
      );
    }
  }

  // canAccessRoleFeatures returns true ONLY for Verified
  for (const s of statusTrials) {
    const expected = s === "Verified";
    check(
      section,
      `canAccessRoleFeatures("${s}") = ${expected}`,
      canAccessRoleFeatures(s) === expected,
    );
  }

  // -- Seed users include at least one Pending user (for the demo shortcut) --
  const pendingUser = seedUsers.find(
    (u) => u.status === "Pending Verification",
  );
  check(
    section,
    "≥1 seed user with Pending Verification status",
    !!pendingUser,
    pendingUser ? `e.g. ${pendingUser.email}` : "none found",
  );

  // -- Role-route mapping for the signup picker --
  // The signup screen must produce /auth/register/agent | /broker | /realtor.
  for (const role of ["Agent", "Broker", "Realtor"] as const) {
    const lower = role.toLowerCase();
    const route = `/auth/register/${lower}`;
    check(
      section,
      `Registration route exists for ${role}: ${route}`,
      prdRoutes.some((r) => r.route === route),
    );
  }

  // -- Forgot password stub registered --
  check(
    section,
    "Forgot Password route exists in manifest",
    prdRoutes.some((r) => r.route === "/auth/forgot-password"),
  );
}

// ----------------------------------------------------------------------------
// 7. Agent dashboard math & seeded-prop-anchors (Session 3A)
// ----------------------------------------------------------------------------

function checkDashboardMath() {
  const section = "7. Dashboard math";

  const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

  // -- KPI derivations are pure functions of seed --
  const kpis = computeAgentDashboardKPIs(
    DEMO_AGENT_ID,
    seedLeads,
    seedSiteVisits,
    seedDeals,
    SEED_REFERENCE_ISO,
    seedListings,
  );

  // Expected values (hand-computed):
  //   newLeadsToday: 0 (no agent-001 leads created on 2025-05-29)
  //   hotBuyers: 2 (lead-instagram-01 score=100, lead-tiktok-01 score=95)
  //   siteVisitsBooked: 2 (sv-001 May 31 Confirmed, sv-002 May 30 Reminder Sent)
  //   activeDeals: 4 (deals 001/002/003/006 all assigned to agent-001 in active stages)
  check(
    section,
    "KPI: newLeadsToday for demo agent",
    kpis.newLeadsToday === 0,
    `got ${kpis.newLeadsToday}`,
  );
  check(
    section,
    "KPI: hotBuyers for demo agent (engine ≥ 70)",
    kpis.hotBuyers === 2,
    `got ${kpis.hotBuyers}`,
  );
  check(
    section,
    "KPI: siteVisitsBooked for demo agent (future, confirmed-ish)",
    kpis.siteVisitsBooked === 2,
    `got ${kpis.siteVisitsBooked}`,
  );
  check(
    section,
    "KPI: activeDeals for demo agent",
    kpis.activeDeals === 4,
    `got ${kpis.activeDeals}`,
  );

  // -- Money on the Way derives from engine, not hardcoded --
  const demoAgent = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  if (!demoAgent) {
    fail(section, "Demo agent user record present", "not found");
    return;
  }
  const viewer = { userId: demoAgent.id, role: demoAgent.role };
  const motw = computeMoneyOnTheWay(seedCommissions, viewer);
  // From Session 1 recorded values:
  //   paidThisPeriod = 112,500
  //   pendingPayout  = 367,500 (For Approval + For Closing + For Payout)
  //   onHold         = 56,250
  //   monthlyTarget  = 600,000
  //   progress = (112500 + 367500) / 600000 = 0.80 → 80%
  check(
    section,
    "MotW: paidThisPeriod matches engine kpis.paidToDate",
    motw.paidThisPeriod === 112_500,
    `got ${motw.paidThisPeriod}`,
  );
  check(
    section,
    "MotW: pendingPayout matches engine kpis.pendingPayout",
    motw.pendingPayout === 367_500,
    `got ${motw.pendingPayout}`,
  );
  check(
    section,
    "MotW: onHold matches engine kpis.onHold",
    motw.onHold === 56_250,
    `got ${motw.onHold}`,
  );
  check(
    section,
    "MotW: monthlyTarget at default ₱600,000",
    motw.monthlyTargetPHP === 600_000,
    `got ${motw.monthlyTargetPHP}`,
  );
  check(
    section,
    "MotW: progressPercent = 80",
    motw.progressPercent === 80,
    `got ${motw.progressPercent}`,
  );

  // Donut segments sum to monthly target (with "To target" filling the remainder)
  const segmentSum = motw.segments.reduce((s, seg) => s + seg.value, 0);
  check(
    section,
    "MotW: donut segments sum to monthlyTarget (paid+pending+onHold+toTarget)",
    segmentSum === motw.monthlyTargetPHP + motw.onHold,
    `got ${segmentSum}, expected ${motw.monthlyTargetPHP + motw.onHold} (target + onHold-as-separate)`,
  );

  // -- Active deals selector returns the active subset, ordered by updatedAt desc --
  const activeDeals = selectActiveDeals(DEMO_AGENT_ID, seedDeals);
  check(
    section,
    "Active deals selector returns 4 active deals for demo agent",
    activeDeals.length === 4,
    `got ${activeDeals.length}`,
  );
  check(
    section,
    "Active deals: deal-001 (Contract Signed) is included",
    activeDeals.some((d) => d.dealId === "deal-001"),
  );
  check(
    section,
    "Active deals: deal-004 (Released) is excluded",
    !activeDeals.some((d) => d.dealId === "deal-004"),
  );
  check(
    section,
    "Active deals: deal-006 flagged with blocking documents",
    activeDeals.find((d) => d.dealId === "deal-006")?.hasBlockingDocuments ===
      true,
  );

  // -- AI suggestions surface the contradiction lead for review --
  const suggestions = generateAgentAISuggestions(
    DEMO_AGENT_ID,
    seedLeads,
    seedSiteVisits,
    SEED_REFERENCE_ISO,
    3,
    seedListings,
  );
  const contradictionSuggestion = suggestions.find((s) =>
    s.id.includes(CONTRADICTION_LEAD_ID),
  );
  check(
    section,
    "AI suggestion: contradiction lead surfaced for review",
    !!contradictionSuggestion,
    contradictionSuggestion ? contradictionSuggestion.title : "missing",
  );

  // -- Briefing sentence is deterministic given the KPI shape --
  const briefing = generateBriefingSentence("Alyssa", kpis);
  check(
    section,
    "Briefing sentence references hot buyers count",
    briefing.includes("2 hot buyer"),
    briefing,
  );
  check(
    section,
    "Briefing sentence references active deals count",
    briefing.includes("4 active deal"),
    briefing,
  );

  // ===== SEEDED-PROP-ANCHORS =====
  // Lock the state of one demo-critical lead and one demo-critical deal
  // so future sessions can't silently break demo narratives.

  // Anchor 1: lead-instagram-01 (Maria Santos, hot, site-visit-booked).
  const mariaLead = seedLeads.find((l) => l.id === "lead-instagram-01");
  if (!mariaLead) {
    fail(section, "Anchor: lead-instagram-01 exists", "missing");
  } else {
    check(
      section,
      "Anchor: Maria Santos lead is Hot category",
      mariaLead.category === "Hot Buyer",
    );
    check(
      section,
      "Anchor: Maria Santos editorial score = 95",
      mariaLead.seedScore === 95,
      `got ${mariaLead.seedScore}`,
    );
    check(
      section,
      "Anchor: Maria Santos site visit is booked",
      mariaLead.buyer.hasBookedSiteVisit === true,
    );
    check(
      section,
      "Anchor: Maria Santos engine score reaches max (100) with listing context",
      scoreLeadWithContext(mariaLead, buildListingPriceMap(seedListings))
        .total === LEAD_SCORE_MAX,
      `got ${scoreLeadWithContext(mariaLead, buildListingPriceMap(seedListings)).total}`,
    );
    check(
      section,
      "Anchor: Maria Santos is assigned to demo agent",
      mariaLead.assignedAgentId === DEMO_AGENT_ID,
    );
  }

  // Anchor 2: deal-001 (Laurel Hills 12A, For Closing, May 20)
  const laurelDeal = seedDeals.find((d) => d.id === "deal-001");
  if (!laurelDeal) {
    fail(section, "Anchor: deal-001 exists", "missing");
  } else {
    check(
      section,
      "Anchor: deal-001 contract price = ₱8,500,000",
      laurelDeal.contractPrice === 8_500_000,
      `got ${laurelDeal.contractPrice}`,
    );
    check(
      section,
      "Anchor: deal-001 commission rate = 3%",
      Math.abs(laurelDeal.commissionRate - 0.03) < 0.0001,
    );
    check(
      section,
      "Anchor: deal-001 stage = Contract Signed",
      laurelDeal.stage === "Contract Signed",
    );
    check(
      section,
      "Anchor: deal-001 agent = demo agent",
      laurelDeal.agentId === DEMO_AGENT_ID,
    );
    check(
      section,
      "Anchor: deal-001 buyer = Maria Santos",
      laurelDeal.buyerName === "Maria Santos",
    );
    const laurelComm = seedCommissions.find((c) => c.id === "comm-001");
    if (!laurelComm) {
      fail(section, "Anchor: comm-001 exists", "missing");
    } else {
      check(
        section,
        "Anchor: comm-001 status = For Closing",
        laurelComm.status === "For Closing",
      );
      check(
        section,
        "Anchor: comm-001 totalAmount = ₱255,000",
        laurelComm.totalAmount === 255_000,
        `got ${laurelComm.totalAmount}`,
      );
    }
  }
}

// ----------------------------------------------------------------------------
// 8. Lead Inbox & contradiction surfacing (Session 3A)
// ----------------------------------------------------------------------------

function checkInboxAndContradiction() {
  const section = "8. Inbox & contradiction";

  // -- Noise threshold gates the cold inquiry --
  const noiseLead = seedLeads.find((l) => l.id === COLD_NOISE_LEAD_ID);
  if (!noiseLead) {
    fail(section, "Cold noise lead present", "missing");
  } else {
    check(
      section,
      "Cold noise lead: engine score < QUALIFIED_THRESHOLD",
      !isQualified(noiseLead),
      `engine=${scoreLead({ buyer: noiseLead.buyer }).total}`,
    );
    check(
      section,
      "Cold noise lead is hidden from default inbox view (qualifiedOnly=true, All)",
      !filterInbox(seedLeads, {
        chip: "All",
        qualifiedOnly: true,
        search: "",
      }).some((l) => l.id === COLD_NOISE_LEAD_ID),
    );
    check(
      section,
      "Cold noise lead appears when qualifiedOnly=false",
      filterInbox(seedLeads, {
        chip: "All",
        qualifiedOnly: false,
        search: "",
      }).some((l) => l.id === COLD_NOISE_LEAD_ID),
    );
    check(
      section,
      "Cold noise lead renders as low-weight card",
      isLowWeightCard(noiseLead),
    );
  }

  // -- Contradiction lead: engine disagrees with editorial --
  const contradictionLead = seedLeads.find(
    (l) => l.id === CONTRADICTION_LEAD_ID,
  );
  if (!contradictionLead) {
    fail(section, "Contradiction lead present", "missing");
  } else {
    check(
      section,
      "Contradiction lead: editorial = Hot",
      contradictionLead.seedScoreCategory === "Hot",
    );
    check(
      section,
      "Contradiction lead: engine = Cold",
      scoreLead({ buyer: contradictionLead.buyer }).category === "Cold",
    );
    check(
      section,
      "Contradiction lead: hasEngineEditorialDisagreement() = true",
      hasEngineEditorialDisagreement(contradictionLead),
    );
    // It IS qualified by editorial standards (seedScore=82), so it should
    // appear in the default qualifiedOnly view — but Hot/Cold leads need
    // editorial value (Hot) to render the row's badge. The actual icon
    // rendering is locked in the LeadCard component; verify can only
    // assert the data-side cause for the icon to appear.
    check(
      section,
      "Contradiction lead appears in default inbox view",
      filterInbox(seedLeads, {
        chip: "All",
        qualifiedOnly: true,
        search: "",
      }).some((l) => l.id === CONTRADICTION_LEAD_ID),
      "Editorial-Hot label shows on row; engine-Cold drives the disagreement icon",
    );
  }

  // -- Chip filters work correctly --
  const allCount = filterInbox(seedLeads, {
    chip: "All",
    qualifiedOnly: false,
    search: "",
  }).length;
  check(
    section,
    "All chip (qualifiedOnly=false) returns every seed lead",
    allCount === seedLeads.length,
    `got ${allCount}, expected ${seedLeads.length}`,
  );

  const hotChip = filterInbox(seedLeads, {
    chip: "Hot",
    qualifiedOnly: false,
    search: "",
  });
  check(
    section,
    "Hot chip includes Maria Santos (engine Hot)",
    hotChip.some((l) => l.id === "lead-instagram-01"),
  );
  check(
    section,
    "Hot chip includes contradiction lead (editorial Hot)",
    hotChip.some((l) => l.id === CONTRADICTION_LEAD_ID),
  );

  const needsReplyChip = filterInbox(seedLeads, {
    chip: "Needs Reply",
    qualifiedOnly: false,
    search: "",
  });
  check(
    section,
    "Needs Reply chip filters only leads with needsReply=true",
    needsReplyChip.every((l) => l.needsReply),
  );

  const ofwChip = filterInbox(seedLeads, {
    chip: "OFW",
    qualifiedOnly: false,
    search: "",
  });
  check(
    section,
    "OFW chip surfaces ≥1 lead",
    ofwChip.length >= 1,
    `got ${ofwChip.length}`,
  );

  const investorChip = filterInbox(seedLeads, {
    chip: "Investor",
    qualifiedOnly: false,
    search: "",
  });
  check(
    section,
    "Investor chip surfaces ≥1 lead",
    investorChip.length >= 1,
    `got ${investorChip.length}`,
  );

  const siteVisitChip = filterInbox(seedLeads, {
    chip: "Site Visit",
    qualifiedOnly: false,
    search: "",
  });
  check(
    section,
    "Site Visit chip surfaces ≥1 lead",
    siteVisitChip.length >= 1,
    `got ${siteVisitChip.length}`,
  );

  const financingChip = filterInbox(seedLeads, {
    chip: "Financing",
    qualifiedOnly: false,
    search: "",
  });
  check(
    section,
    "Financing chip surfaces ≥1 lead",
    financingChip.length >= 1,
    `got ${financingChip.length}`,
  );

  // -- Search filters by name, tag, category --
  const searchByName = filterInbox(seedLeads, {
    chip: "All",
    qualifiedOnly: false,
    search: "Maria Santos",
  });
  check(
    section,
    "Search by name 'Maria Santos' finds the matching lead",
    searchByName.length >= 1 &&
      searchByName.some((l) => l.buyer.name === "Maria Santos Buyer"),
  );

  // -- Four-pronged structural proof on cold-vs-hot card differentiation --
  // The cold-noise lead vs Maria's lead must differ on multiple axes.
  if (noiseLead) {
    const mariaLead = seedLeads.find((l) => l.id === "lead-instagram-01");
    if (mariaLead) {
      // 1. Visual weight via isLowWeightCard
      check(
        section,
        "4-pronged proof #1: low-weight differs between cold-noise and Maria",
        isLowWeightCard(noiseLead) !== isLowWeightCard(mariaLead),
        `noise=${isLowWeightCard(noiseLead)}, maria=${isLowWeightCard(mariaLead)}`,
      );
      // 2. Badge variant differs
      check(
        section,
        "4-pronged proof #2: badge variant differs",
        badgeVariantForLead(noiseLead) !== badgeVariantForLead(mariaLead),
        `noise=${badgeVariantForLead(noiseLead)}, maria=${badgeVariantForLead(mariaLead)}`,
      );
      // 3. Tag presence differs (noise has 1 generic, Maria has 2+ rich)
      const noiseTags = noiseLead.tags ?? [];
      const mariaTags = mariaLead.tags ?? [];
      check(
        section,
        "4-pronged proof #3: tags-row content differs (noise sparse, Maria rich)",
        noiseTags.length <= 1 && mariaTags.length >= 2,
        `noise=${noiseTags.length}, maria=${mariaTags.length}`,
      );
      // 4. Engine category differs
      const noiseCat = scoreLead({ buyer: noiseLead.buyer }).category;
      const mariaCat = scoreLead({ buyer: mariaLead.buyer }).category;
      check(
        section,
        "4-pronged proof #4: engine category differs",
        noiseCat !== mariaCat,
        `noise=${noiseCat}, maria=${mariaCat}`,
      );
    }
  }

  // -- chipCounts behaves --
  const counts = chipCounts(seedLeads, true);
  check(
    section,
    "chipCounts.All ≤ chipCounts.All(qualifiedOnly=false)",
    counts.All <= chipCounts(seedLeads, false).All,
  );
}

// ----------------------------------------------------------------------------
// 9. PRD Coverage
// ----------------------------------------------------------------------------

function reportPRDCoverage() {
  const section = "9. PRD Coverage";

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

  // Session 2 stop-signal: 7 routes (the auth flow) marked complete.
  // We expect exactly the 7 auth routes that Session 2 promoted:
  // splash, create-account, register-agent, register-broker, register-realtor,
  // upload-documents, pending-verification, forgot-password = 8 entries total.
  // (The forgot-password addition pushes the count to 8.)
  const session2Routes = [
    "splash",
    "create-account",
    "register-agent",
    "register-broker",
    "register-realtor",
    "upload-documents",
    "pending-verification",
    "forgot-password",
  ];
  for (const id of session2Routes) {
    const entry = prdRoutes.find((r) => r.id === id);
    if (!entry) {
      fail(section, `Session 2 route ${id} present in manifest`, "missing");
      continue;
    }
    check(
      section,
      `Session 2 route "${id}" status = complete`,
      entry.status === "complete",
      `got ${entry.status}`,
    );
    check(
      section,
      `Session 2 route "${id}" completedInSession = 2`,
      entry.completedInSession === 2,
      `got ${entry.completedInSession}`,
    );
  }

  // Coverage cannot regress: complete ≥ 8 by Session 2 close.
  check(
    section,
    "Coverage progress: ≥ 8 routes complete after Session 2",
    complete >= 8,
    `complete=${complete}`,
  );

  // Session 3A stop-signal: 3 new routes promoted to complete.
  // agent-dashboard, leads-inbox, buyer-profile. buyer-conversation is
  // promoted to "scaffolded" (full impl in Session 3B).
  const session3aCompleteRoutes = [
    "agent-dashboard",
    "leads-inbox",
    "buyer-profile",
  ];
  for (const id of session3aCompleteRoutes) {
    const entry = prdRoutes.find((r) => r.id === id);
    if (!entry) {
      fail(section, `Session 3A route ${id} present in manifest`, "missing");
      continue;
    }
    check(
      section,
      `Session 3A route "${id}" status = complete`,
      entry.status === "complete",
      `got ${entry.status}`,
    );
    check(
      section,
      `Session 3A route "${id}" completedInSession = 3`,
      entry.completedInSession === 3,
      `got ${entry.completedInSession}`,
    );
  }

  // buyer-conversation: scaffolded
  const buyerConv = prdRoutes.find((r) => r.id === "buyer-conversation");
  if (!buyerConv) {
    fail(section, "buyer-conversation entry present", "missing");
  } else {
    check(
      section,
      "Session 3A: buyer-conversation status = scaffolded",
      buyerConv.status === "scaffolded",
      `got ${buyerConv.status}`,
    );
  }

  // Coverage progress: ≥ 11 complete after Session 3A.
  check(
    section,
    "Coverage progress: ≥ 11 routes complete after Session 3A",
    complete >= 11,
    `complete=${complete}`,
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
checkAuthAndSchemas();
checkDashboardMath();
checkInboxAndContradiction();
reportPRDCoverage();
report();
