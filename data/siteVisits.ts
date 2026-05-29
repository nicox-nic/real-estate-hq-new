import type { SiteVisit } from "@/lib/types";

/**
 * Seed Site Visits.
 *
 * Mix of statuses: confirmed (upcoming), reminder sent, completed, converted.
 * Tied to leads with hasBookedSiteVisit = true.
 */

export const seedSiteVisits: SiteVisit[] = [
  {
    id: "sv-001",
    leadId: "lead-instagram-01",
    buyerName: "Maria Santos",
    listingId: "listing-laurel-12a",
    listingTitle: "Laurel Hills Estate — Unit 12A",
    agentId: "agent-001",
    scheduledAt: "2025-05-31T10:00:00.000Z",
    status: "Confirmed",
    locationNote: "Show unit at Laurel Hills sales pavilion",
    notes: "Bringing partner and parents.",
  },
  {
    id: "sv-002",
    leadId: "lead-tiktok-01",
    buyerName: "Alex Reyes",
    listingId: "listing-veranda-8f",
    listingTitle: "The Veranda — Tower 1 Unit 8F",
    agentId: "agent-001",
    scheduledAt: "2025-05-30T14:00:00.000Z",
    status: "Reminder Sent",
    locationNote: "The Veranda lobby — present ID at security",
    notes: "AI reminder sent 24h ahead.",
  },
  {
    id: "sv-003",
    leadId: "lead-facebook-02",
    buyerName: "John Dela Cruz",
    listingId: "listing-cebu-prime-2br",
    listingTitle: "Cebu Prime Residences — 2BR",
    agentId: "agent-002",
    scheduledAt: "2025-06-01T10:30:00.000Z",
    status: "Confirmed",
    locationNote: "Cebu Prime model unit",
  },
  {
    id: "sv-004",
    leadId: "lead-google-01",
    buyerName: "James Tan",
    listingId: "listing-bayfront-1br",
    listingTitle: "Bayfront Residences — 1BR",
    agentId: "agent-002",
    scheduledAt: "2025-04-15T11:00:00.000Z",
    status: "Converted",
    notes: "Site visit led to closed deal-004.",
  },
  {
    id: "sv-005",
    leadId: "lead-website-01",
    buyerName: "Carla Lim",
    listingId: "listing-suncrest-a5",
    listingTitle: "Suncrest Heights — Lot A5",
    agentId: "agent-003",
    scheduledAt: "2025-03-15T09:00:00.000Z",
    status: "Converted",
    notes: "Site visit led to closed deal-005.",
  },
  {
    id: "sv-006",
    leadId: "lead-referral-02",
    buyerName: "Bea Castro",
    listingId: "listing-exclusive-talisay",
    listingTitle: "Exclusive Hilltop Villa — Talisay",
    agentId: "agent-002",
    scheduledAt: "2025-05-28T15:00:00.000Z",
    status: "Completed",
    notes: "Booked reservation immediately after viewing.",
  },
  // Session 5C additions: cover Proposed, No-show, plus a Saturday-2pm
  // "marquee" upcoming anchor for the demo.
  {
    id: "sv-007",
    leadId: "lead-portal-02",
    buyerName: "Ron Marquez",
    listingId: "listing-veranda-8f",
    listingTitle: "The Veranda — Tower 1 Unit 8F",
    agentId: "agent-001",
    // Saturday 2pm Manila = Saturday 06:00 UTC
    scheduledAt: "2025-05-31T06:00:00.000Z",
    status: "Proposed",
    locationNote:
      "The Veranda sales pavilion — Ron prefers Saturday afternoons.",
    notes:
      "Demo anchor: Ron Marquez Saturday 2pm — proposed slot pending buyer confirmation.",
  },
  {
    id: "sv-008",
    leadId: "lead-manual-01",
    buyerName: "Romeo Bautista",
    listingId: "listing-rfo-2",
    listingTitle: "Amaia Steps — 2BR RFO",
    agentId: "agent-007",
    scheduledAt: "2025-05-20T10:00:00.000Z",
    status: "No-show",
    notes: "Buyer did not arrive; agent followed up the next morning.",
  },
  {
    id: "sv-009",
    leadId: "lead-fb-03",
    buyerName: "Eugene Cabrera",
    listingId: "listing-presell-1",
    listingTitle: "Mandaue Skyline — Pre-Selling 1BR",
    agentId: "agent-013",
    scheduledAt: "2025-06-02T11:00:00.000Z",
    status: "Confirmed",
    locationNote: "Mandaue Skyline scale model showroom — 2nd floor",
    notes: "First-time buyer; will bring spouse.",
  },
];
