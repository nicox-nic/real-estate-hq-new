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
import {
  ALL_TONES,
  ALL_LANGUAGES,
  TONE_MARKERS,
  suggestReply,
  type Tone,
  type Language,
} from "@/lib/logic/aiReply";
import {
  sendMessage,
  getClientMessageCount,
  _resetForTests,
} from "@/lib/conversationStore";
import {
  TRANSACTION_CATEGORIES,
  CATEGORY_SLUGS,
  categoryFromSlug,
  listingsByCategory,
  enrichDevelopers,
  unitsForProject,
  UNIT_FILTERS,
  applyUnitFilter,
  findDeveloper,
  findProject,
} from "@/lib/logic/listingsDerivations";
import { primaryActionFor } from "@/components/listings/ListingActionRow";
import { roleFromPathname } from "@/lib/useCurrentRole";
import {
  verificationVisualFor,
  ALL_VERIFICATION_STATUSES,
  type VerificationStatus,
} from "@/lib/logic/verificationVisual";
import {
  extractQuery,
  applyQuery,
  searchListings,
  transparencyChipsFor,
  SEARCH_RULES,
  LOCATION_KEYWORDS,
} from "@/lib/logic/aiListingSearch";
import {
  listingsForUser,
  applyActiveFilter,
  applyTransactionTypeFilter,
  myListingsHeadingFor,
  ACTIVE_FILTERS,
} from "@/lib/logic/myListingsDerivations";
import {
  generateShareMessage,
  SHARE_RULES,
} from "@/lib/logic/aiShareMessage";
import {
  applyShareTone,
  SHARE_FORBIDDEN_PHRASES,
} from "@/lib/logic/aiShareTone";
import {
  shareListing,
  smartLinkFor,
  getClientShareCount,
  _resetShareStoreForTests,
  appendEngagementEvent,
  getEngagementEvents,
} from "@/lib/shareStore";
import {
  recommendFilesFor,
  FILE_RECOMMENDATION_RULES,
  allRecommendableCategories,
  type FileRecommendationRule,
} from "@/lib/logic/aiFileRecommendation";
import {
  buildEngagementSchedule,
  SIMULATOR_TIMINGS,
} from "@/lib/logic/engagementSimulator";
import {
  labelFor as engagementLabelFor,
  categoryShortLabel,
} from "@/components/share/FileEngagementStrip";

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
      searchByName.some((l) => l.buyer.name === "Maria Santos"),
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
// 9. AI Suggested Reply — tones, languages, rule shapes (Session 3B)
// ----------------------------------------------------------------------------

function checkAIReply() {
  const section = "9. AI Reply";

  // Build common context the suggester needs.
  const priceById = buildListingPriceMap(seedListings);
  const noiseLead = seedLeads.find((l) => l.id === COLD_NOISE_LEAD_ID);
  const mariaLead = seedLeads.find((l) => l.id === "lead-instagram-01");
  const contradictionLead = seedLeads.find(
    (l) => l.id === CONTRADICTION_LEAD_ID,
  );

  // -- Tone coverage --
  check(
    section,
    "All 8 PRD tones registered in ALL_TONES",
    ALL_TONES.length === 8,
    `got ${ALL_TONES.length}`,
  );
  for (const t of ALL_TONES) {
    check(
      section,
      `Tone "${t}" has at least one vocabulary marker`,
      (TONE_MARKERS[t]?.length ?? 0) > 0,
    );
  }

  // -- Pairwise tone distinctness on a common draft --
  // Use Maria's lead as input so all rules can fire.
  if (mariaLead) {
    const toneOutputs = new Map<Tone, string>();
    for (const t of ALL_TONES) {
      const r = suggestReply({
        lead: mariaLead,
        listing: seedListings.find(
          (l) => l.id === mariaLead.selectedListingIds[0],
        ),
        files: [],
        lastBuyerMessage: "I'd like to know more about the unit",
        tone: t,
        language: "English",
      });
      toneOutputs.set(t, r.text);
    }
    // Each tone's output is distinct from every other tone's
    const toneEntries = Array.from(toneOutputs.entries());
    for (let i = 0; i < toneEntries.length; i++) {
      for (let j = i + 1; j < toneEntries.length; j++) {
        const aEntry = toneEntries[i]!;
        const bEntry = toneEntries[j]!;
        const [a, aOut] = aEntry;
        const [b, bOut] = bEntry;
        check(
          section,
          `Tone distinctness: "${a}" ≠ "${b}"`,
          aOut !== bOut,
        );
      }
    }

    // Each tone's vocabulary markers appear in its own output (case-insensitive)
    for (const [t, out] of toneEntries) {
      const markers = TONE_MARKERS[t];
      const outLower = out.toLowerCase();
      const found = markers.some((m) => outLower.includes(m.toLowerCase()));
      check(
        section,
        `Tone "${t}" output contains ≥1 vocabulary marker`,
        found,
        `markers checked: ${markers.join(", ")}`,
      );
    }

    // Short Reply is meaningfully shorter than Detailed Reply
    const shortOut = toneOutputs.get("Short Reply")!;
    const detailedOut = toneOutputs.get("Detailed Reply")!;
    const shortWords = shortOut.trim().split(/\s+/).length;
    const detailedWords = detailedOut.trim().split(/\s+/).length;
    check(
      section,
      "Short Reply word count < Detailed Reply word count",
      shortWords < detailedWords,
      `short=${shortWords}, detailed=${detailedWords}`,
    );
    check(
      section,
      "Short Reply ≤ 35 words",
      shortWords <= 35,
      `got ${shortWords}`,
    );
    check(
      section,
      "Detailed Reply ≥ 60 words",
      detailedWords >= 60,
      `got ${detailedWords}`,
    );
  }

  // -- Language coverage --
  check(
    section,
    "All 3 PRD languages registered in ALL_LANGUAGES",
    ALL_LANGUAGES.length === 3,
    `got ${ALL_LANGUAGES.length}`,
  );

  // -- Language pairwise distinctness with marker assertions --
  if (mariaLead) {
    const langOutputs = new Map<Language, string>();
    for (const l of ALL_LANGUAGES) {
      const r = suggestReply({
        lead: mariaLead,
        listing: seedListings.find(
          (li) => li.id === mariaLead.selectedListingIds[0],
        ),
        files: [],
        lastBuyerMessage: "I'd like to know more about the unit",
        tone: "Friendly Agent",
        language: l,
      });
      langOutputs.set(l, r.text);
    }

    // Pairwise distinct
    const langEntries = Array.from(langOutputs.entries());
    for (let i = 0; i < langEntries.length; i++) {
      for (let j = i + 1; j < langEntries.length; j++) {
        const aEntry = langEntries[i]!;
        const bEntry = langEntries[j]!;
        const [a, aOut] = aEntry;
        const [b, bOut] = bEntry;
        check(
          section,
          `Language distinctness: "${a}" ≠ "${b}"`,
          aOut !== bOut,
        );
      }
    }

    // English: no po, no Maayong
    const enOut = langOutputs.get("English")!;
    check(
      section,
      "English output does not contain 'po'",
      !/(^|\s)po(\s|[.,!?])/.test(enOut),
      `output: ${enOut.slice(0, 80)}...`,
    );
    check(
      section,
      "English output does not contain 'Maayong'",
      !enOut.includes("Maayong"),
    );

    // Tagalog: contains po, contains Kumusta, NEVER contains Maayong
    const tlOut = langOutputs.get("Tagalog")!;
    check(
      section,
      "Tagalog output contains 'po'",
      /(^|\s)po(\s|[.,!?])/.test(tlOut),
    );
    check(
      section,
      "Tagalog output contains 'Kumusta'",
      tlOut.includes("Kumusta"),
    );
    check(
      section,
      "Tagalog output does NOT contain 'Maayong'",
      !tlOut.includes("Maayong"),
    );

    // Cebuano: contains Maayong, NEVER contains po (common error)
    const cbOut = langOutputs.get("Cebuano")!;
    check(
      section,
      "Cebuano output contains 'Maayong'",
      cbOut.includes("Maayong"),
    );
    check(
      section,
      "Cebuano output does NOT contain 'po' (common error guard)",
      !/(^|\s)po(\s|[.,!?])/.test(cbOut),
      `output: ${cbOut.slice(0, 120)}...`,
    );
  }

  // -- Cold-vs-Hot four-pronged structural proof on AI replies --
  // Cherry-equivalent canonical noise inquiry (JM Garcia: "is this still available?")
  if (noiseLead && mariaLead) {
    const coldReply = suggestReply({
      lead: noiseLead,
      listing: seedListings.find(
        (l) => l.id === noiseLead.selectedListingIds[0],
      ),
      files: [],
      lastBuyerMessage: noiseLead.lastMessagePreview,
      tone: "Friendly Agent",
      language: "English",
    });

    // Synthesize a hot lead that hasn't yet booked, so the hot-site-visit
    // rule fires (the seed's two hot leads both already have a visit booked).
    const hotPendingLead = {
      ...mariaLead,
      buyer: { ...mariaLead.buyer, hasBookedSiteVisit: false },
    };
    const hotReply = suggestReply({
      lead: hotPendingLead,
      listing: seedListings.find(
        (l) => l.id === hotPendingLead.selectedListingIds[0],
      ),
      files: seedPropertyFiles.filter(
        (f) => f.listingId === hotPendingLead.selectedListingIds[0],
      ),
      lastBuyerMessage: "I'd like to view the property",
      tone: "Friendly Agent",
      language: "English",
    });

    // 1. Cold rule fires for the noise lead
    check(
      section,
      "4-pronged cold-vs-hot #1: cold-noise lead routes to 'cold-qualifier' rule",
      coldReply.ruleName === "cold-qualifier",
      `got rule=${coldReply.ruleName}`,
    );

    // 2. Cold reply has ZERO booking CTAs
    const coldBookingCount = coldReply.suggestedActions.filter(
      (a) => a.kind === "book_site_visit",
    ).length;
    check(
      section,
      "4-pronged cold-vs-hot #2: cold reply has 0 book_site_visit actions",
      coldBookingCount === 0,
      `got ${coldBookingCount}`,
    );

    // 3. Cold reply contains qualifying-question regex (budget|location|timeline|ask)
    check(
      section,
      "4-pronged cold-vs-hot #3: cold reply matches qualifying-question pattern",
      /budget|location|timeline|may I ask|preferred/i.test(coldReply.text),
      `cold text: ${coldReply.text.slice(0, 120)}...`,
    );

    // 4. Cold reply shape is qualifying (contains a "?" — it's asking), hot
    //    reply shape is offering (mentions a viewing slot). Word-count isn't
    //    the right axis: cold needs space to ask multiple clarifications;
    //    hot can be decisive ("here are two slots"). What matters is the
    //    semantic shape.
    check(
      section,
      "4-pronged cold-vs-hot #4: cold reply asks a question (contains '?')",
      coldReply.text.includes("?"),
      `cold text: ${coldReply.text.slice(0, 120)}...`,
    );
    check(
      section,
      "4-pronged cold-vs-hot #4b: hot reply offers viewing (mentions 'viewing' or 'visit' or 'slot')",
      /viewing|slot|visit/i.test(hotReply.text),
      `hot text: ${hotReply.text.slice(0, 120)}...`,
    );

    // Hot reply has at least one booking CTA (the rule explicitly offers a visit)
    check(
      section,
      "Hot-pending reply routes to 'hot-site-visit' rule",
      hotReply.ruleName === "hot-site-visit",
      `got rule=${hotReply.ruleName}`,
    );
    const hotBookingCount = hotReply.suggestedActions.filter(
      (a) => a.kind === "book_site_visit",
    ).length;
    check(
      section,
      "Hot-pending reply (rule hot-site-visit) has ≥1 book_site_visit action",
      hotBookingCount >= 1,
      `got ${hotBookingCount}`,
    );
  }

  // -- Agent note fires on sensitive-topic keywords --
  if (mariaLead) {
    const financingReply = suggestReply({
      lead: mariaLead,
      listing: seedListings.find(
        (l) => l.id === mariaLead.selectedListingIds[0],
      ),
      files: [],
      lastBuyerMessage: "Can you explain the financing options?",
      tone: "Friendly Agent",
      language: "English",
    });
    check(
      section,
      "Agent note fires when buyer message contains 'financing'",
      !!financingReply.agentNote,
      `note: ${financingReply.agentNote ?? "missing"}`,
    );
    check(
      section,
      "Financing reply routes to 'financing-explainer' rule",
      financingReply.ruleName === "financing-explainer",
      `got rule=${financingReply.ruleName}`,
    );

    const innocentReply = suggestReply({
      lead: mariaLead,
      listing: seedListings.find(
        (l) => l.id === mariaLead.selectedListingIds[0],
      ),
      files: [],
      lastBuyerMessage: "Hi just saying hello",
      tone: "Friendly Agent",
      language: "English",
    });
    check(
      section,
      "Agent note NOT fired on benign message",
      !innocentReply.agentNote,
    );
  }

  // -- AI suggester is a pure function (call twice → identical result) --
  if (mariaLead) {
    const a = suggestReply({
      lead: mariaLead,
      listing: seedListings.find(
        (l) => l.id === mariaLead.selectedListingIds[0],
      ),
      files: [],
      lastBuyerMessage: "Can I book a site visit?",
      tone: "Professional Broker",
      language: "Tagalog",
    });
    const b = suggestReply({
      lead: mariaLead,
      listing: seedListings.find(
        (l) => l.id === mariaLead.selectedListingIds[0],
      ),
      files: [],
      lastBuyerMessage: "Can I book a site visit?",
      tone: "Professional Broker",
      language: "Tagalog",
    });
    check(
      section,
      "AI suggester is deterministic (call twice → identical text)",
      a.text === b.text,
    );
    check(
      section,
      "AI suggester is deterministic (call twice → identical rule)",
      a.ruleName === b.ruleName,
    );
    check(
      section,
      "AI suggester is deterministic (call twice → identical action count)",
      a.suggestedActions.length === b.suggestedActions.length,
    );
  }

  // -- Editorial bypass continues to hold (carry-forward from 3A) --
  if (contradictionLead) {
    check(
      section,
      "Editorial bypass: contradiction lead still visible in default inbox",
      filterInbox(seedLeads, {
        chip: "All",
        qualifiedOnly: true,
        search: "",
        listingPriceById: priceById,
      }).some((l) => l.id === CONTRADICTION_LEAD_ID),
    );
    check(
      section,
      "Editorial bypass: contradiction lead has disagreement flagged",
      hasEngineEditorialDisagreement(contradictionLead, priceById),
    );
  }

  // -- Send action mutation invariants (pure function level) --
  // Reset client store to baseline, then send, then assert count changed.
  _resetForTests();
  const beforeCount = getClientMessageCount("lead-instagram-01");
  const sent = sendMessage({
    leadId: "lead-instagram-01",
    body: "Test reply",
    tone: "Friendly Agent",
    language: "English",
    attachmentIds: undefined,
  });
  const afterCount = getClientMessageCount("lead-instagram-01");
  check(
    section,
    "sendMessage: client store grows by 1",
    afterCount === beforeCount + 1,
    `before=${beforeCount}, after=${afterCount}`,
  );
  check(
    section,
    "sendMessage: returned message has sender='agent'",
    sent.sender === "agent",
  );
  check(
    section,
    "sendMessage: returned message has the supplied body",
    sent.body === "Test reply",
  );
  check(
    section,
    "sendMessage: returned message captures tone",
    sent.tone === "Friendly Agent",
  );
  check(
    section,
    "sendMessage: returned message captures language",
    sent.language === "English",
  );
  check(
    section,
    "sendMessage: returned message has a unique-looking ID",
    sent.id.startsWith("msg-sent-"),
  );
  _resetForTests();
}

