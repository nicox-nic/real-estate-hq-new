import type {
  ShareCampaign,
  EngagementEvent,
  EngagementEventKind,
} from "@/lib/types";

/**
 * Seed Share Campaigns.
 *
 * Historical shares with engagement data. These power:
 *   - Share Performance / engagement metrics on listing pages and dashboards
 *   - File Engagement Tracking strip (Session 5B's marquee post-send view)
 *   - The "look — engagement is happening live" demo beat
 *
 * Includes:
 *   - share-001..share-005: historical shares (Session 1 seed)
 *   - share-006: THE MARQUEE ANCHOR for Session 5B. Maria + Laurel 12A
 *     sent ~2 hours before the seed reference time, with 4 attachments
 *     and 4 timestamped engagement events matching the mockup's File
 *     Engagement Tracking strip:
 *       Brochure Opened 10:24 AM
 *       Computation Downloaded 10:26 AM
 *       Floor Plan Viewed 10:27 AM
 *       Location Map Opened 10:28 AM
 *     Times in UTC+8 wall-clock; stored as Z-suffixed strings for
 *     deterministic verify locks.
 */

function ev(
  campaignId: string,
  kind: EngagementEventKind,
  at: string,
  fileId?: string,
): EngagementEvent {
  return {
    id: `evt-${campaignId}-${kind}-${at}`,
    shareCampaignId: campaignId,
    kind,
    at,
    ...(fileId ? { fileId } : {}),
  };
}

// share-001 engagement events: high-converting share (~14d ago)
const events001: EngagementEvent[] = [
  ev("share-001", "link_opened", "2025-05-14T16:33:00.000Z"),
  ev("share-001", "brochure_opened", "2025-05-14T16:34:00.000Z", "file-001"),
  ev("share-001", "computation_opened", "2025-05-14T16:38:00.000Z", "file-002"),
  ev("share-001", "computation_downloaded", "2025-05-15T08:22:00.000Z", "file-002"),
  ev("share-001", "reply_received", "2025-05-15T08:45:00.000Z"),
  ev("share-001", "site_visit_requested", "2025-05-16T10:00:00.000Z"),
];

// share-002 engagement (~18d ago)
const events002: EngagementEvent[] = [
  ev("share-002", "link_opened", "2025-05-11T10:05:00.000Z"),
  ev("share-002", "brochure_opened", "2025-05-11T10:07:00.000Z", "file-003"),
  ev("share-002", "computation_opened", "2025-05-11T10:12:00.000Z", "file-004"),
  ev("share-002", "reply_received", "2025-05-11T14:00:00.000Z"),
];

// share-003 engagement (~40d ago) — OFW high engagement
const events003: EngagementEvent[] = [
  ev("share-003", "link_opened", "2025-04-19T05:30:00.000Z"),
  ev("share-003", "brochure_opened", "2025-04-19T05:35:00.000Z", "file-005"),
  ev("share-003", "brochure_downloaded", "2025-04-19T05:40:00.000Z", "file-005"),
  ev("share-003", "reply_received", "2025-04-19T08:00:00.000Z"),
  ev("share-003", "site_visit_requested", "2025-04-22T12:00:00.000Z"),
];

// share-004 engagement (light)
const events004: EngagementEvent[] = [
  ev("share-004", "link_opened", "2025-05-23T15:00:00.000Z"),
  ev("share-004", "brochure_opened", "2025-05-23T15:01:00.000Z", "file-006"),
];

// share-005 engagement (luxury)
const events005: EngagementEvent[] = [
  ev("share-005", "link_opened", "2025-05-08T09:15:00.000Z"),
  ev("share-005", "brochure_opened", "2025-05-08T09:16:00.000Z", "file-007"),
  ev("share-005", "computation_opened", "2025-05-08T09:30:00.000Z", "file-008"),
  ev("share-005", "computation_downloaded", "2025-05-08T10:00:00.000Z", "file-008"),
  ev("share-005", "reply_received", "2025-05-09T11:00:00.000Z"),
];

// share-006 — THE MARQUEE ANCHOR for Session 5B.
// Maria (lead-instagram-01 / buyer-005) + Laurel 12A.
// Engagement events match the mockup's File Engagement Tracking strip
// exactly: Brochure Opened / Computation Downloaded / Floor Plan Viewed /
// Location Map Opened.
const events006: EngagementEvent[] = [
  ev("share-006", "link_opened", "2025-05-29T02:22:00.000Z"),
  ev(
    "share-006",
    "brochure_opened",
    "2025-05-29T02:24:00.000Z",
    "file-001",
  ),
  ev(
    "share-006",
    "computation_downloaded",
    "2025-05-29T02:26:00.000Z",
    "file-002",
  ),
  ev(
    "share-006",
    "floor_plan_viewed",
    "2025-05-29T02:27:00.000Z",
    "file-laurel-12a-floorplan",
  ),
  ev(
    "share-006",
    "location_map_opened",
    "2025-05-29T02:28:00.000Z",
    "file-laurel-12a-locationmap",
  ),
];

