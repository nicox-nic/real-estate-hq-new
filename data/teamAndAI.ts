import type { AIActivity, BonusCampaign, TeamUpdate } from "@/lib/types";

/**
 * Seed Team Updates — broker/realtor-authored broadcasts.
 *
 * Covers 6 of the 11 update types from the PRD, with engagement counts.
 * Channel mix reflects the broker's reach (in-app + email being primary).
 */

export const seedTeamUpdates: TeamUpdate[] = [
  {
    id: "update-001",
    authorId: "broker-001",
    type: "New Listing Alert",
    title: "🏝️ NEW EXCLUSIVE: Mactan Beach Villa",
    body: "Just listed — 5BR beachfront villa at ₱19.5M with 3% gross commission. Direct beach access, infinity pool, fully furnished. First 3 agents to share with qualified buyers get priority on inquiries. Brochure attached.",
    channels: ["In-App Notification", "Email", "Messenger Group"],
    audience: "All Agents",
    sentAt: "2025-05-26T09:00:00.000Z",
    delivered: 9,
    opened: 8,
    acknowledged: 7,
    clicked: 6,
  },
  {
    id: "update-002",
    authorId: "broker-001",
    type: "Sales Meeting Reminder",
    title: "Monthly Sales Meeting — Friday May 30, 9 AM",
    body: "Agenda: May closing sprint progress, Q2 targets, new developer partnerships (Rockwell + Ayala Land updates). Mandatory for all agents.",
    channels: ["In-App Notification", "Email"],
    audience: "All Agents",
    sentAt: "2025-05-27T15:00:00.000Z",
    delivered: 9,
    opened: 9,
    acknowledged: 8,
    clicked: 4,
  },
  {
    id: "update-003",
    authorId: "broker-001",
    type: "Bonus Announcement",
    title: "🏆 May Closing Sprint — ₱50K Bonus",
    body: "Close 3+ deals this month for a ₱50,000 bonus on top of your regular commission. Top closer gets an additional ₱25K + dinner with the realty. Current standings updated daily on the dashboard.",
    channels: ["In-App Notification", "Push Notification", "Email"],
    audience: "All Agents",
    sentAt: "2025-05-01T08:00:00.000Z",
    delivered: 9,
    opened: 9,
    acknowledged: 9,
    clicked: 7,
  },
  {
    id: "update-004",
    authorId: "broker-001",
    type: "Document Requirement",
    title: "⚠️ Reminder: Updated PRC license on file",
    body: "Three agents have PRC licenses expiring in June. Please upload updated documents through Settings > Documents by June 5 to avoid commission processing delays.",
    channels: ["In-App Notification", "Email"],
    audience: "Selected",
    sentAt: "2025-05-25T11:00:00.000Z",
    delivered: 3,
    opened: 3,
    acknowledged: 2,
    clicked: 1,
  },
  {
    id: "update-005",
    authorId: "broker-001",
    type: "Motivational Message",
    title: "Crossing the finish line on May 🎯",
    body: "Three deals in For Closing this week — let's tighten the documents and get them released by Friday. Alyssa, Rafael, Grace — you're carrying the team. Everyone else, let's get the warm leads warmer before month-end.",
    channels: ["In-App Notification"],
    audience: "All Agents",
    sentAt: "2025-05-26T17:00:00.000Z",
    delivered: 9,
    opened: 7,
    acknowledged: 5,
    clicked: 0,
  },
  {
    id: "update-006",
    authorId: "broker-001",
    type: "Training Material",
    title: "Objection-handling workshop recording",
    body: "Recording from yesterday's session on handling 'I need to discuss with my spouse' and 'I'm comparing with another agent.' Watch the 18-min clip before next Friday — we'll role-play in the next meeting.",
    channels: ["In-App Notification", "Email"],
    audience: "All Agents",
    sentAt: "2025-05-22T14:00:00.000Z",
    delivered: 9,
    opened: 6,
    acknowledged: 4,
    clicked: 4,
  },
];