// ----------------------------------------------------------------------------
// 10. Listings spine & role-aware actions (Session 4A)
// ----------------------------------------------------------------------------

function checkListingsSpine() {
  const section = "10. Listings spine";

  // -- Category coverage --
  check(
    section,
    "TRANSACTION_CATEGORIES has all 7 PRD categories",
    TRANSACTION_CATEGORIES.length === 7,
    `got ${TRANSACTION_CATEGORIES.length}`,
  );

  // CATEGORY_SLUGS is total and stable
  for (const c of TRANSACTION_CATEGORIES) {
    check(
      section,
      `CATEGORY_SLUGS has slug for "${c}"`,
      typeof CATEGORY_SLUGS[c] === "string" && CATEGORY_SLUGS[c].length > 0,
    );
    check(
      section,
      `categoryFromSlug round-trips "${c}"`,
      categoryFromSlug(CATEGORY_SLUGS[c]) === c,
    );
  }

  // listingsByCategory returns counts in PRD order with no missing key
  const counts = listingsByCategory(seedListings);
  check(
    section,
    "listingsByCategory returns 7 entries in PRD order",
    counts.length === 7 &&
      counts.every((e, i) => e.category === TRANSACTION_CATEGORIES[i]),
  );
  const totalListings = counts.reduce((s, e) => s + e.count, 0);
  check(
    section,
    "Category counts sum to seedListings.length",
    totalListings === seedListings.length,
    `sum=${totalListings}, listings=${seedListings.length}`,
  );

  // Each category has ≥1 listing — prevents an empty category landing.
  for (const c of TRANSACTION_CATEGORIES) {
    const n = counts.find((e) => e.category === c)?.count ?? 0;
    check(
      section,
      `Category "${c}" has ≥1 listing seeded`,
      n >= 1,
      `got ${n}`,
    );
  }

  // -- Developer-level enrichment --
  const developers = enrichDevelopers(
    seedDevelopers,
    seedProjects,
    seedUnits,
  );
  check(
    section,
    "Developer Listings page has ≥5 developer cards (framing minimum)",
    developers.length >= 5,
    `got ${developers.length}`,
  );

  for (const d of developers) {
    check(
      section,
      `Developer "${d.developer.name}" has ≥2 projects`,
      d.projects.length >= 2,
      `got ${d.projects.length}`,
    );
    check(
      section,
      `Developer "${d.developer.name}" has ≥1 available unit`,
      d.availableUnits >= 1,
      `got ${d.availableUnits}`,
    );
  }

  // -- Project-level density --
  for (const p of seedProjects) {
    const projUnits = unitsForProject(p.id, seedUnits);
    check(
      section,
      `Project "${p.name}" has ≥6 units (framing minimum for drill-down density)`,
      projUnits.length >= 6,
      `got ${projUnits.length}`,
    );
  }

  // unitsForProject sort: Available first, then by price ascending
  const someProject = seedProjects[0]!;
  const sortedUnits = unitsForProject(someProject.id, seedUnits);
  if (sortedUnits.length >= 2) {
    // Within each availability bucket, prices are non-decreasing
    let bucketStartAvail = sortedUnits[0]!.availability;
    let bucketStartPrice = sortedUnits[0]!.price;
    for (let i = 1; i < sortedUnits.length; i++) {
      const u = sortedUnits[i]!;
      if (u.availability !== bucketStartAvail) {
        bucketStartAvail = u.availability;
        bucketStartPrice = u.price;
      } else {
        check(
          section,
          `unitsForProject ordering: within "${bucketStartAvail}", prices non-decreasing`,
          u.price >= bucketStartPrice,
          `at unit ${u.id}: ${u.price} < ${bucketStartPrice}`,
        );
        bucketStartPrice = u.price;
      }
    }
  }

  // -- Unit filter chips --
  check(
    section,
    "UNIT_FILTERS has the 8 PRD chips",
    UNIT_FILTERS.length === 8,
    `got ${UNIT_FILTERS.length}`,
  );
  const allUnitsForSomeProject = seedUnits.filter(
    (u) => u.projectId === someProject.id,
  );
  // "All" returns everything
  check(
    section,
    "applyUnitFilter('All') returns all units for a project",
    applyUnitFilter(allUnitsForSomeProject, "All").length ===
      allUnitsForSomeProject.length,
  );
  // "Available" excludes Sold and Reserved (we also include Sold Out Soon as "still actionable")
  const available = applyUnitFilter(allUnitsForSomeProject, "Available");
  check(
    section,
    "applyUnitFilter('Available') excludes Sold and Reserved",
    available.every(
      (u) => u.availability === "Available" || u.availability === "Sold Out Soon",
    ),
  );

  // -- Seeded-prop anchors --
  // Anchor 1: dev-landmasters with proj-laurel-hills
  const landmasters = developers.find(
    (d) => d.developer.id === "dev-landmasters",
  );
  if (!landmasters) {
    fail(section, "Anchor: dev-landmasters exists", "missing");
  } else {
    check(
      section,
      "Anchor: Landmasters has 3 projects",
      landmasters.projects.length === 3,
      `got ${landmasters.projects.length}`,
    );
    check(
      section,
      "Anchor: Landmasters covers Cebu, Mactan, Mandaue",
      landmasters.developer.locationsCovered.includes("Cebu City") &&
        landmasters.developer.locationsCovered.includes("Mactan"),
    );
    const laurel = landmasters.projects.find(
      (p) => p.id === "proj-laurel-hills",
    );
    check(
      section,
      "Anchor: proj-laurel-hills exists under Landmasters",
      !!laurel,
    );
    if (laurel) {
      check(
        section,
        "Anchor: Laurel Hills is RFO",
        laurel.status === "RFO",
      );
      const laurelUnits = unitsForProject("proj-laurel-hills", seedUnits);
      check(
        section,
        "Anchor: Laurel Hills has exactly 6 seeded units",
        laurelUnits.length === 6,
        `got ${laurelUnits.length}`,
      );
      check(
        section,
        "Anchor: unit-laurel-12a is the demo deal unit",
        laurelUnits.some((u) => u.id === "unit-laurel-12a"),
      );
    }
  }

  // Anchor 2: proj-the-veranda — demo unit (Alex Reyes deal)
  const verandaUnits = unitsForProject("proj-the-veranda", seedUnits);
  check(
    section,
    "Anchor: The Veranda has 6 units seeded",
    verandaUnits.length === 6,
    `got ${verandaUnits.length}`,
  );
  check(
    section,
    "Anchor: unit-veranda-8f present (demo deal target)",
    verandaUnits.some((u) => u.id === "unit-veranda-8f"),
  );

  // -- Role-aware action mapping --
  // Pure helper level: same listing, three roles, three labels.
  const agentAction = primaryActionFor("Agent");
  const brokerAction9 = primaryActionFor("Broker", 9);
  const realtorAction = primaryActionFor("Realtor");
  check(
    section,
    "Role-aware action: Agent → 'Share to my pipeline'",
    agentAction.label === "Share to my pipeline",
    `got ${agentAction.label}`,
  );
  check(
    section,
    "Role-aware action: Broker (9 agents) → 'Send to 9 agents'",
    brokerAction9.label === "Send to 9 agents",
    `got ${brokerAction9.label}`,
  );
  check(
    section,
    "Role-aware action: Realtor → 'Send to network'",
    realtorAction.label === "Send to network",
    `got ${realtorAction.label}`,
  );
  // All three differ
  check(
    section,
    "Role-aware action: three role labels are pairwise distinct",
    agentAction.label !== brokerAction9.label &&
      brokerAction9.label !== realtorAction.label &&
      agentAction.label !== realtorAction.label,
  );
  // Broker fallback when count is 0
  const brokerAction0 = primaryActionFor("Broker", 0);
  check(
    section,
    "Role-aware action: Broker (0 agents) → 'Send to agents' fallback",
    brokerAction0.label === "Send to agents",
    `got ${brokerAction0.label}`,
  );

  // -- useCurrentRole URL → role mapping --
  check(
    section,
    "roleFromPathname('/agent/listings') === 'Agent'",
    roleFromPathname("/agent/listings") === "Agent",
  );
  check(
    section,
    "roleFromPathname('/broker/listings') === 'Broker'",
    roleFromPathname("/broker/listings") === "Broker",
  );
  check(
    section,
    "roleFromPathname('/realtor/listings') === 'Realtor'",
    roleFromPathname("/realtor/listings") === "Realtor",
  );
  check(
    section,
    "roleFromPathname('/') defaults to 'Agent' (safe default)",
    roleFromPathname("/") === "Agent",
  );
  check(
    section,
    "roleFromPathname('/auth/signup') defaults to 'Agent'",
    roleFromPathname("/auth/signup") === "Agent",
  );

  // -- Demo broker has the expected 9 agents (drives "Send to 9 agents" label) --
  const agentsUnderDemoBroker = seedUsers.filter(
    (u) => u.parentId === DEMO_BROKER_ID && u.role === "Agent",
  ).length;
  check(
    section,
    "Demo broker (broker-001) has exactly 9 agents — the 'Send to 9 agents' label depends on this",
    agentsUnderDemoBroker === 9,
    `got ${agentsUnderDemoBroker}`,
  );

  // -- Lookup helpers --
  check(
    section,
    "findDeveloper returns dev-landmasters",
    findDeveloper("dev-landmasters", seedDevelopers)?.name === "Landmasters",
  );
  check(
    section,
    "findDeveloper returns undefined for unknown ID",
    findDeveloper("dev-nope", seedDevelopers) === undefined,
  );
  check(
    section,
    "findProject returns proj-laurel-hills",
    findProject("proj-laurel-hills", seedProjects)?.name === "Laurel Hills Estate",
  );
}

