/**
 * Agent Dashboard Derivations
 *
 * Pure functions that compute every number shown on the Agent Dashboard
 * directly from the seed data. UI components call these and render the
 * result — no parallel logic in the JSX.
 *
 * Verify locks the outputs so future sessions can't silently break the
 * dashboard's demo math.
 */

import type {
  Commission,
  Deal,
  Lead,
  Listing,
  SiteVisit,
} from "@/lib/types";
import {
  buildListingPriceMap,
  scoreLeadWithContext,
} from "./leadInboxDerivations";
import {
  computeKPIs,
  type CommissionKPIs,
} from "./commissionAggregation";
import type { ViewerContext } from "./roleAwareAmount";

// ---------------------------------------------------------------------------
// KPI tiles
// ---------------------------------------------------------------------------

export interface AgentDashboardKPIs {
  /** New leads CREATED today, assigned to this agent. */
  newLeadsToday: number;
  /** Hot buyers — engine score ≥ 70. */
  hotBuyers: number;
  /** Site visits booked in the future for this agent. */
  siteVisitsBooked: number;
  /** Active deals — anything not yet released and not abandoned. */
  activeDeals: number;
}

/** Returns true if `iso` falls on the same calendar day (UTC) as `referenceIso`. */
function isSameDay(iso: string, referenceIso: string): boolean {
  return iso.slice(0, 10) === referenceIso.slice(0, 10);
}

const ACTIVE_DEAL_STAGES = new Set<Deal["stage"]>([
  "Lead Generated",
  "Buyer Qualified",
  "Site Visit Done",
  "Reservation Paid",
  "Documents Submitted",
  "Financing Approved",
  "Contract Signed",
  "Commission Processing",
]);

export function computeAgentDashboardKPIs(
  agentId: string,
  leads: Lead[],
  siteVisits: SiteVisit[],
  deals: Deal[],
  /** ISO timestamp used as "today" — pass the seed reference date for stable demo math. */
  referenceIso: string,
  /** All listings — used so scoring can include budget-match signals. */
  listings: Listing[] = [],
): AgentDashboardKPIs {
  const myLeads = leads.filter((l) => l.assignedAgentId === agentId);
  const priceById = buildListingPriceMap(listings);

  const newLeadsToday = myLeads.filter((l) =>
    isSameDay(l.createdAt, referenceIso),
  ).length;

  const hotBuyers = myLeads.filter((l) => {
    const score = scoreLeadWithContext(l, priceById).total;
    return score >= 70;
  }).length;

  const today = referenceIso.slice(0, 10);
  const siteVisitsBooked = siteVisits.filter(
    (sv) =>
      sv.agentId === agentId &&
      sv.scheduledAt.slice(0, 10) >= today &&
      (sv.status === "Confirmed" ||
        sv.status === "Reminder Sent" ||
        sv.status === "Proposed"),
  ).length;

  const activeDeals = deals.filter(
    (d) => d.agentId === agentId && ACTIVE_DEAL_STAGES.has(d.stage),
  ).length;

  return { newLeadsToday, hotBuyers, siteVisitsBooked, activeDeals };
}

// ---------------------------------------------------------------------------
// Money on the Way
// ---------------------------------------------------------------------------

export interface MoneyOnTheWay {
  /** Money already paid this period (informational, shown as muted figure). */
  paidThisPeriod: number;
  /** In-flight commissions across For Approval / For Closing / For Payout. */
  pendingPayout: number;
  /** Currently on hold — visible but not counted toward progress. */
  onHold: number;
  /** Target for the period (configurable; see DEFAULT_MONTHLY_TARGET_PHP). */
  monthlyTargetPHP: number;
  /** Progress percent, 0..100, computed as (paid + pending) / target. */
  progressPercent: number;
  /** Breakdown segments for the donut chart. */
  segments: Array<{ label: string; value: number; color: string }>;
}

/**
 * The agent's monthly target. We anchor this to the demo agent's seeded
 * level: their May activity suggests an ambitious-but-attainable ₱600,000
 * target (same anchor used in the Commission Tracking mockup).
 */
export const DEFAULT_MONTHLY_TARGET_PHP = 600_000;

// Brand-aligned color tokens for the donut segments
const COLOR_SAGE = "#5B7A5A";
const COLOR_GOLD = "#C9A961";
const COLOR_NAVY = "#1F2A44";
const COLOR_MUTED = "#E8E3D8";