/**
 * Seed Bonus Campaigns.
 *
 * The "May Closing Sprint" matches the team update above and is the
 * primary campaign visible in Awards/Bonuses screens.
 */

export const seedBonusCampaigns: BonusCampaign[] = [
  {
    id: "bonus-001",
    authorId: "broker-001",
    name: "May Closing Sprint",
    goal: "Close 3+ deals between May 1 and May 31",
    rewardAmount: 50_000,
    rewardDescription: "₱50K cash bonus + dinner with realty for top closer (+₱25K)",
    startDate: "2025-05-01",
    endDate: "2025-05-31",
    eligibleAgentIds: [
      "agent-001",
      "agent-002",
      "agent-003",
      "agent-004",
      "agent-005",
      "agent-006",
      "agent-007",
      "agent-008",
      "agent-009",
    ],
    participatingAgentIds: [
      "agent-001",
      "agent-002",
      "agent-003",
      "agent-004",
      "agent-006",
    ],
    podium: { first: 50_000, second: 30_000, third: 20_000 },
    progressPercent: 65,
    targetAmount: 9, // 9 closings expected from team
    currentAmount: 6, // 6 closings so far this month
  },
  {
    id: "bonus-002",
    authorId: "realtor-001",
    name: "Q2 Developer Partnership Push",
    goal: "Share 30+ Landmasters listings per agent this quarter",
    rewardAmount: 15_000,
    rewardDescription: "₱15K per qualifying agent",
    startDate: "2025-04-01",
    endDate: "2025-06-30",
    eligibleAgentIds: [
      "agent-001",
      "agent-002",
      "agent-003",
      "agent-005",
      "agent-006",
      "agent-009",
      "agent-010",
      "agent-011",
    ],
    participatingAgentIds: ["agent-001", "agent-002", "agent-010"],
    progressPercent: 42,
    targetAmount: 30,
    currentAmount: 13,
  },
];

/**
 * Seed AI Activity Feed.
 *
 * Demonstrates the 18 AI agent types working behind the scenes. Each entry
 * captures one moment of AI action with a relatable summary line.
 */

