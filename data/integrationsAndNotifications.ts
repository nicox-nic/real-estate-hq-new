import type {
  Integration,
  IntegrationProvider,
  NotificationItem,
} from "@/lib/types";

/**
 * Seed Integrations — all 18 providers from the PRD.
 *
 * Realistic connection mix: lead sources mostly connected,
 * automation tools (n8n / Make / Zapier) mostly disconnected,
 * Inventory DB connected for developer listings.
 */

const allProviders: IntegrationProvider[] = [
  "Facebook Lead Ads",
  "Instagram Lead Ads",
  "TikTok Lead Forms",
  "Google Ads Lead Forms",
  "WhatsApp Business",
  "Messenger",
  "Instagram DM",
  "SMS Provider",
  "Email",
  "Google Calendar",
  "Google Sheets",
  "CRM Systems",
  "n8n",
  "Make",
  "Zapier",
  "Website Forms",
  "Landing Pages",
  "Property Inventory Database",
];

const connectedSet = new Set<IntegrationProvider>([
  "Facebook Lead Ads",
  "Instagram Lead Ads",
  "TikTok Lead Forms",
  "Google Ads Lead Forms",
  "WhatsApp Business",
  "Messenger",
  "Instagram DM",
  "Email",
  "Google Calendar",
  "Website Forms",
  "Landing Pages",
  "Property Inventory Database",
]);

const leadsTodayByProvider: Partial<Record<IntegrationProvider, number>> = {
  "Facebook Lead Ads": 4,
  "Instagram Lead Ads": 2,
  "TikTok Lead Forms": 1,
  "Google Ads Lead Forms": 1,
  Messenger: 3,
  "Instagram DM": 1,
  "Website Forms": 2,
  "Landing Pages": 1,
  "WhatsApp Business": 0,
};

export const seedIntegrations: Integration[] = allProviders.map((provider, i) => {
  const connected = connectedSet.has(provider);
  return {
    id: `integration-${String(i + 1).padStart(3, "0")}`,
    provider,
    isConnected: connected,
    lastSyncAt: connected ? "2025-05-29T07:30:00.000Z" : undefined,
    leadsCapturedToday: connected ? leadsTodayByProvider[provider] ?? 0 : undefined,
    errorMessage:
      provider === "SMS Provider"
        ? "Provider account inactive — renew Semaphore subscription."
        : undefined,
  };
});

/**
 * Seed Notifications.
 *
 * Categorized list aligned with the 14 notification categories from the PRD.
 * Targeted at agent-001 by default (the demo POV), with a few for broker-001
 * so the broker dashboard has its own notification feed.
 */