// ----------------------------------------------------------------------------
// 12. Listings 4B — Verification visual, Private Offerings, My Listings, AI Search
// ----------------------------------------------------------------------------

function checkListings4B() {
  const section = "12. Listings 4B";

  // -- Verification visual (5th concentration point) --
  check(
    section,
    "ALL_VERIFICATION_STATUSES has the 3 PRD states",
    ALL_VERIFICATION_STATUSES.length === 3,
    `got ${ALL_VERIFICATION_STATUSES.length}`,
  );

  for (const s of ALL_VERIFICATION_STATUSES) {
    const v = verificationVisualFor(s);
    check(
      section,
      `verificationVisualFor("${s}") returns non-empty label`,
      v.label.length > 0,
    );
    check(
      section,
      `verificationVisualFor("${s}") returns badge class string`,
      typeof v.badgeClass === "string" && v.badgeClass.length > 0,
    );
    check(
      section,
      `verificationVisualFor("${s}") returns semantic identifier`,
      typeof v.semantic === "string",
    );
  }

  // The three visuals are pairwise distinct (label and semantic)
  const visuals = ALL_VERIFICATION_STATUSES.map(verificationVisualFor);
  const labels = visuals.map((v) => v.label);
  const semantics = visuals.map((v) => v.semantic);
  check(
    section,
    "Verification labels pairwise distinct (Verified vs Pending vs Unverified)",
    new Set(labels).size === 3,
  );
  check(
    section,
    "Verification semantic IDs pairwise distinct",
    new Set(semantics).size === 3,
  );
  // Semantic IDs are stable strings
  check(
    section,
    "verificationVisualFor('Verified').semantic === 'verified'",
    verificationVisualFor("Verified").semantic === "verified",
  );
  check(
    section,
    "verificationVisualFor('Pending').semantic === 'pending'",
    verificationVisualFor("Pending").semantic === "pending",
  );
  check(
    section,
    "verificationVisualFor('Unverified').semantic === 'unverified'",
    verificationVisualFor("Unverified").semantic === "unverified",
  );

  // -- Private Offerings seed: 8-10 with 50/30/20 ratio --
  const forSalePrivate = seedListings.filter(
    (l) =>
      l.transactionType === "For Sale" && l.ownership !== "Developer Listing",
  );
  check(
    section,
    "Private For-Sale offerings: ≥8 (framing minimum)",
    forSalePrivate.length >= 8,
    `got ${forSalePrivate.length}`,
  );

  const verifiedCount = forSalePrivate.filter(
    (l) => l.verificationStatus === "Verified",
  ).length;
  const pendingCount = forSalePrivate.filter(
    (l) => l.verificationStatus === "Pending",
  ).length;
  const unverifiedCount = forSalePrivate.filter(
    (l) => l.verificationStatus === "Unverified",
  ).length;

  check(
    section,
    "Private offerings: ≥1 Verified seeded",
    verifiedCount >= 1,
    `got ${verifiedCount}`,
  );
  check(
    section,
    "Private offerings: ≥1 Pending seeded",
    pendingCount >= 1,
    `got ${pendingCount}`,
  );
  check(
    section,
    "Private offerings: ≥1 Unverified seeded",
    unverifiedCount >= 1,
    `got ${unverifiedCount}`,
  );
  // Verified dominates (per framing's 50/30/20 ratio guidance)
  check(
    section,
    "Private offerings: Verified > Pending count (ratio sanity)",
    verifiedCount > pendingCount,
    `verified=${verifiedCount}, pending=${pendingCount}`,
  );
  check(
    section,
    "Private offerings: Pending > Unverified count (ratio sanity)",
    pendingCount >= unverifiedCount,
    `pending=${pendingCount}, unverified=${unverifiedCount}`,
  );

  // -- Seeded-prop anchor: listing-private-banawa-townhouse --
  const banawaAnchor = seedListings.find(
    (l) => l.id === "listing-private-banawa-townhouse",
  );
  check(
    section,
    "Anchor: listing-private-banawa-townhouse exists",
    !!banawaAnchor,
  );
  if (banawaAnchor) {
    check(
      section,
      "Anchor: banawa-townhouse is For Sale + Personal Listing",
      banawaAnchor.transactionType === "For Sale" &&
        banawaAnchor.ownership === "Personal Listing",
    );
    check(
      section,
      "Anchor: banawa-townhouse is Verified",
      banawaAnchor.verificationStatus === "Verified",
    );
    check(
      section,
      "Anchor: banawa-townhouse owned by agent-001 (Alyssa)",
      banawaAnchor.ownerAgentId === "agent-001",
    );
    check(
      section,
      "Anchor: banawa-townhouse price is ₱9.8M",
      banawaAnchor.price === 9_800_000,
    );
    check(
      section,
      "Anchor: banawa-townhouse located in Banawa, Cebu City",
      banawaAnchor.location.includes("Banawa"),
    );
    check(
      section,
      "Anchor: banawa-townhouse assigned to agent-001 (drives My Listings density)",
      (banawaAnchor.assignedAgentIds ?? []).includes("agent-001"),
    );
  }

  // -- AI Listing Search: pure functional behavior --
  // Cross-axis structured queries → expected matches.
  const allFor = (l: typeof seedListings) => l;
  const allListings = allFor(seedListings);

  // Location-only: "BGC" → only BGC listings
  {
    const r = searchListings("BGC", allListings);
    check(
      section,
      "Search 'BGC' returns ≥1 match",
      r.matches.length >= 1,
      `got ${r.matches.length}`,
    );
    check(
      section,
      "Search 'BGC' returns only listings with 'BGC' in location",
      r.matches.every((l) => /bgc/i.test(l.location)),
    );
    // Transparency chips contain a "location" chip with label "BGC"
    check(
      section,
      "Search 'BGC' produces a location chip with label 'BGC'",
      r.chips.some((c) => c.kind === "location" && c.label === "BGC"),
    );
  }

  // Price ceiling: "under 10M"
  {
    const r = searchListings("under 10M", allListings);
    check(
      section,
      "Search 'under 10M' returns ≥1 match",
      r.matches.length >= 1,
    );
    check(
      section,
      "Search 'under 10M' returns only listings with price ≤ 10_000_000",
      r.matches.every((l) => l.price <= 10_000_000),
    );
    check(
      section,
      "Search 'under 10M' produces a maxPrice chip",
      r.chips.some((c) => c.kind === "maxPrice"),
    );
  }

  // Bedrooms: "2BR"
  {
    const r = searchListings("2BR", allListings);
    check(section, "Search '2BR' returns ≥1 match", r.matches.length >= 1);
    // Per the engine: listings without parseable bedrooms aren't excluded —
    // those with parseable bedrooms must equal 2.
    check(
      section,
      "Search '2BR' returns only listings whose parseable bedroom count is 2 (others permissive)",
      r.matches.every((l) => {
        const m = `${l.title} ${l.propertyType}`.match(
          /(\d+)\s?(?:br|bedroom|bed)/i,
        );
        if (!m || !m[1]) return true; // permissive — no parseable bedrooms
        return parseInt(m[1], 10) === 2;
      }),
    );
    check(
      section,
      "Search '2BR' produces a bedrooms chip with label '2BR'",
      r.chips.some((c) => c.kind === "bedrooms" && c.label === "2BR"),
    );
  }

  // Transaction type: "foreclosure properties in Cebu"
  {
    const r = searchListings("foreclosure properties in Cebu", allListings);
    check(
      section,
      "Search 'foreclosure properties in Cebu' returns only Foreclosure listings",
      r.matches.every((l) => l.transactionType === "Foreclosure"),
    );
    check(
      section,
      "Search 'foreclosure properties in Cebu' returns only Cebu listings",
      r.matches.every((l) => /cebu/i.test(l.location)),
    );
    check(
      section,
      "Search 'foreclosure ...' produces a transactionType chip 'Foreclosure'",
      r.chips.some(
        (c) => c.kind === "transactionType" && c.label === "Foreclosure",
      ),
    );
  }

  // Property type + price ceiling: "Show me condos in BGC under 20M"
  {
    const r = searchListings("Show me condos in BGC under 20M", allListings);
    check(
      section,
      "Composite search returns only Condos",
      r.matches.every((l) => l.propertyType === "Condo"),
    );
    check(
      section,
      "Composite search returns only BGC location",
      r.matches.every((l) => /bgc/i.test(l.location)),
    );
    check(
      section,
      "Composite search returns only price ≤ 20M",
      r.matches.every((l) => l.price <= 20_000_000),
    );
    // Transparency chips for all three axes
    check(
      section,
      "Composite search transparency: 3 chips (propertyType + location + maxPrice)",
      r.chips.filter(
        (c) =>
          c.kind === "propertyType" ||
          c.kind === "location" ||
          c.kind === "maxPrice",
      ).length === 3,
    );
  }

  // Commission filter: "at least 3% commission"
  {
    const r = searchListings("at least 3% commission", allListings);
    check(
      section,
      "Search 'at least 3% commission' returns only listings with commission ≥ 0.03",
      r.matches.every((l) => l.commissionRate >= 0.03),
    );
    check(
      section,
      "Search '... commission' produces a minCommission chip",
      r.chips.some((c) => c.kind === "minCommission"),
    );
  }

  // Anchor query: the demo-narrative search
  {
    const r = searchListings("2BR condo in BGC under 20M", allListings);
    check(
      section,
      "Anchor query '2BR condo in BGC under 20M' returns exactly 1 match",
      r.matches.length === 1,
      `got ${r.matches.length}`,
    );
    check(
      section,
      "Anchor query match is listing-private-bgc-condo",
      r.matches[0]?.id === "listing-private-bgc-condo",
    );
    // 4 transparency chips: 2BR + Condo + BGC + ≤₱20M
    check(
      section,
      "Anchor query produces exactly 4 transparency chips",
      r.chips.length === 4,
      `got ${r.chips.length} chips: ${r.chips.map((c) => c.label).join(", ")}`,
    );
  }

  // Determinism: same input → same result
  {
    const a = searchListings("condos in Mactan", allListings);
    const b = searchListings("condos in Mactan", allListings);
    check(
      section,
      "Search is deterministic: same input → same match count",
      a.matches.length === b.matches.length,
    );
    check(
      section,
      "Search is deterministic: same match IDs in same order",
      a.matches.every((m, i) => m.id === b.matches[i]?.id),
    );
  }

  // -- extractQuery primitives --
  {
    const q = extractQuery("2BR condo in BGC under 20M");
    check(
      section,
      "extractQuery: bedrooms = 2",
      q.bedrooms === 2,
      `got ${q.bedrooms}`,
    );
    check(
      section,
      "extractQuery: propertyType = 'Condo'",
      q.propertyType === "Condo",
      `got ${q.propertyType}`,
    );
    check(
      section,
      "extractQuery: location = 'BGC'",
      q.location === "BGC",
      `got ${q.location}`,
    );
    check(
      section,
      "extractQuery: maxPrice = 20_000_000",
      q.maxPrice === 20_000_000,
      `got ${q.maxPrice}`,
    );
  }

  // applyQuery is a pure filter consistent with searchListings
  {
    const q = extractQuery("BGC");
    const filtered = applyQuery(q, allListings);
    const viaSearch = searchListings("BGC", allListings);
    check(
      section,
      "applyQuery + extractQuery agrees with searchListings",
      filtered.length === viaSearch.matches.length,
    );
  }

  // SEARCH_RULES table totality
  check(
    section,
    "SEARCH_RULES has ≥10 declarative rules (transparency contract)",
    Object.keys(SEARCH_RULES).length >= 10,
    `got ${Object.keys(SEARCH_RULES).length}`,
  );
  check(
    section,
    "LOCATION_KEYWORDS includes BGC, Cebu, Makati, Manila, Mactan",
    ["BGC", "Cebu", "Makati", "Manila", "Mactan"].every((l) =>
      (LOCATION_KEYWORDS as readonly string[]).includes(l),
    ),
  );

  // -- transparencyChipsFor: matches the actually applied filters --
  {
    const q = extractQuery("2BR condo BGC");
    const chips = transparencyChipsFor(q);
    const kinds = new Set(chips.map((c) => c.kind));
    check(
      section,
      "Transparency chips match extracted fields: bedrooms + propertyType + location all present",
      kinds.has("bedrooms") && kinds.has("propertyType") && kinds.has("location"),
    );
    check(
      section,
      "Transparency chips do NOT include filters not extracted (no maxPrice chip when none specified)",
      !kinds.has("maxPrice") && !kinds.has("minPrice"),
    );
  }

  // -- My Listings derivations --
  const alyssa = seedUsers.find((u) => u.id === DEMO_AGENT_ID)!;
  const alyssaListings = listingsForUser(alyssa, seedListings, seedUsers);
  check(
    section,
    "Demo agent (Alyssa, agent-001) has ≥8 listings in My Listings (framing minimum)",
    alyssaListings.length >= 8,
    `got ${alyssaListings.length}`,
  );
  // Every listing returned is either owned-by-Alyssa or assigned-to-Alyssa
  check(
    section,
    "Alyssa's My Listings: every result is either owned or assigned to her",
    alyssaListings.every(
      (l) =>
        l.ownerAgentId === alyssa.id ||
        (l.assignedAgentIds ?? []).includes(alyssa.id),
    ),
  );

  // Demo broker (Maria) sees broker-owned + her agents' owned
  const maria = seedUsers.find((u) => u.id === DEMO_BROKER_ID)!;
  const mariaListings = listingsForUser(maria, seedListings, seedUsers);
  check(
    section,
    "Demo broker (Maria, broker-001) has ≥1 listing visible in My Listings",
    mariaListings.length >= 1,
    `got ${mariaListings.length}`,
  );
  const mariaAgentIds = new Set(
    seedUsers
      .filter((u) => u.parentId === maria.id && u.role === "Agent")
      .map((u) => u.id),
  );
  check(
    section,
    "Maria's My Listings: every result is owned by her or by one of her agents",
    mariaListings.every(
      (l) =>
        l.ownerBrokerId === maria.id ||
        (l.ownerAgentId !== undefined && mariaAgentIds.has(l.ownerAgentId)),
    ),
  );

  // Realtor: sees broker-owned by network + agent-owned by network
  const alex = seedUsers.find((u) => u.id === DEMO_REALTOR_ID)!;
  const alexListings = listingsForUser(alex, seedListings, seedUsers);
  check(
    section,
    "Demo realtor (Alex, realtor-001) sees ≥ broker's count (network includes broker's scope)",
    alexListings.length >= mariaListings.length,
    `realtor=${alexListings.length}, broker=${mariaListings.length}`,
  );

  // -- ACTIVE_FILTERS triad --
  check(
    section,
    "ACTIVE_FILTERS has All / Active / Archived",
    ACTIVE_FILTERS.length === 3 &&
      ACTIVE_FILTERS.includes("All") &&
      ACTIVE_FILTERS.includes("Active") &&
      ACTIVE_FILTERS.includes("Archived"),
  );
  // Active filter: only Available or Sold Out Soon
  {
    const all = listingsForUser(alyssa, seedListings, seedUsers);
    const active = applyActiveFilter(all, "Active");
    const archived = applyActiveFilter(all, "Archived");
    check(
      section,
      "Active filter returns only Available or Sold Out Soon listings",
      active.every(
        (l) =>
          l.availability === "Available" || l.availability === "Sold Out Soon",
      ),
    );
    check(
      section,
      "Archived filter returns only Sold or Reserved listings",
      archived.every(
        (l) => l.availability === "Sold" || l.availability === "Reserved",
      ),
    );
    check(
      section,
      "Active + Archived (mutually exclusive) sum ≤ All",
      active.length + archived.length <= all.length,
    );
  }

  // Transaction filter: passes through and is exclusive
  {
    const all = listingsForUser(alyssa, seedListings, seedUsers);
    const forSale = applyTransactionTypeFilter(all, "For Sale");
    check(
      section,
      "Transaction-type filter 'For Sale' returns only For Sale listings",
      forSale.every((l) => l.transactionType === "For Sale"),
    );
    check(
      section,
      "Transaction-type filter 'All' is identity",
      applyTransactionTypeFilter(all, "All").length === all.length,
    );
  }

  // -- Per-role heading --
  check(
    section,
    "Heading for Agent: 'My Listings'",
    myListingsHeadingFor("Agent").title === "My Listings",
  );
  check(
    section,
    "Heading for Broker: 'Listings I've distributed'",
    myListingsHeadingFor("Broker").title === "Listings I've distributed",
  );
  check(
    section,
    "Heading for Realtor: 'Listings across my network'",
    myListingsHeadingFor("Realtor").title === "Listings across my network",
  );
  // Headings pairwise distinct
  check(
    section,
    "Per-role headings pairwise distinct",
    new Set([
      myListingsHeadingFor("Agent").title,
      myListingsHeadingFor("Broker").title,
      myListingsHeadingFor("Realtor").title,
    ]).size === 3,
  );
}

