import type { ConversationMessage } from "@/lib/types";

/**
 * Seed Conversation Messages.
 *
 * Each conversation is keyed to a lead. Includes:
 *   - The cold-noise inquiry conversation (single buyer message, awaiting reply)
 *   - The contradiction lead conversation (verbal urgency without engagement)
 *   - The nurture-beat lead conversation (slow back-and-forth, brochure-share-ready)
 *   - Several full conversations with AI-suggested replies as drafts
 */

export const seedConversationMessages: ConversationMessage[] = [
  // -- Cold noise inquiry: one terse buyer message --
  {
    id: "msg-001",
    leadId: "lead-noise-01",
    sender: "buyer",
    body: "is this still available?",
    sentAt: "2025-05-28T09:14:00.000Z",
  },

  // -- Contradiction lead: verbal urgency, no engagement signals --
  {
    id: "msg-002",
    leadId: "lead-contradiction-01",
    sender: "buyer",
    body: "Hi, I was referred to you by a friend. I'm looking for a condo.",
    sentAt: "2025-05-27T14:30:00.000Z",
  },
  {
    id: "msg-003",
    leadId: "lead-contradiction-01",
    sender: "agent",
    body: "Hi Roy! Great to hear from you. Can you tell me your budget range and timeline?",
    sentAt: "2025-05-27T15:10:00.000Z",
  },
  {
    id: "msg-004",
    leadId: "lead-contradiction-01",
    sender: "buyer",
    body: "I want to close this fast. Can we meet?",
    sentAt: "2025-05-28T08:22:00.000Z",
  },
  {
    id: "msg-005",
    leadId: "lead-contradiction-01",
    sender: "ai",
    body: "Hi Roy, happy to meet. To prepare, could you share your target price range, preferred location, and whether you're planning bank financing or cash? That way I can have 2–3 strong options ready for our meeting.",
    sentAt: "2025-05-28T08:25:00.000Z",
    tone: "Professional Broker",
    language: "English",
    isDraft: true,
  },

  // -- Nurture-beat lead: slow back-and-forth, ripe for a brochure share --
  {
    id: "msg-006",
    leadId: "lead-nurture-01",
    sender: "buyer",
    body: "Saw the Cebu Prime ad. Looking for an investment unit, budget around 5M.",
    sentAt: "2025-05-24T11:20:00.000Z",
  },
  {
    id: "msg-007",
    leadId: "lead-nurture-01",
    sender: "agent",
    body: "Hi Karen! The 2BR Premium at Cebu Prime is a strong fit at 6.8M with rental yields ~7% in the area. Want me to send the full brochure?",
    sentAt: "2025-05-24T13:45:00.000Z",
  },
  {
    id: "msg-008",
    leadId: "lead-nurture-01",
    sender: "buyer",
    body: "Sure, send it over.",
    sentAt: "2025-05-26T16:00:00.000Z",
  },
  {
    id: "msg-009",
    leadId: "lead-nurture-01",
    sender: "ai",
    body: "Hi Karen! Attaching the Cebu Prime 2BR brochure, computation sheet, and a 3-min walkthrough video. The 1BR Deluxe at 5.5M also fits your budget — included for comparison. Let me know which one to schedule a viewing for.",
    sentAt: "2025-05-29T08:00:00.000Z",
    tone: "Friendly Agent",
    language: "English",
    isDraft: true,
    attachmentIds: ["file-003", "file-004"],
  },

  // -- High-engagement hot lead conversation --
  {
    id: "msg-010",
    leadId: "lead-instagram-01",
    sender: "buyer",
    body: "Hi! Saw your Laurel Hills post. We're a family of 5 looking at 15-20M range.",
    sentAt: "2025-05-15T10:00:00.000Z",
  },
  {
    id: "msg-011",
    leadId: "lead-instagram-01",
    sender: "agent",
    body: "Perfect match — Unit 12A at 18.5M, 4BR, garden view, near top schools. Sending brochure now.",
    sentAt: "2025-05-15T10:25:00.000Z",
  },
  {
    id: "msg-012",
    leadId: "lead-instagram-01",
    sender: "buyer",
    body: "Can you send a sample computation for 20% downpayment, 15-year financing?",
    sentAt: "2025-05-20T11:00:00.000Z",
  },
  {
    id: "msg-013",
    leadId: "lead-instagram-01",
    sender: "agent",
    body: "Attached. Monthly amortization at PNB rates would be around ₱112K. Would Saturday May 31 work for a site visit?",
    sentAt: "2025-05-20T14:30:00.000Z",
  },
  {
    id: "msg-014",
    leadId: "lead-instagram-01",
    sender: "buyer",
    body: "Looking forward to the site visit on Saturday!",
    sentAt: "2025-05-28T17:30:00.000Z",
  },

  // -- QR-code warm lead awaiting reply --
  {
    id: "msg-015",
    leadId: "lead-qr-01",
    sender: "buyer",
    body: "Hi, scanned the QR at the open house. Interested in IT Park condos.",
    sentAt: "2025-05-18T16:00:00.000Z",
  },
  {
    id: "msg-016",
    leadId: "lead-qr-01",
    sender: "agent",
    body: "Hi Patricia! The 2BR Premium at Cebu Prime is right in the IT Park area — 6.8M with full amenities. Sent brochure.",
    sentAt: "2025-05-19T09:00:00.000Z",
  },
  {
    id: "msg-017",
    leadId: "lead-qr-01",
    sender: "buyer",
    body: "Can you send the floor plan?",
    sentAt: "2025-05-26T12:00:00.000Z",
  },
  {
    id: "msg-018",
    leadId: "lead-qr-01",
    sender: "ai",
    body: "Hi Patricia! Attaching the 2BR Premium floor plan with annotated measurements. The 78 sqm layout has separate dining + balcony — happy to walk you through it on a viewing if you'd like.",
    sentAt: "2025-05-29T08:05:00.000Z",
    tone: "Friendly Agent",
    language: "English",
    isDraft: true,
    attachmentIds: ["file-009"],
  },
];