export const seedShareCampaigns: ShareCampaign[] = [
  // High-engagement share that converted
  {
    id: "share-001",
    listingId: "listing-laurel-12a",
    agentId: "agent-001",
    buyerProfileId: "buyer-005",
    channel: "Messenger",
    smartLinkUrl: "https://estatehq.ph/l/lhe-12a-a1m5",
    smartLinkToken: "a1m5",
    message:
      "Hi Maria! This Laurel Hills 4BR matches your family budget and is walking distance to BGC schools. Let me know if you want a viewing this weekend.",
    attachedFileIds: ["file-001", "file-002"],
    sharedAt: "2025-05-14T16:30:00.000Z",
    opens: 8,
    brochureClicks: 4,
    computationRequests: 2,
    siteVisitBookings: 1,
    replies: 6,
    reshares: 1,
    engagementEvents: events001,
  },
  // Investor buyer share
  {
    id: "share-002",
    listingId: "listing-cebu-prime-2br",
    agentId: "agent-002",
    buyerProfileId: "buyer-006",
    channel: "WhatsApp",
    smartLinkUrl: "https://estatehq.ph/l/cp-2br-r2t8",
    smartLinkToken: "r2t8",
    message:
      "John, the 2BR at Cebu Prime has strong rental yield in the area. Attaching the brochure + rental comparables.",
    attachedFileIds: ["file-003", "file-004"],
    sharedAt: "2025-05-11T10:00:00.000Z",
    opens: 5,
    brochureClicks: 3,
    computationRequests: 1,
    siteVisitBookings: 1,
    replies: 4,
    reshares: 0,
    engagementEvents: events002,
  },
  // OFW share
  {
    id: "share-003",
    listingId: "listing-bayfront-1br",
    agentId: "agent-002",
    buyerProfileId: "buyer-008",
    channel: "WhatsApp",
    smartLinkUrl: "https://estatehq.ph/l/bf-1br-jt4x",
    smartLinkToken: "jt4x",
    message:
      "Hi James, here's the Bayfront 1BR full package — Pag-IBIG eligible, beach view. Computation attached.",
    attachedFileIds: ["file-005"],
    sharedAt: "2025-04-19T05:00:00.000Z",
    opens: 12,
    brochureClicks: 6,
    computationRequests: 2,
    siteVisitBookings: 1,
    replies: 9,
    reshares: 0,
    engagementEvents: events003,
  },
  // Light-engagement existing share by Jason Ong — baseline before nurture-beat
  {
    id: "share-004",
    listingId: "listing-rfo-2",
    agentId: "agent-007",
    buyerProfileId: "buyer-023",
    channel: "Messenger",
    smartLinkUrl: "https://estatehq.ph/l/amaia-2br-j5k1",
    smartLinkToken: "j5k1",
    message: "Hi Cathy, here's the Amaia Steps 2BR — RFO, OFW-friendly.",
    attachedFileIds: ["file-006"],
    sharedAt: "2025-05-23T14:00:00.000Z",
    opens: 2,
    brochureClicks: 1,
    computationRequests: 0,
    siteVisitBookings: 0,
    replies: 1,
    reshares: 0,
    engagementEvents: events004,
  },
  // Luxury share
  {
    id: "share-005",
    listingId: "listing-exclusive-talisay",
    agentId: "agent-002",
    buyerProfileId: "buyer-014",
    channel: "Email",
    smartLinkUrl: "https://estatehq.ph/l/tlsy-vlla-bc8z",
    smartLinkToken: "bc8z",
    message:
      "Ms. Bea, attaching the full package for the Talisay villa. Private viewing slot held for Wednesday afternoon.",
    attachedFileIds: ["file-007", "file-008"],
    sharedAt: "2025-05-08T09:00:00.000Z",
    opens: 4,
    brochureClicks: 3,
    computationRequests: 1,
    siteVisitBookings: 1,
    replies: 5,
    reshares: 0,
    engagementEvents: events005,
  },
  // Marquee anchor for Session 5B — Maria + Laurel 12A, ~2h ago.
  {
    id: "share-006",
    listingId: "listing-laurel-12a",
    agentId: "agent-001",
    buyerProfileId: "buyer-005",
    channel: "Messenger",
    smartLinkUrl: "https://estatehq.ph/l/laurel-12a-m6t2",
    smartLinkToken: "m6t2",
    message:
      "Hi Maria! Based on your budget and preference for a family-friendly home in Taguig, I think this property might be a great fit for you.\n\nLaurel Hills Estate is a 4BR house and lot near schools, malls, and major roads.\n\nWould you like me to send the sample computation?",
    attachedFileIds: [
      "file-001",
      "file-002",
      "file-laurel-12a-floorplan",
      "file-laurel-12a-locationmap",
    ],
    sharedAt: "2025-05-29T02:20:00.000Z",
    opens: 3,
    brochureClicks: 1,
    computationRequests: 1,
    siteVisitBookings: 0,
    replies: 0,
    reshares: 0,
    engagementEvents: events006,
  },
];