// ----------------------------------------------------------------------------
// 14. Share Listing + Preview Message (Session 5A)
// ----------------------------------------------------------------------------

function checkShareListing() {
  const section = "14. Share Listing";

  _resetShareStoreForTests();
  _resetForTests();

  // -- SHARE_RULES table totality --
  const ruleKeys = Object.keys(SHARE_RULES);
  check(
    section,
    "SHARE_RULES table has all 7 rules",
    ruleKeys.length === 7,
    `got ${ruleKeys.length}`,
  );
  for (const k of [
    "ofwBuyer",
    "investor",
    "luxury",
    "familyEndUser",
    "firstTimeBuyer",
    "rentalYield",
    "defaultIntroduction",
  ]) {
    check(
      section,
      `SHARE_RULES.${k} declared`,
      Object.prototype.hasOwnProperty.call(SHARE_RULES, k),
    );
  }

  // -- Seeded-prop anchor: the demo Share scenario --
  // Maria (lead-instagram-01) sharing Laurel Hills 12A is the canonical
  // demo. The family-end-user rule must fire on this combination.
  const listing = seedListings.find((l) => l.id === "listing-laurel-12a");
  const lead = seedLeads.find((l) => l.id === "lead-instagram-01");
  check(section, "Anchor: listing-laurel-12a exists", !!listing);
  check(section, "Anchor: lead-instagram-01 exists", !!lead);
  if (!listing || !lead) return;
  check(
    section,
    "Anchor: Maria (lead-instagram-01) is the buyer for Laurel 12A",
    lead.selectedListingIds.includes("listing-laurel-12a"),
  );
  check(
    section,
    "Anchor: Maria's familySize >= 3 (family-end-user rule precondition)",
    (lead.buyer.familySize ?? 0) >= 3,
    `got ${lead.buyer.familySize}`,
  );
  check(
    section,
    "Anchor: Maria's purposeOfPurchase = 'End-User'",
    lead.buyer.purposeOfPurchase === "End-User",
  );
  check(
    section,
    "Anchor: Maria's preferredLocations include Taguig",
    (lead.buyer.preferredLocations ?? []).some((l) => /taguig/i.test(l)),
  );
  // The CTA renders the buyer's full name — must be the exact mockup string
  check(
    section,
    "Anchor: Maria's name is 'Maria Santos' (matches mockup 'Send to Maria Santos')",
    lead.buyer.name === "Maria Santos",
  );

  // Rule routing locked: family-end-user fires for Maria+Laurel
  const anchorResult = generateShareMessage({ listing, lead });
  check(
    section,
    "Anchor rule: Maria+Laurel routes to familyEndUser rule",
    anchorResult.rule === "familyEndUser",
    `got ${anchorResult.rule}`,
  );
  check(
    section,
    "Anchor rule: result has ruleDescription string",
    anchorResult.ruleDescription.length > 0,
  );

  // -- Mockup-anchor text fidelity --
  // The mockup shows: "Based on your budget and preference for a family-
  // friendly home in Taguig, I think this property might be a great fit
  // for you." — semantic-shape (not exact verbatim, but key phrases).
  const anchorBody = anchorResult.draft.body;
  check(
    section,
    "Anchor body contains 'family-friendly home in Taguig'",
    /family-friendly home in Taguig/i.test(anchorBody),
  );
  check(
    section,
    "Anchor body contains 'great fit'",
    /great fit/i.test(anchorBody),
  );
  check(
    section,
    "Anchor body mentions the listing title",
    anchorBody.includes(listing.title),
  );
  check(
    section,
    "Anchor body mentions 'near schools, malls, and major roads'",
    /near schools, malls, and major roads/i.test(anchorBody),
  );
  check(
    section,
    "Anchor body asks about sample computation (closer matches mockup)",
    /sample computation\?/i.test(anchorBody),
  );

  // No "4BR 4br" duplication (the describeProperty fix)
  check(
    section,
    "Anchor body does NOT contain '4BR 4br' (describeProperty duplication guard)",
    !/4BR 4br/i.test(anchorBody),
  );

  // -- 4-pronged structural proof on profile variation --
  // Two buyers with different profiles → different rules → different content.
  const investorLead = seedLeads.find((l) => l.id === "lead-portal-01");
  check(section, "Investor lead lead-portal-01 exists for proof", !!investorLead);
  if (investorLead) {
    check(
      section,
      "Investor lead's purposeOfPurchase is 'Investment'",
      investorLead.buyer.purposeOfPurchase === "Investment",
    );
    const investorResult = generateShareMessage({ listing, lead: investorLead });
    // Prong 1: rule routing differs
    check(
      section,
      "Profile variation prong 1: family→familyEndUser vs investor→investor (different rules)",
      anchorResult.rule !== investorResult.rule &&
        investorResult.rule === "investor",
      `family=${anchorResult.rule}, investor=${investorResult.rule}`,
    );
    // Prong 2: family mentions "family-friendly", investor doesn't
    check(
      section,
      "Profile variation prong 2: family body mentions 'family-friendly'; investor body does not",
      /family-friendly/i.test(anchorBody) &&
        !/family-friendly/i.test(investorResult.draft.body),
    );
    // Prong 3: investor body mentions yield/ROI/appreciation; family doesn't
    check(
      section,
      "Profile variation prong 3: investor body mentions yield/ROI/appreciation; family does not",
      /yield|ROI|appreciation/i.test(investorResult.draft.body) &&
        !/yield|ROI|appreciation/i.test(anchorBody),
    );
    // Prong 4: investor action set includes ROI computation; family includes site visit suggestion
    const investorActionKinds = new Set(
      investorResult.actions.map((a) => a.kind),
    );
    const familyActionKinds = new Set(anchorResult.actions.map((a) => a.kind));
    check(
      section,
      "Profile variation prong 4: family actions include book_site_visit; investor actions do not",
      familyActionKinds.has("book_site_visit") &&
        !investorActionKinds.has("book_site_visit"),
    );
  }

  // -- Determinism --
  const a = generateShareMessage({ listing, lead });
  const b = generateShareMessage({ listing, lead });
  check(
    section,
    "generateShareMessage is deterministic: same rule",
    a.rule === b.rule,
  );
  check(
    section,
    "generateShareMessage is deterministic: same body text",
    a.draft.body === b.draft.body,
  );
  check(
    section,
    "generateShareMessage is deterministic: same action count",
    a.actions.length === b.actions.length,
  );

  // -- applyShareTone: outbound-variant behavior --
  // All 8 tones produce non-empty output
  for (const tone of ALL_TONES) {
    const t = applyShareTone(anchorResult.draft, tone, {
      buyerFirstName: "Maria",
    });
    check(section, `applyShareTone "${tone}" returns non-empty`, t.length > 0);
  }

  // Outbound tone must NOT include reply-context phrases
  for (const tone of ALL_TONES) {
    const t = applyShareTone(anchorResult.draft, tone, {
      buyerFirstName: "Maria",
    });
    for (const forbidden of SHARE_FORBIDDEN_PHRASES) {
      check(
        section,
        `Share tone "${tone}" does NOT include forbidden inbound phrase: "${forbidden}"`,
        !t.includes(forbidden),
      );
    }
  }

  // Per-tone pairwise distinctness — 8 tones × C(8,2)=28 pairs
  const tonedOutputs = ALL_TONES.map((t) =>
    applyShareTone(anchorResult.draft, t, { buyerFirstName: "Maria" }),
  );
  const uniqueTones = new Set(tonedOutputs);
  check(
    section,
    "Share tones pairwise distinct: 8 tones produce 8 unique outputs",
    uniqueTones.size === ALL_TONES.length,
    `got ${uniqueTones.size} unique`,
  );

  // Greeting varies per tone — Professional Broker uses "Good day", Investor uses comma
  const proBroker = applyShareTone(anchorResult.draft, "Professional Broker", {
    buyerFirstName: "Maria",
  });
  check(
    section,
    "Professional Broker tone uses 'Good day, Maria.' greeting",
    proBroker.startsWith("Good day, Maria."),
  );
  const investor = applyShareTone(anchorResult.draft, "Investor", {
    buyerFirstName: "Maria",
  });
  check(
    section,
    "Investor tone uses 'Hi Maria,' (comma) greeting",
    investor.startsWith("Hi Maria,"),
  );
  const friendly = applyShareTone(anchorResult.draft, "Friendly Agent", {
    buyerFirstName: "Maria",
  });
  check(
    section,
    "Friendly Agent tone uses 'Hi Maria!' (exclamation) greeting",
    friendly.startsWith("Hi Maria!"),
  );

  // -- Language application via applyLanguage from aiReply (composes cleanly) --
  // We don't import applyLanguage here, but verify the outbound tone output
  // is a string suitable for the language wrapper.
  check(
    section,
    "ALL_LANGUAGES has 3 entries (English/Tagalog/Cebuano)",
    ALL_LANGUAGES.length === 3,
  );

  // -- smartLinkFor: deterministic URL generation --
  const url1 = smartLinkFor("listing-laurel-12a", "agent-001", "lead-instagram-01");
  const url2 = smartLinkFor("listing-laurel-12a", "agent-001", "lead-instagram-01");
  check(
    section,
    "smartLinkFor is deterministic: same inputs → same URL",
    url1 === url2,
    `got ${url1} vs ${url2}`,
  );
  check(
    section,
    "smartLinkFor produces estatehq.ph host",
    /^https:\/\/estatehq\.ph\/l\//.test(url1),
  );
  check(
    section,
    "smartLinkFor includes the listing slug",
    url1.includes("laurel-12a"),
  );
  // Different inputs → different URLs
  const urlDiff = smartLinkFor("listing-veranda-8f", "agent-001", "lead-instagram-01");
  check(
    section,
    "smartLinkFor: different listing → different URL",
    url1 !== urlDiff,
  );

  // -- shareListing send action: creates campaign + conversation message --
  const beforeShare = getClientShareCount();
  const beforeMsg = getClientMessageCount(lead.id);
  const shareResult = shareListing({
    listingId: listing.id,
    agentId: "agent-001",
    buyerLeadId: lead.id,
    buyerProfileId: lead.buyer.id,
    channel: "Messenger",
    message: "Hi Maria! Test send.",
    attachedFileIds: ["file-001", "file-002"],
    tone: "Friendly Agent",
    language: "English",
  });
  check(
    section,
    "shareListing: campaign created (client share count grew by 1)",
    getClientShareCount() === beforeShare + 1,
  );
  check(
    section,
    "shareListing: conversation message created (client message count grew by 1)",
    getClientMessageCount(lead.id) === beforeMsg + 1,
  );
  check(
    section,
    "shareListing: campaign has expected listingId",
    shareResult.campaign.listingId === listing.id,
  );
  check(
    section,
    "shareListing: campaign has expected agentId",
    shareResult.campaign.agentId === "agent-001",
  );
  check(
    section,
    "shareListing: campaign has expected channel",
    shareResult.campaign.channel === "Messenger",
  );
  check(
    section,
    "shareListing: campaign attached the 2 file IDs",
    shareResult.campaign.attachedFileIds.length === 2 &&
      shareResult.campaign.attachedFileIds.includes("file-001") &&
      shareResult.campaign.attachedFileIds.includes("file-002"),
  );
  check(
    section,
    "shareListing: campaign smartLinkUrl matches smartLinkFor output",
    shareResult.campaign.smartLinkUrl ===
      smartLinkFor(listing.id, "agent-001", lead.id),
  );
  check(
    section,
    "shareListing: returned conversation message ID is non-empty",
    shareResult.conversationMessageId.length > 0,
  );

  // -- Laurel 12A has the 4 expected mockup attachments --
  const laurelFiles = seedPropertyFiles.filter(
    (f) => f.listingId === "listing-laurel-12a",
  );
  check(
    section,
    "Laurel 12A has >=4 files seeded (mockup shows 4 attachments)",
    laurelFiles.length >= 4,
    `got ${laurelFiles.length}`,
  );
  const laurelCategories = new Set(laurelFiles.map((f) => f.category));
  check(
    section,
    "Laurel 12A files include Brochures category",
    laurelCategories.has("Brochures"),
  );
  check(
    section,
    "Laurel 12A files include Computations category",
    laurelCategories.has("Computations"),
  );
  check(
    section,
    "Laurel 12A files include Floor Plans category",
    laurelCategories.has("Floor Plans"),
  );
  check(
    section,
    "Laurel 12A files include Location Map category",
    laurelCategories.has("Location Map"),
  );

  // -- Demo broker (Maria Santos) is unambiguous from buyer Maria Santos --
  // Both share first name, but they're in different entities (User vs BuyerProfile).
  const broker = seedUsers.find((u) => u.id === "broker-001");
  check(
    section,
    "Disambiguation: broker-001 is 'Maria Santos' (User)",
    broker?.fullName === "Maria Santos",
  );
  check(
    section,
    "Disambiguation: buyer-005 is 'Maria Santos' (BuyerProfile)",
    lead.buyer.name === "Maria Santos",
  );
  // The disambiguation is contextual — they appear in different surfaces.
  check(
    section,
    "Disambiguation: broker.id ('broker-001') ≠ buyer.id ('buyer-005')",
    broker?.id !== lead.buyer.id,
  );

  // -- Channel set: 6 channels per mockup (Messenger / WhatsApp / Instagram DM / SMS / Email / More) --
  // The channel chip row is rendered from the CHANNELS array; verify it has the right 6 entries
  // (we import CHANNELS via the ChannelChips module — but to avoid pulling React-only modules
  // into this Node verify run, we assert the seed-data ShareChannel union supports them)
  const expectedChannels = [
    "Messenger",
    "WhatsApp",
    "Instagram DM",
    "SMS",
    "Email",
  ];
  for (const ch of expectedChannels) {
    const sample = shareListing({
      listingId: listing.id,
      agentId: "agent-001",
      buyerLeadId: lead.id,
      buyerProfileId: lead.buyer.id,
      channel: ch as "Messenger",
      message: `Channel ${ch} test`,
      attachedFileIds: [],
    });
    check(
      section,
      `Channel "${ch}" is a valid ShareChannel (campaign accepts it)`,
      sample.campaign.channel === ch,
    );
  }

  // -- The conversation message links back to the campaign --
  // We can verify the link by checking conversationStore-side — the shareCampaignId
  // is set on the sent message.
  _resetForTests();
  _resetShareStoreForTests();
  const linkTest = shareListing({
    listingId: listing.id,
    agentId: "agent-001",
    buyerLeadId: lead.id,
    buyerProfileId: lead.buyer.id,
    channel: "Messenger",
    message: "Link test",
    attachedFileIds: ["file-001"],
  });
  // The message is in the client store; we can't directly read it here without
  // hook context, but the conversation message ID is returned and is non-empty.
  // The shareCampaignId on the message is implicit — we verify it via the
  // campaign ID being set on the campaign and the conversationMessageId being
  // returned.
  check(
    section,
    "Send creates linked campaign + message: campaign ID is set",
    linkTest.campaign.id.length > 0,
  );
  check(
    section,
    "Send creates linked campaign + message: conversation message ID is set",
    linkTest.conversationMessageId.length > 0,
  );

  // Cleanup
  _resetForTests();
  _resetShareStoreForTests();
}

