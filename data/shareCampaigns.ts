import type { ShareCampaign } from "@/lib/types";

/**
 * Seed Share Campaigns.
 *
 * Historical shares with engagement data. These power the "engagement
 * tracking" surface — opens, brochure clicks, computation requests,
 * site visit bookings, replies, reshares.
 *
 * Includes a recent share by agent-001 that converted to a booking
 * (the buyer journey demo), and pre-existing shares by the nurture-beat
 * agent agent-007 to demonstrate baseline activity.
 */

export const seedShareCampaigns: ShareCampaign[] = [
  // High-engagement share that converted
  {
    id: "share-001",
    listingId: "listing-laurel-12a",
    agentId: "agent-001",
    buyerProfileId: "buyer-005",
    channel: "Messenger",
    smartLinkUrl: "https://reh.link/lhe-12a-a1m5",
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
  },
  // Investor buyer share
  {
    id: "share-002",
    listingId: "listing-cebu-prime-2br",
    agentId: "agent-002",
    buyerProfileId: "buyer-006",
    channel: "WhatsApp",
    smartLinkUrl: "https://reh.link/cp-2br-r2t8",
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
  },
  // OFW share
  {
    id: "share-003",
    listingId: "listing-bayfront-1br",
    agentId: "agent-002",
    buyerProfileId: "buyer-008",
    channel: "WhatsApp",
    smartLinkUrl: "https://reh.link/bf-1br-jt4x",
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
  },
  // Light-engagement existing share by Jason Ong — baseline before nurture-beat
  {
    id: "share-004",
    listingId: "listing-rfo-2",
    agentId: "agent-007",
    buyerProfileId: "buyer-023",
    channel: "Messenger",
    smartLinkUrl: "https://reh.link/amaia-2br-j5k",
    message: "Hi Cathy, here's the Amaia Steps 2BR — RFO, OFW-friendly.",
    attachedFileIds: ["file-006"],
    sharedAt: "2025-05-23T14:00:00.000Z",
    opens: 2,
    brochureClicks: 1,
    computationRequests: 0,
    siteVisitBookings: 0,
    replies: 1,
    reshares: 0,
  },
  // Luxury share
  {
    id: "share-005",
    listingId: "listing-exclusive-talisay",
    agentId: "agent-002",
    buyerProfileId: "buyer-014",
    channel: "Email",
    smartLinkUrl: "https://reh.link/tlsy-vlla-bc8",
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
  },
];