export function computeMoneyOnTheWay(
  commissions: Commission[],
  viewer: ViewerContext,
  monthlyTargetPHP = DEFAULT_MONTHLY_TARGET_PHP,
): MoneyOnTheWay {
  const kpis: CommissionKPIs = computeKPIs(commissions, viewer);
  const paidThisPeriod = kpis.paidToDate;
  const pendingPayout = kpis.pendingPayout;
  const onHold = kpis.onHold;

  const total = paidThisPeriod + pendingPayout;
  const progressPercent =
    monthlyTargetPHP > 0
      ? Math.min(100, Math.round((total / monthlyTargetPHP) * 100))
      : 0;

  // Remaining-to-target rendered as a muted "ghost" segment so the donut
  // visually reads as a progress ring.
  const remaining = Math.max(0, monthlyTargetPHP - total);

  const segments = [
    { label: "Paid", value: paidThisPeriod, color: COLOR_SAGE },
    { label: "Pending payout", value: pendingPayout, color: COLOR_GOLD },
    { label: "On hold", value: onHold, color: COLOR_NAVY },
    { label: "To target", value: remaining, color: COLOR_MUTED },
  ];

  return {
    paidThisPeriod,
    pendingPayout,
    onHold,
    monthlyTargetPHP,
    progressPercent,
    segments,
  };
}

// ---------------------------------------------------------------------------
// Active deals list for dashboard compact-card panel
// ---------------------------------------------------------------------------

export interface ActiveDealCardData {
  dealId: string;
  buyerName: string;
  listingTitle: string;
  stage: Deal["stage"];
  contractPrice: number;
  hasBlockingDocuments: boolean;
}

export function selectActiveDeals(
  agentId: string,
  deals: Deal[],
  limit?: number,
): ActiveDealCardData[] {
  const filtered = deals
    .filter((d) => d.agentId === agentId && ACTIVE_DEAL_STAGES.has(d.stage))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sliced = limit ? filtered.slice(0, limit) : filtered;
  return sliced.map((d) => ({
    dealId: d.id,
    buyerName: d.buyerName,
    listingTitle: d.listingTitle,
    stage: d.stage,
    contractPrice: d.contractPrice,
    hasBlockingDocuments:
      !!d.missingDocuments && d.missingDocuments.length > 0,
  }));
}

// ---------------------------------------------------------------------------
// Recent activity feed
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  occurredAt: string;
  kind: "ai" | "lead" | "share" | "deal" | "site-visit";
  summary: string;
}

/**
 * Reference: the dashboard activity feed is a chronological mix of AI activity,
 * new leads, deal stage moves, and site visits, scoped to the demo agent.
 * Callers pass pre-collected entries in; this function only sorts and
 * trims them. Keeps the seed dependency at the call site.
 */