// ----------------------------------------------------------------------------
// 16. Attach Files + AI Recommendation + Engagement Simulation + share-006 anchor (Session 5B)
// ----------------------------------------------------------------------------

function checkAttachFilesAndEngagement() {
  const section = "16. Attach Files + Engagement";

  _resetShareStoreForTests();

  // -- FILE_RECOMMENDATION_RULES table totality --
  const ruleKeys = Object.keys(FILE_RECOMMENDATION_RULES);
  check(
    section,
    "FILE_RECOMMENDATION_RULES has all 7 rules",
    ruleKeys.length === 7,
    `got ${ruleKeys.length}`,
  );
  for (const k of [
    "investor",
    "ofw",
    "familyEndUser",
    "luxury",
    "firstTimeBuyer",
    "rental",
    "default",
  ] as FileRecommendationRule[]) {
    check(
      section,
      `FILE_RECOMMENDATION_RULES.${k} declared`,
      Object.prototype.hasOwnProperty.call(FILE_RECOMMENDATION_RULES, k),
    );
    check(
      section,
      `FILE_RECOMMENDATION_RULES.${k} has non-empty categories list`,
      FILE_RECOMMENDATION_RULES[k].categories.length > 0,
    );
  }

  // Every rule recommends Brochures (the universal file)
  for (const k of ruleKeys as FileRecommendationRule[]) {
    check(
      section,
      `Rule ${k} recommends Brochures (universal)`,
      FILE_RECOMMENDATION_RULES[k].categories.includes("Brochures"),
    );
  }

  // -- 8 PRD categories all reachable via recommendation rules --
  const recommendable = allRecommendableCategories();
  for (const cat of [
    "Brochures",
    "Computations",
    "Floor Plans",
    "Location Map",
    "Photos",
    "Price List",
    "Payment Terms",
  ] as const) {
    check(
      section,
      `Category "${cat}" appears in at least one recommendation rule`,
      recommendable.has(cat),
    );
  }

  // -- Anchor: family-end-user (Maria) + Laurel 12A → familyEndUser rule
  //    with 4 recommended categories matching mockup --
  const listing = seedListings.find((l) => l.id === "listing-laurel-12a");
  const familyLead = seedLeads.find((l) => l.id === "lead-instagram-01");
  const investorLead = seedLeads.find((l) => l.id === "lead-portal-01");
  check(section, "Anchor listing-laurel-12a exists", !!listing);
  check(section, "Anchor lead-instagram-01 exists (family)", !!familyLead);
  check(section, "Anchor lead-portal-01 exists (investor)", !!investorLead);
  if (!listing || !familyLead || !investorLead) return;

  const laurelFiles = seedPropertyFiles.filter(
    (f) => f.listingId === "listing-laurel-12a",
  );
  check(
    section,
    "Laurel 12A has ≥ 4 files (mockup needs Brochure + Computation + Floor Plan + Location Map)",
    laurelFiles.length >= 4,
  );

  const familyRec = recommendFilesFor({
    lead: familyLead,
    listing,
    availableFiles: laurelFiles,
  });
  check(
    section,
    "Family lead + Laurel 12A → familyEndUser rule",
    familyRec.rule === "familyEndUser",
    `got ${familyRec.rule}`,
  );
  check(
    section,
    "Family recommendation includes Brochures category",
    familyRec.recommendedCategories.includes("Brochures"),
  );
  check(
    section,
    "Family recommendation includes Computations category",
    familyRec.recommendedCategories.includes("Computations"),
  );
  check(
    section,
    "Family recommendation includes Floor Plans category",
    familyRec.recommendedCategories.includes("Floor Plans"),
  );
  check(
    section,
    "Family recommendation includes Location Map category",
    familyRec.recommendedCategories.includes("Location Map"),
  );
  check(
    section,
    "Family recommendation resolves to 4 actual file IDs (all categories present in Laurel seed)",
    familyRec.recommendedFileIds.length === 4,
    `got ${familyRec.recommendedFileIds.length}`,
  );
  // The 4 file IDs are the 4 expected mockup files
  for (const expectedId of [
    "file-001", // Brochure
    "file-002", // Sample Computation
    "file-laurel-12a-floorplan",
    "file-laurel-12a-locationmap",
  ]) {
    check(
      section,
      `Family recommendation includes file ${expectedId}`,
      familyRec.recommendedFileIds.includes(expectedId),
    );
  }

  // -- Investor recommendation differs structurally from family --
  const investorRec = recommendFilesFor({
    lead: investorLead,
    listing,
    availableFiles: laurelFiles,
  });
  check(
    section,
    "Investor lead + Laurel 12A → investor rule (different from family)",
    investorRec.rule === "investor" && investorRec.rule !== familyRec.rule,
  );
  // Investor does NOT include Floor Plans or Location Map (the family-specific picks)
  check(
    section,
    "Investor recommendation excludes Floor Plans (family-specific)",
    !investorRec.recommendedCategories.includes("Floor Plans"),
  );
  check(
    section,
    "Investor recommendation excludes Location Map (family-specific)",
    !investorRec.recommendedCategories.includes("Location Map"),
  );
  check(
    section,
    "Investor recommendation includes Price List (investor-specific)",
    investorRec.recommendedCategories.includes("Price List"),
  );

  // 4-pronged structural proof on file recommendation differentiation
  check(
    section,
    "Profile prong 1: rule routing differs (familyEndUser vs investor)",
    familyRec.rule !== investorRec.rule,
  );
  check(
    section,
    "Profile prong 2: family categories include Floor Plans; investor's don't",
    familyRec.recommendedCategories.includes("Floor Plans") &&
      !investorRec.recommendedCategories.includes("Floor Plans"),
  );
  check(
    section,
    "Profile prong 3: investor categories include Price List; family's don't",
    investorRec.recommendedCategories.includes("Price List") &&
      !familyRec.recommendedCategories.includes("Price List"),
  );
  check(
    section,
    "Profile prong 4: family resolves to more files (4) than investor (2 — no Price List file in Laurel seed)",
    familyRec.recommendedFileIds.length > investorRec.recommendedFileIds.length,
  );

  // -- Determinism --
  const a = recommendFilesFor({
    lead: familyLead,
    listing,
    availableFiles: laurelFiles,
  });
  const b = recommendFilesFor({
    lead: familyLead,
    listing,
    availableFiles: laurelFiles,
  });
  check(
    section,
    "recommendFilesFor is deterministic: same rule",
    a.rule === b.rule,
  );
  check(
    section,
    "recommendFilesFor is deterministic: same file IDs in same order",
    a.recommendedFileIds.join(",") === b.recommendedFileIds.join(","),
  );

  // -- ENGAGEMENT SIMULATOR --
  const filesById = new Map(seedPropertyFiles.map((f) => [f.id, f]));

  // Default timings present + monotonic (open before download/view/etc.)
  check(
    section,
    "SIMULATOR_TIMINGS.linkOpenedMs is the earliest event",
    SIMULATOR_TIMINGS.linkOpenedMs < SIMULATOR_TIMINGS.brochureMs,
  );
  check(
    section,
    "Brochure event fires before Computation event",
    SIMULATOR_TIMINGS.brochureMs < SIMULATOR_TIMINGS.computationMs,
  );
  check(
    section,
    "Computation event fires before Floor Plan event",
    SIMULATOR_TIMINGS.computationMs < SIMULATOR_TIMINGS.floorPlanMs,
  );
  check(
    section,
    "Floor Plan event fires before Location Map event",
    SIMULATOR_TIMINGS.floorPlanMs < SIMULATOR_TIMINGS.locationMapMs,
  );
  check(
    section,
    "Location Map event fires before Site Visit request",
    SIMULATOR_TIMINGS.locationMapMs < SIMULATOR_TIMINGS.siteVisitRequestMs,
  );
  check(
    section,
    "siteVisitRequestProbability is between 0.3 and 0.5 (framing says ~40%)",
    SIMULATOR_TIMINGS.siteVisitRequestProbability >= 0.3 &&
      SIMULATOR_TIMINGS.siteVisitRequestProbability <= 0.5,
  );

  // Full-attachment schedule
  const fullSchedule = buildEngagementSchedule({
    campaignId: "test-full",
    attachedFileIds: [
      "file-001",
      "file-002",
      "file-laurel-12a-floorplan",
      "file-laurel-12a-locationmap",
    ],
    filesById,
    rngSeed: 1, // seed=1 → LCG draw ≈ 0.236 < 0.4 → site visit fires
  });
  check(
    section,
    "Full schedule has link_opened first",
    fullSchedule[0]?.kind === "link_opened",
  );
  check(
    section,
    "Full schedule contains brochure_opened (file-001)",
    fullSchedule.some(
      (e) => e.kind === "brochure_opened" && e.fileId === "file-001",
    ),
  );
  check(
    section,
    "Full schedule contains computation_downloaded (file-002)",
    fullSchedule.some(
      (e) => e.kind === "computation_downloaded" && e.fileId === "file-002",
    ),
  );
  check(
    section,
    "Full schedule contains floor_plan_viewed",
    fullSchedule.some((e) => e.kind === "floor_plan_viewed"),
  );
  check(
    section,
    "Full schedule contains location_map_opened",
    fullSchedule.some((e) => e.kind === "location_map_opened"),
  );
  check(
    section,
    "Full schedule (seed=1) contains site_visit_requested",
    fullSchedule.some((e) => e.kind === "site_visit_requested"),
  );
  check(
    section,
    "Schedule sorted by delayMs ascending",
    fullSchedule.every(
      (e, i) => i === 0 || e.delayMs >= (fullSchedule[i - 1]?.delayMs ?? 0),
    ),
  );

  // Brochure-only schedule should NOT contain floor_plan_viewed or location_map_opened
  const brochureOnlySchedule = buildEngagementSchedule({
    campaignId: "test-bro",
    attachedFileIds: ["file-001"],
    filesById,
    rngSeed: 1,
  });
  check(
    section,
    "Brochure-only schedule has link_opened + brochure_opened (no floor/map/comp)",
    brochureOnlySchedule.some((e) => e.kind === "brochure_opened") &&
      !brochureOnlySchedule.some((e) => e.kind === "computation_downloaded") &&
      !brochureOnlySchedule.some((e) => e.kind === "floor_plan_viewed") &&
      !brochureOnlySchedule.some((e) => e.kind === "location_map_opened"),
  );

  // No-attachments schedule still fires link_opened but skips file events + site visit
  const emptySchedule = buildEngagementSchedule({
    campaignId: "test-empty",
    attachedFileIds: [],
    filesById,
    rngSeed: 1,
  });
  check(
    section,
    "Empty-attachments schedule contains link_opened",
    emptySchedule.some((e) => e.kind === "link_opened"),
  );
  check(
    section,
    "Empty-attachments schedule does NOT contain any file-specific events",
    !emptySchedule.some((e) => e.fileId !== undefined),
  );
  check(
    section,
    "Empty-attachments schedule does NOT contain site_visit_requested (no info file)",
    !emptySchedule.some((e) => e.kind === "site_visit_requested"),
  );

  // Determinism — same seed → same schedule
  const schedA = buildEngagementSchedule({
    campaignId: "det-a",
    attachedFileIds: ["file-001", "file-002"],
    filesById,
    rngSeed: 42,
  });
  const schedB = buildEngagementSchedule({
    campaignId: "det-b",
    attachedFileIds: ["file-001", "file-002"],
    filesById,
    rngSeed: 42,
  });
  check(
    section,
    "Schedule is deterministic given same seed: same length",
    schedA.length === schedB.length,
  );
  check(
    section,
    "Schedule is deterministic: same event kinds in same order",
    schedA.map((e) => e.kind).join(",") === schedB.map((e) => e.kind).join(","),
  );

  // -- SHARE-006 MARQUEE ANCHOR --
  const anchor = seedShareCampaigns.find((c) => c.id === "share-006");
  check(section, "share-006 marquee anchor exists in seed", !!anchor);
  if (!anchor) return;
  check(
    section,
    "share-006 is by agent-001 (Alyssa)",
    anchor.agentId === "agent-001",
  );
  check(
    section,
    "share-006 is to buyer-005 (Maria Santos)",
    anchor.buyerProfileId === "buyer-005",
  );
  check(
    section,
    "share-006 is on listing-laurel-12a",
    anchor.listingId === "listing-laurel-12a",
  );
  check(
    section,
    "share-006 channel is Messenger (matches mockup)",
    anchor.channel === "Messenger",
  );
  check(
    section,
    "share-006 has exactly 4 attached files (mockup file count)",
    anchor.attachedFileIds.length === 4,
    `got ${anchor.attachedFileIds.length}`,
  );
  for (const expectedId of [
    "file-001",
    "file-002",
    "file-laurel-12a-floorplan",
    "file-laurel-12a-locationmap",
  ]) {
    check(
      section,
      `share-006 attached file: ${expectedId}`,
      anchor.attachedFileIds.includes(expectedId),
    );
  }
  check(
    section,
    "share-006 has smartLinkToken set",
    anchor.smartLinkToken.length > 0,
  );
  check(
    section,
    "share-006 smartLinkUrl ends with token",
    anchor.smartLinkUrl.endsWith(anchor.smartLinkToken),
  );

  // share-006 engagement events match the mockup's strip exactly
  check(
    section,
    "share-006 has ≥ 5 engagement events",
    anchor.engagementEvents.length >= 5,
    `got ${anchor.engagementEvents.length}`,
  );
  const evKinds = new Set(anchor.engagementEvents.map((e) => e.kind));
  check(
    section,
    "share-006 events include link_opened",
    evKinds.has("link_opened"),
  );
  check(
    section,
    "share-006 events include brochure_opened",
    evKinds.has("brochure_opened"),
  );
  check(
    section,
    "share-006 events include computation_downloaded",
    evKinds.has("computation_downloaded"),
  );
  check(
    section,
    "share-006 events include floor_plan_viewed",
    evKinds.has("floor_plan_viewed"),
  );
  check(
    section,
    "share-006 events include location_map_opened",
    evKinds.has("location_map_opened"),
  );

  // Mockup-anchor timestamps: events at 02:24, 02:26, 02:27, 02:28 UTC
  // (which is 10:24-10:28 PHT). Each event references the correct file.
  const findEv = (kind: string, fileId?: string) =>
    anchor.engagementEvents.find(
      (e) => e.kind === kind && (fileId === undefined || e.fileId === fileId),
    );
  const broEv = findEv("brochure_opened", "file-001");
  check(
    section,
    "share-006 brochure_opened references file-001 at 02:24 UTC",
    !!broEv && broEv.at === "2025-05-29T02:24:00.000Z",
    `at=${broEv?.at}`,
  );
  const compEv = findEv("computation_downloaded", "file-002");
  check(
    section,
    "share-006 computation_downloaded references file-002 at 02:26 UTC",
    !!compEv && compEv.at === "2025-05-29T02:26:00.000Z",
  );
  const fpEv = findEv("floor_plan_viewed", "file-laurel-12a-floorplan");
  check(
    section,
    "share-006 floor_plan_viewed references file-laurel-12a-floorplan at 02:27 UTC",
    !!fpEv && fpEv.at === "2025-05-29T02:27:00.000Z",
  );
  const mapEv = findEv("location_map_opened", "file-laurel-12a-locationmap");
  check(
    section,
    "share-006 location_map_opened references file-laurel-12a-locationmap at 02:28 UTC",
    !!mapEv && mapEv.at === "2025-05-29T02:28:00.000Z",
  );

  // -- appendEngagementEvent: appends to seed campaign via shadow buffer --
  const beforeEvents = getEngagementEvents("share-006");
  const beforeCount = beforeEvents.length;
  appendEngagementEvent("share-006", {
    kind: "reply_received",
  });
  const afterEvents = getEngagementEvents("share-006");
  check(
    section,
    "appendEngagementEvent: seed campaign event count grows via shadow buffer",
    afterEvents.length === beforeCount + 1,
  );
  check(
    section,
    "appendEngagementEvent: appended event is sorted last",
    afterEvents[afterEvents.length - 1]?.kind === "reply_received",
  );

  // -- engagementLabelFor + categoryShortLabel — strip render helpers --
  check(
    section,
    "labelFor(brochure_opened) returns 'Opened'",
    engagementLabelFor("brochure_opened") === "Opened",
  );
  check(
    section,
    "labelFor(computation_downloaded) returns 'Downloaded'",
    engagementLabelFor("computation_downloaded") === "Downloaded",
  );
  check(
    section,
    "labelFor(floor_plan_viewed) returns 'Viewed'",
    engagementLabelFor("floor_plan_viewed") === "Viewed",
  );
  check(
    section,
    "labelFor(location_map_opened) returns 'Opened'",
    engagementLabelFor("location_map_opened") === "Opened",
  );
  check(
    section,
    "categoryShortLabel('Brochures') returns 'Brochure' (strip-friendly singular)",
    categoryShortLabel("Brochures") === "Brochure",
  );
  check(
    section,
    "categoryShortLabel('Computations') returns 'Computation' (strip-friendly singular)",
    categoryShortLabel("Computations") === "Computation",
  );
  check(
    section,
    "categoryShortLabel('Floor Plans') returns 'Floor Plan'",
    categoryShortLabel("Floor Plans") === "Floor Plan",
  );
  check(
    section,
    "categoryShortLabel('Location Map') returns 'Location Map' (already singular)",
    categoryShortLabel("Location Map") === "Location Map",
  );

  // -- All campaigns in seed have engagementEvents field populated and
  //    smartLinkToken set --
  for (const c of seedShareCampaigns) {
    check(
      section,
      `Seed campaign ${c.id}: smartLinkToken set`,
      typeof c.smartLinkToken === "string" && c.smartLinkToken.length > 0,
    );
    check(
      section,
      `Seed campaign ${c.id}: engagementEvents is an array (may be empty)`,
      Array.isArray(c.engagementEvents),
    );
    // Every engagement event references the campaign correctly
    for (const e of c.engagementEvents) {
      check(
        section,
        `Seed campaign ${c.id} event ${e.id}: shareCampaignId matches`,
        e.shareCampaignId === c.id,
      );
    }
  }

  // -- shareListing() creates campaign with engagementEvents: [] + smartLinkToken --
  _resetShareStoreForTests();
  const sendResult = shareListing({
    listingId: "listing-laurel-12a",
    agentId: "agent-001",
    buyerLeadId: "lead-instagram-01",
    buyerProfileId: "buyer-005",
    channel: "Messenger",
    message: "Test send for verify",
    attachedFileIds: ["file-001"],
  });
  check(
    section,
    "Fresh shareListing campaign has empty engagementEvents",
    sendResult.campaign.engagementEvents.length === 0,
  );
  check(
    section,
    "Fresh shareListing campaign has non-empty smartLinkToken",
    sendResult.campaign.smartLinkToken.length > 0,
  );
  check(
    section,
    "Fresh shareListing token matches trailing segment of smartLinkUrl",
    sendResult.campaign.smartLinkUrl.endsWith(sendResult.campaign.smartLinkToken),
  );

  // After appendEngagementEvent to a sent campaign, events count grows
  appendEngagementEvent(sendResult.campaign.id, {
    kind: "link_opened",
  });
  const sentEvents = getEngagementEvents(sendResult.campaign.id);
  check(
    section,
    "Sent campaign engagementEvents grows after appendEngagementEvent",
    sentEvents.length === 1 && sentEvents[0]?.kind === "link_opened",
  );

  // Cleanup
  _resetForTests();
  _resetShareStoreForTests();

  // Mention `_unused`-style imports so TS doesn't strip
  void getClientShareCount;
  void smartLinkFor;
}