export const seedAIActivity: AIActivity[] = [
  {
    id: "ai-001",
    agentType: "Lead Capture",
    forUserId: "agent-001",
    summary: "Captured new lead Karen Yap from Facebook Lead Ads campaign.",
    occurredAt: "2025-05-24T11:20:00.000Z",
    relatedEntityId: "lead-nurture-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-002",
    agentType: "Qualification",
    forUserId: "agent-001",
    summary:
      "Qualified Maria Santos as Hot Buyer — budget aligned with Laurel Hills 12A, family of 5, 3-month timeline.",
    occurredAt: "2025-05-15T10:05:00.000Z",
    relatedEntityId: "lead-instagram-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-003",
    agentType: "Follow-Up",
    forUserId: "agent-007",
    summary:
      "Drafted nurture follow-up for Karen Yap — suggested brochure + computation share to lift engagement score.",
    occurredAt: "2025-05-29T07:55:00.000Z",
    relatedEntityId: "lead-nurture-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-004",
    agentType: "Brochure",
    forUserId: "agent-001",
    summary:
      "Generated personalized brochure for John Dela Cruz — Cebu Prime 2BR with investment-yield calc.",
    occurredAt: "2025-05-11T10:02:00.000Z",
    relatedEntityId: "lead-facebook-02",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-005",
    agentType: "Computation",
    forUserId: "agent-001",
    summary:
      "Built sample computation for Maria Santos at 20%/15yr — monthly amortization ₱112,400.",
    occurredAt: "2025-05-20T14:25:00.000Z",
    relatedEntityId: "lead-instagram-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-006",
    agentType: "Booking",
    forUserId: "agent-002",
    summary: "Site visit booked for Bea Castro (Talisay Villa, May 28 3PM).",
    occurredAt: "2025-05-25T16:00:00.000Z",
    relatedEntityId: "sv-006",
    relatedEntityType: "SiteVisit",
  },
  {
    id: "ai-007",
    agentType: "Reminder",
    forUserId: "agent-001",
    summary: "Sent 24h site-visit reminder to Alex Reyes (Veranda 8F).",
    occurredAt: "2025-05-29T14:00:00.000Z",
    relatedEntityId: "sv-002",
    relatedEntityType: "SiteVisit",
  },
  {
    id: "ai-008",
    agentType: "CRM",
    forUserId: "agent-001",
    summary: "Auto-classified 3 incoming messages: 1 Hot, 1 Warm, 1 Cold.",
    occurredAt: "2025-05-28T09:30:00.000Z",
  },
  {
    id: "ai-009",
    agentType: "Assignment",
    forUserId: "broker-001",
    summary:
      "Auto-assigned Karen Yap to Jason Ong — match by specialization (Condo, Investment) + capacity.",
    occurredAt: "2025-05-24T11:21:00.000Z",
    relatedEntityId: "lead-nurture-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-010",
    agentType: "Content",
    forUserId: "agent-001",
    summary: "Generated 3 social posts for the May Closing Sprint announcement.",
    occurredAt: "2025-05-22T10:00:00.000Z",
  },
  {
    id: "ai-011",
    agentType: "Analytics",
    forUserId: "broker-001",
    summary:
      "Weekly team summary: 6 closings, ₱523K in agent commissions, top performer Alyssa (5 closings).",
    occurredAt: "2025-05-26T08:00:00.000Z",
  },
  {
    id: "ai-012",
    agentType: "Manager Insight",
    forUserId: "broker-001",
    summary:
      "Coaching insight: Jason Ong's reply latency averages 4h, 3× team median. Brochure-share rate also below team avg.",
    occurredAt: "2025-05-27T07:00:00.000Z",
    relatedEntityId: "agent-007",
  },
  {
    id: "ai-013",
    agentType: "Reactivation",
    forUserId: "agent-005",
    summary:
      "Flagged Paulo Reyes for reactivation — went cold after Instagram DM engagement 1 week ago.",
    occurredAt: "2025-05-28T08:00:00.000Z",
    relatedEntityId: "lead-ig-dm-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-014",
    agentType: "Objection Handling",
    forUserId: "agent-006",
    summary:
      "Suggested reply to Erika Bautista's pricing objection — anchored to per-sqm comparables.",
    occurredAt: "2025-05-25T16:00:00.000Z",
    relatedEntityId: "lead-openhouse-01",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-015",
    agentType: "Commission Reminder",
    forUserId: "agent-001",
    summary:
      "The Veranda commission expected to release on May 30 — payout account confirmed (BDO ****5678).",
    occurredAt: "2025-05-28T06:00:00.000Z",
    relatedEntityId: "comm-003",
    relatedEntityType: "Commission",
  },
  {
    id: "ai-016",
    agentType: "Listing Share",
    forUserId: "agent-001",
    summary: "Shared Laurel 12A with Maria Santos via Messenger — smart link created.",
    occurredAt: "2025-05-14T16:30:00.000Z",
    relatedEntityId: "share-001",
  },
  {
    id: "ai-017",
    agentType: "Technical Reply",
    forUserId: "agent-002",
    summary:
      "Answered John Dela Cruz's question about Pag-IBIG income ceiling — pulled from current circular.",
    occurredAt: "2025-05-11T11:00:00.000Z",
    relatedEntityId: "lead-facebook-02",
    relatedEntityType: "Lead",
  },
  {
    id: "ai-018",
    agentType: "Voice Call",
    forUserId: "agent-001",
    summary:
      "Outbound voice call attempted to JM Garcia — left voicemail with brochure link.",
    occurredAt: "2025-05-28T10:30:00.000Z",
    relatedEntityId: "lead-noise-01",
    relatedEntityType: "Lead",
  },
];