export const seedNotifications: NotificationItem[] = [
  {
    id: "notif-001",
    userId: "agent-001",
    category: "New Hot Lead",
    priority: "Urgent",
    title: "🔥 New Hot Lead: Maria Santos",
    body: "92% match for Laurel Hills 12A — site visit booked for Saturday.",
    occurredAt: "2025-05-15T10:00:00.000Z",
    read: true,
    relatedEntityId: "lead-instagram-01",
  },
  {
    id: "notif-002",
    userId: "agent-001",
    category: "Buyer Replied",
    priority: "Important",
    title: "Alex Reyes replied",
    body: "“I'll bring my partner to the viewing on May 30.”",
    occurredAt: "2025-05-28T10:00:00.000Z",
    read: false,
    relatedEntityId: "lead-tiktok-01",
  },
  {
    id: "notif-003",
    userId: "agent-001",
    category: "Buyer Opened Listing",
    priority: "Normal",
    title: "Maria Santos opened the brochure (3rd time)",
    body: "Laurel Hills 12A brochure — strong intent signal.",
    occurredAt: "2025-05-27T14:00:00.000Z",
    read: true,
    relatedEntityId: "lead-instagram-01",
  },
  {
    id: "notif-004",
    userId: "agent-001",
    category: "Computation Requested",
    priority: "Important",
    title: "Patricia Cruz requested floor plan",
    body: "Cebu Prime 2BR — AI drafted a reply, ready to send.",
    occurredAt: "2025-05-26T12:00:00.000Z",
    read: false,
    relatedEntityId: "lead-qr-01",
  },
  {
    id: "notif-005",
    userId: "agent-001",
    category: "Site Visit Confirmed",
    priority: "Important",
    title: "Site visit confirmed: Maria Santos",
    body: "Saturday May 31, 10 AM — Laurel Hills sales pavilion.",
    occurredAt: "2025-05-20T14:30:00.000Z",
    read: true,
    relatedEntityId: "sv-001",
  },
  {
    id: "notif-006",
    userId: "agent-001",
    category: "Site Visit Reminder",
    priority: "Urgent",
    title: "Reminder: Veranda 8F viewing tomorrow",
    body: "Alex Reyes — May 30 2 PM. AI sent buyer the location pin.",
    occurredAt: "2025-05-29T14:00:00.000Z",
    read: false,
    relatedEntityId: "sv-002",
  },
  {
    id: "notif-007",
    userId: "agent-001",
    category: "Deal Stage Changed",
    priority: "Normal",
    title: "Bayfront 1BR moved to Commission Released",
    body: "James Tan — ₱4.5M closed, agent share ₱67,500.",
    occurredAt: "2025-05-05T15:00:00.000Z",
    read: true,
    relatedEntityId: "deal-004",
  },
  {
    id: "notif-008",
    userId: "agent-001",
    category: "Commission Approved",
    priority: "Important",
    title: "Veranda 8F commission approved",
    body: "Released to BDO ****5678 on May 30 (expected).",
    occurredAt: "2025-05-28T09:00:00.000Z",
    read: false,
    relatedEntityId: "comm-003",
  },
  {
    id: "notif-009",
    userId: "agent-001",
    category: "Commission Released",
    priority: "Important",
    title: "Bayfront commission released",
    body: "₱67,500 credited to BDO ****5678 on May 5.",
    occurredAt: "2025-05-05T15:30:00.000Z",
    read: true,
    relatedEntityId: "comm-004",
  },
  {
    id: "notif-010",
    userId: "agent-001",
    category: "Missing Document",
    priority: "Urgent",
    title: "⚠️ Riverside 15C: documents missing",
    body: "Bank approval letter and updated payslips needed. Deal on hold.",
    occurredAt: "2025-05-06T11:00:00.000Z",
    read: false,
    relatedEntityId: "deal-006",
  },
  {
    id: "notif-011",
    userId: "agent-007",
    category: "Cold Lead Reactivation",
    priority: "Important",
    title: "Reactivation suggestion: Karen Yap",
    body: "AI recommends sharing the Cebu Prime 2BR brochure + computation now.",
    occurredAt: "2025-05-29T07:55:00.000Z",
    read: false,
    relatedEntityId: "lead-nurture-01",
  },
  {
    id: "notif-012",
    userId: "agent-001",
    category: "Broker Sent Listing",
    priority: "Normal",
    title: "Broker shared: Mactan Beach Villa",
    body: "New exclusive — ₱19.5M, 3% gross. Brochure attached.",
    occurredAt: "2025-05-26T09:00:00.000Z",
    read: true,
    relatedEntityId: "listing-broker-mactan-villa",
  },
  {
    id: "notif-013",
    userId: "agent-001",
    category: "Team Announcement",
    priority: "Normal",
    title: "Sales meeting Friday 9 AM",
    body: "May closing sprint review + new partnerships briefing.",
    occurredAt: "2025-05-27T15:00:00.000Z",
    read: true,
  },
  {
    id: "notif-014",
    userId: "agent-001",
    category: "Bonus Campaign",
    priority: "Important",
    title: "🏆 You're #1 on May Closing Sprint",
    body: "Keep going — top closer gets +₱25K and dinner with the realty.",
    occurredAt: "2025-05-28T20:00:00.000Z",
    read: false,
  },

  // Broker notifications
  {
    id: "notif-015",
    userId: "broker-001",
    category: "Deal Stage Changed",
    priority: "Important",
    title: "Bea Castro reserved Talisay Villa",
    body: "Rafael Tan — ₱28M reservation paid. Commission tracking opened.",
    occurredAt: "2025-05-28T15:30:00.000Z",
    read: false,
    relatedEntityId: "deal-007",
  },
  {
    id: "notif-016",
    userId: "broker-001",
    category: "Team Announcement",
    priority: "Normal",
    title: "Jason Ong needs coaching attention",
    body: "Reply latency 3× team median this week. AI suggests 1:1.",
    occurredAt: "2025-05-27T07:00:00.000Z",
    read: false,
    relatedEntityId: "agent-007",
  },
];