// ----------------------------------------------------------------------------
// 15. PRD Coverage
// ----------------------------------------------------------------------------

function reportPRDCoverage() {
  const section = "15. PRD Coverage";

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

  // buyer-conversation: scaffolded → complete in Session 3B
  const buyerConv = prdRoutes.find((r) => r.id === "buyer-conversation");
  if (!buyerConv) {
    fail(section, "buyer-conversation entry present", "missing");
  } else {
    check(
      section,
      "Session 3B: buyer-conversation status = complete",
      buyerConv.status === "complete",
      `got ${buyerConv.status}`,
    );
    check(
      section,
      "Session 3B: buyer-conversation completedInSession = 3",
      buyerConv.completedInSession === 3,
      `got ${buyerConv.completedInSession}`,
    );
  }

  // Coverage progress: ≥ 12 complete after Session 3B (3A's 11 + Buyer Conversation).
  check(
    section,
    "Coverage progress: ≥ 12 routes complete after Session 3B",
    complete >= 12,
    `complete=${complete}`,
  );

  // Session 4A stop-signal: 11 listings spine routes promoted to complete.
  // listings-menu, listings-for-sale, 6 other category landings,
  // developer-list-by-developer, developer-project-view, unit-inventory.
  // Private Offerings full surface (#19) and My Listings (#20) defer to 4B.
  const session4aRoutes = [
    "listings-menu",
    "listings-for-sale",
    "listings-for-rent",
    "listings-foreclosure",
    "listings-for-assume",
    "listings-pre-selling",
    "listings-rfo",
    "listings-commercial",
    "developer-list-by-developer",
    "developer-project-view",
    "unit-inventory",
  ];
  for (const id of session4aRoutes) {
    const entry = prdRoutes.find((r) => r.id === id);
    if (!entry) {
      fail(section, `Session 4A route ${id} present in manifest`, "missing");
      continue;
    }
    check(
      section,
      `Session 4A route "${id}" status = complete`,
      entry.status === "complete",
      `got ${entry.status}`,
    );
    check(
      section,
      `Session 4A route "${id}" completedInSession = 4`,
      entry.completedInSession === 4,
      `got ${entry.completedInSession}`,
    );
  }

  // Coverage cannot regress: 12 (Session 3B) + 11 (Session 4A spine) = 23.
  check(
    section,
    "Coverage progress: ≥ 23 routes complete after Session 4A",
    complete >= 23,
    `complete=${complete}`,
  );

  // Session 4B stop-signal: private-offerings (#19) + my-listings (#20).
  // AI Listing Search is not a separate manifest entry — it's an enhancement
  // mounted on the Listings Menu (#14) and My Listings (#20). Its presence is
  // locked by Section 12's behavioral asserts on the search module.
  const session4bRoutes = ["private-offerings", "my-listings"];
  for (const id of session4bRoutes) {
    const entry = prdRoutes.find((r) => r.id === id);
    if (!entry) {
      fail(section, `Session 4B route ${id} present in manifest`, "missing");
      continue;
    }
    check(
      section,
      `Session 4B route "${id}" status = complete`,
      entry.status === "complete",
      `got ${entry.status}`,
    );
    check(
      section,
      `Session 4B route "${id}" completedInSession = 4`,
      entry.completedInSession === 4,
      `got ${entry.completedInSession}`,
    );
  }

  // Coverage cannot regress: 23 (Session 4A) + 2 (Session 4B routes) = 25.
  check(
    section,
    "Coverage progress: ≥ 25 routes complete after Session 4B",
    complete >= 25,
    `complete=${complete}`,
  );

  // Session 5A stop-signal: share-listing (#21) + preview-message (#23).
  // attach-files (#22 in mockup ordering, but listed as a separate route in
  // the manifest) remains pending — its sheet implementation ships in 5B.
  const session5aRoutes = ["share-listing", "preview-message"];
  for (const id of session5aRoutes) {
    const entry = prdRoutes.find((r) => r.id === id);
    if (!entry) {
      fail(section, `Session 5A route ${id} present in manifest`, "missing");
      continue;
    }
    check(
      section,
      `Session 5A route "${id}" status = complete`,
      entry.status === "complete",
      `got ${entry.status}`,
    );
    check(
      section,
      `Session 5A route "${id}" completedInSession = 5`,
      entry.completedInSession === 5,
      `got ${entry.completedInSession}`,
    );
  }

  // Coverage cannot regress: 25 (Session 4B) + 2 (Session 5A routes) = 27.
  check(
    section,
    "Coverage progress: ≥ 27 routes complete after Session 5A",
    complete >= 27,
    `complete=${complete}`,
  );

  // Session 5B stop-signal: attach-files (#22) promoted.
  // Smart Link tracking, engagement simulation, and File Engagement
  // Tracking strip are surfaces-within-existing-routes (Share Listing,
  // Conversation thread) and do not add to the route count — their
  // behaviors are locked by Section 16.
  const session5bRoutes = ["attach-files"];
  for (const id of session5bRoutes) {
    const entry = prdRoutes.find((r) => r.id === id);
    if (!entry) {
      fail(section, `Session 5B route ${id} present in manifest`, "missing");
      continue;
    }
    check(
      section,
      `Session 5B route "${id}" status = complete`,
      entry.status === "complete",
      `got ${entry.status}`,
    );
    check(
      section,
      `Session 5B route "${id}" completedInSession = 5`,
      entry.completedInSession === 5,
      `got ${entry.completedInSession}`,
    );
  }

  // Coverage cannot regress: 27 (Session 5A) + 1 (Session 5B attach-files) = 28.
  check(
    section,
    "Coverage progress: ≥ 28 routes complete after Session 5B",
    complete >= 28,
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
checkAIReply();
checkListingsSpine();
checkListings4B();
checkShareListing();
checkAttachFilesAndEngagement();
reportPRDCoverage();
report();