export function sortAndLimitActivity(
  entries: ActivityEntry[],
  limit = 6,
): ActivityEntry[] {
  return [...entries]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// AI suggestions (rule-driven, not free-form generation)
// ---------------------------------------------------------------------------

export interface AISuggestion {
  id: string;
  title: string;
  body: string;
  /** What the agent should tap to act on the suggestion. */
  ctaLabel: string;
  /** Route target — may be null if the action is a UI affordance only. */
  ctaHref: string | null;
  priority: "Urgent" | "Important" | "Normal";
}

/**
 * Generate AI suggestions deterministically from seed state. NOT a free-form
 * LLM call — this is pattern-matched on the agent's data so the prototype's
 * "AI suggestions" feel earned without being mock-noise.
 *
 * Rules (in priority order):
 *   1. Hot buyer awaiting reply → "Reply to {name}; site-visit-ready"
 *   2. Engine-vs-editorial disagreement on a Hot-flagged lead → "Review {name} — engine and your editorial flag disagree"
 *   3. Cold lead with engagement signals → "{name} opened your brochure — try a follow-up"
 *   4. Confirmed site visit in next 24h → "Reminder set for {name}'s viewing"
 *   5. Always-on hygiene: "{N} cold inquiries waiting in your inbox"
 *
 * Returns up to `limit` suggestions (default 3).
 */
export function generateAgentAISuggestions(
  agentId: string,
  leads: Lead[],
  siteVisits: SiteVisit[],
  referenceIso: string,
  limit = 3,
  listings: Listing[] = [],
): AISuggestion[] {
  const out: AISuggestion[] = [];
  const myLeads = leads.filter((l) => l.assignedAgentId === agentId);
  const priceById = buildListingPriceMap(listings);

  // Rule 2 (highest priority — surface contradictions for review)
  for (const l of myLeads) {
    const engineCat = scoreLeadWithContext(l, priceById).category;
    if (l.seedScoreCategory === "Hot" && engineCat === "Cold") {
      out.push({
        id: `ai-sug-contradiction-${l.id}`,
        title: `Review ${l.buyer.name}`,
        body: `Editorial reads them as Hot, but the engine sees no qualifying signals (no budget, no timeline, no engagement). Worth a quick verification call before any heavy follow-up.`,
        ctaLabel: "Open profile",
        ctaHref: `/agent/leads/${l.id}/profile`,
        priority: "Important",
      });
    }
  }

  // Rule 1
  for (const l of myLeads) {
    const engineScore = scoreLeadWithContext(l, priceById).total;
    if (engineScore >= 70 && l.needsReply) {
      out.push({
        id: `ai-sug-hot-reply-${l.id}`,
        title: `Reply to ${l.buyer.name}`,
        body: `${l.lastMessagePreview.slice(0, 80)}${l.lastMessagePreview.length > 80 ? "…" : ""} — AI has drafted a response.`,
        ctaLabel: "Open conversation",
        ctaHref: `/agent/leads/${l.id}`,
        priority: "Urgent",
      });
    }
  }

  // Rule 3 — cold leads with at least one engagement signal
  for (const l of myLeads) {
    const engineScore = scoreLeadWithContext(l, priceById).total;
    const hasEngagement =
      l.buyer.hasOpenedBrochure ||
      l.buyer.hasWatchedWalkthrough ||
      l.buyer.hasAskedForComputation;
    if (engineScore < 30 && hasEngagement) {
      out.push({
        id: `ai-sug-cold-engaged-${l.id}`,
        title: `${l.buyer.name} is warming up`,
        body: `Currently scored Cold but has engaged with your materials. A computation share could lift them into Nurture.`,
        ctaLabel: "Open profile",
        ctaHref: `/agent/leads/${l.id}/profile`,
        priority: "Normal",
      });
    }
  }

  // Rule 4 — site visits in next 24h
  const refDay = referenceIso.slice(0, 10);
  for (const sv of siteVisits) {
    if (sv.agentId !== agentId) continue;
    const dayOnly = sv.scheduledAt.slice(0, 10);
    if (
      (dayOnly === refDay || dayOnly === addDay(refDay, 1)) &&
      (sv.status === "Confirmed" || sv.status === "Reminder Sent")
    ) {
      out.push({
        id: `ai-sug-site-visit-${sv.id}`,
        title: `Site visit reminder set for ${sv.buyerName}`,
        body: `${sv.listingTitle} on ${formatShortDate(sv.scheduledAt)}. AI sent the location pin and a 24h reminder.`,
        ctaLabel: "View site visit",
        ctaHref: null,
        priority: "Normal",
      });
    }
  }

  return out.slice(0, limit);
}

function addDay(yyyymmdd: string, n: number): string {
  const d = new Date(yyyymmdd + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// AI briefing line (top of dashboard, single-sentence greeting + situational note)
// ---------------------------------------------------------------------------

export function generateBriefingSentence(
  firstName: string,
  kpis: AgentDashboardKPIs,
): string {
  const parts: string[] = [];
  if (kpis.hotBuyers > 0) {
    parts.push(
      `${kpis.hotBuyers} hot buyer${kpis.hotBuyers === 1 ? "" : "s"}`,
    );
  }
  if (kpis.siteVisitsBooked > 0) {
    parts.push(
      `${kpis.siteVisitsBooked} site visit${kpis.siteVisitsBooked === 1 ? "" : "s"} booked`,
    );
  }
  if (kpis.activeDeals > 0) {
    parts.push(
      `${kpis.activeDeals} active deal${kpis.activeDeals === 1 ? "" : "s"}`,
    );
  }
  if (kpis.newLeadsToday > 0) {
    parts.push(
      `${kpis.newLeadsToday} new lead${kpis.newLeadsToday === 1 ? "" : "s"} today`,
    );
  }
  if (parts.length === 0) {
    return `Good morning, ${firstName}. Today's a clean slate — perfect for prospecting.`;
  }
  if (parts.length === 1) {
    return `Good morning, ${firstName}. You have ${parts[0]} on your plate.`;
  }
  const last = parts.pop();
  return `Good morning, ${firstName}. You have ${parts.join(", ")}, and ${last}.`;
}

/** Pick the agent's first name from their full name (for greetings). */
export function firstNameOf(fullName: string): string {
  const trimmed = fullName.trim();
  const first = trimmed.split(/\s+/)[0];
  return first ?? trimmed;
}
