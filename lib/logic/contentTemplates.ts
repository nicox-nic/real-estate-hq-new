/**
 * Content Studio templates
 *
 * Declarative template REGISTRY for Content Studio (#34). Different
 * shape from the 7 declarative rule tables (Rule of Seven, Session 7B);
 * this is a registry of templates keyed by content type, NOT a
 * rule-scoring table. The 7 rule tables answer "given inputs, what
 * does the engine output?"; this registry answers "given a content
 * type, what is the base template the engine renders?"
 *
 * Architectural decision: CONTENT_TEMPLATES is a registry, not a rule
 * table. The Rule of Seven stands. Registries and rule tables are
 * complementary disciplines — both declarative-data-over-imperative-logic,
 * but different output shapes.
 *
 * Sibling helper: generateContentTemplate alongside the existing
 * generateShareMessage (5A) and applyTone (3B) and applyShareTone (5A).
 * Composition pattern:
 *   templateBase = CONTENT_TEMPLATES[type].build(context)
 *   toned = applyShareTone(templateBase, tone, ...)  // existing
 *   translated = applyLanguage(toned, language, ...) // existing
 *
 * 12 content types per PRD's exact list:
 *   1. Property captions
 *   2. Facebook posts
 *   3. TikTok scripts
 *   4. Reels scripts
 *   5. Instagram captions
 *   6. Messenger replies
 *   7. WhatsApp messages
 *   8. Email follow-ups
 *   9. Open house invites
 *   10. Investment pitch messages
 *   11. OFW buyer messages
 *   12. Luxury buyer messages
 */

import type { Listing, BuyerProfile } from "@/lib/types";
import type { Tone } from "@/lib/logic/aiReply/tones";
import type { Language } from "@/lib/logic/aiReply/languages";
import { applyShareTone } from "@/lib/logic/aiShareTone";
import { applyLanguage } from "@/lib/logic/aiReply/languages";

// ----------------------------------------------------------------------------
// Content type union
// ----------------------------------------------------------------------------

export type ContentType =
  | "Property Caption"
  | "Facebook Post"
  | "TikTok Script"
  | "Reels Script"
  | "Instagram Caption"
  | "Messenger Reply"
  | "WhatsApp Message"
  | "Email Follow-up"
  | "Open House Invite"
  | "Investment Pitch"
  | "OFW Buyer Message"
  | "Luxury Buyer Message";

export const ALL_CONTENT_TYPES: ContentType[] = [
  "Property Caption",
  "Facebook Post",
  "TikTok Script",
  "Reels Script",
  "Instagram Caption",
  "Messenger Reply",
  "WhatsApp Message",
  "Email Follow-up",
  "Open House Invite",
  "Investment Pitch",
  "OFW Buyer Message",
  "Luxury Buyer Message",
];

// ----------------------------------------------------------------------------
// Destination platform mapping (for per-platform preview chrome)
// ----------------------------------------------------------------------------

export type DestinationPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "reels"
  | "messenger"
  | "whatsapp"
  | "email"
  | "generic";

export function destinationForContentType(t: ContentType): DestinationPlatform {
  switch (t) {
    case "Property Caption":
    case "Facebook Post":
      return "facebook";
    case "Instagram Caption":
      return "instagram";
    case "TikTok Script":
      return "tiktok";
    case "Reels Script":
      return "reels";
    case "Messenger Reply":
      return "messenger";
    case "WhatsApp Message":
      return "whatsapp";
    case "Email Follow-up":
      return "email";
    case "Open House Invite":
    case "Investment Pitch":
    case "OFW Buyer Message":
    case "Luxury Buyer Message":
      return "generic";
  }
}

// ----------------------------------------------------------------------------
// Template registry — declarative, content-type → base text builder
// ----------------------------------------------------------------------------

export interface ContentContext {
  listing?: Listing;
  buyer?: BuyerProfile;
  agentName?: string;
  /** Optional date for event-based templates like Open House Invite. */
  eventDate?: string;
  /** Optional location override (defaults to listing.location). */
  location?: string;
}

export interface ContentTemplate {
  type: ContentType;
  /** Short description shown in the picker. */
  description: string;
  /** Whether this template benefits from a listing in context. */
  requiresListing: boolean;
  /** Whether translation to Tagalog/Cebuano makes sense for this content. */
  supportsLanguage: boolean;
  /** Approximate character count for the rendered output (UI hint). */
  estimatedChars: number;
  /** The base template builder — produces English text from context. */
  build: (ctx: ContentContext) => string;
}

/**
 * CONTENT_TEMPLATES — the declarative registry. Keyed by ContentType.
 * Verify-locked: every ContentType has an entry; every entry has all
 * fields; every entry's build() returns non-empty text for the test
 * context.
 */
export const CONTENT_TEMPLATES: Record<ContentType, ContentTemplate> = {
  "Property Caption": {
    type: "Property Caption",
    description: "Short visual caption for property photos and gallery posts.",
    requiresListing: true,
    supportsLanguage: true,
    estimatedChars: 180,
    build: (ctx) => {
      const l = ctx.listing;
      if (!l) return "A beautiful property awaits. Inquire for more details.";
      return `${l.title} · ${(l as any).bedroomCount ?? ""}${
        (l as any).bedroomCount ? "BR" : ""
      } in ${l.location}. ₱${(l.price / 1_000_000).toFixed(1)}M · Move-in ready. DM for a private viewing.`;
    },
  },
  "Facebook Post": {
    type: "Facebook Post",
    description: "Long-form post with hook + listing details + soft CTA.",
    requiresListing: true,
    supportsLanguage: true,
    estimatedChars: 480,
    build: (ctx) => {
      const l = ctx.listing;
      if (!l) return "New listing just dropped — comment 'Interested' below.";
      return `Just listed in ${l.location} 🏡

${l.title}
${(l as any).bedroomCount ? `${(l as any).bedroomCount} bedrooms · ` : ""}${l.propertyType}
Price: ₱${(l.price / 1_000_000).toFixed(1)}M

This one won't last long. The location alone is worth the look — proximity to schools, malls, and major roads.

Drop a comment or DM for a private viewing this week.`;
    },
  },
  "TikTok Script": {
    type: "TikTok Script",
    description: "30-second vertical-video script with hook, body, and CTA beats.",
    requiresListing: true,
    supportsLanguage: true,
    estimatedChars: 360,
    build: (ctx) => {
      const l = ctx.listing;
      const title = l?.title ?? "this property";
      const price = l ? `₱${(l.price / 1_000_000).toFixed(1)}M` : "great value";
      return `[HOOK 0-3s] You won't believe what ${price} gets you in ${l?.location ?? "this neighborhood"}.

[BODY 3-25s] ${title} — walk through the kitchen, the master bedroom, the view from the balcony. Notice the natural light. The ${(l as any)?.bedroomCount ?? "main"}-bedroom layout flows perfectly.

[CTA 25-30s] Tap the link in bio, DM "PRIVATE TOUR" — I'll set you up this weekend.`;
    },
  },
  "Reels Script": {
    type: "Reels Script",
    description: "Vertical Reel script — hook-led, three-beat structure.",
    requiresListing: true,
    supportsLanguage: true,
    estimatedChars: 320,
    build: (ctx) => {
      const l = ctx.listing;
      return `[OPENER] Three reasons this ${l?.propertyType ?? "property"} sells itself:

1. Location: ${l?.location ?? "prime neighborhood"} — walk score 90+
2. Price: ₱${l ? (l.price / 1_000_000).toFixed(1) : "X"}M is fair for the square footage
3. Move-in ready — no renovation, no surprises

[CTA] Comment "TOUR" — I'll DM you scheduling.`;
    },
  },
  "Instagram Caption": {
    type: "Instagram Caption",
    description: "Square-photo caption with line breaks + hashtag pack.",
    requiresListing: true,
    supportsLanguage: true,
    estimatedChars: 280,
    build: (ctx) => {
      const l = ctx.listing;
      const hashtags = [
        "#realestate",
        "#philippines",
        l?.location ? `#${l.location.replace(/\s+/g, "")}` : "#newlisting",
        "#dreamhome",
        "#propertyforsale",
      ].join(" ");
      return `${l?.title ?? "New listing"}

${(l as any)?.bedroomCount ? `${(l as any).bedroomCount} bedrooms · ` : ""}${l?.location ?? ""}
₱${l ? (l.price / 1_000_000).toFixed(1) : "X"}M

Save this post if you're in the market — DM for private viewing.

${hashtags}`;
    },
  },
  "Messenger Reply": {
    type: "Messenger Reply",
    description: "Conversational Messenger response to a buyer inquiry.",
    requiresListing: false,
    supportsLanguage: true,
    estimatedChars: 160,
    build: (ctx) => {
      const name = ctx.buyer?.name?.split(/\s+/)[0] ?? "there";
      return `Hi ${name}! Thanks for reaching out. ${
        ctx.listing
          ? `${ctx.listing.title} is still available.`
          : "I'd love to help you find the right property."
      } Would you prefer a quick call or some photos sent over? Either works.`;
    },
  },
  "WhatsApp Message": {
    type: "WhatsApp Message",
    description: "Direct WhatsApp message, conversational and brief.",
    requiresListing: false,
    supportsLanguage: true,
    estimatedChars: 140,
    build: (ctx) => {
      const name = ctx.buyer?.name?.split(/\s+/)[0] ?? "there";
      return `Hi ${name} 👋 Quick update on ${
        ctx.listing?.title ?? "the property you asked about"
      }. Still available. Want me to send the brochure and floor plan?`;
    },
  },
  "Email Follow-up": {
    type: "Email Follow-up",
    description: "Professional email follow-up with subject + body.",
    requiresListing: false,
    supportsLanguage: false, // emails default to English for professionalism
    estimatedChars: 420,
    build: (ctx) => {
      const name = ctx.buyer?.name?.split(/\s+/)[0] ?? "there";
      return `Subject: Following up on ${ctx.listing?.title ?? "our conversation"}

Hi ${name},

I wanted to follow up on our recent conversation about ${ctx.listing?.title ?? "your property search"}. ${
        ctx.listing
          ? `Based on your budget and preference for ${ctx.listing.location}, I think this could be a strong match.`
          : "I have a few new listings I think you'd like."
      }

Are you free for a 15-minute call this week? I'd love to walk you through the details and answer any questions.

Best regards,
${ctx.agentName ?? "Your agent"}`;
    },
  },
  "Open House Invite": {
    type: "Open House Invite",
    description: "Open house invitation with date, time, location, RSVP CTA.",
    requiresListing: true,
    supportsLanguage: true,
    estimatedChars: 240,
    build: (ctx) => {
      const l = ctx.listing;
      const date = ctx.eventDate ?? "this Saturday at 10:00 AM";
      return `🏡 OPEN HOUSE INVITATION

${l?.title ?? "Our newest listing"}
${l?.location ?? "Premium location"}
${date}

Walk through ${(l as any)?.bedroomCount ? `${(l as any).bedroomCount} spacious bedrooms` : "every room"}, ask questions, get a feel for the home before you decide. Light refreshments served.

RSVP by reply — limited slots.`;
    },
  },
  "Investment Pitch": {
    type: "Investment Pitch",
    description: "Investor-focused pitch with yield, ROI, and exit framing.",
    requiresListing: true,
    supportsLanguage: false, // investors prefer English by default
    estimatedChars: 460,
    build: (ctx) => {
      const l = ctx.listing;
      const price = l ? l.price : 5_000_000;
      const estRentalAnnual = Math.round(price * 0.07);
      const yieldPct = ((estRentalAnnual / price) * 100).toFixed(1);
      return `Investment Opportunity: ${l?.title ?? "Premium Property"}

Acquisition: ₱${(price / 1_000_000).toFixed(1)}M
Estimated annual rental: ₱${(estRentalAnnual / 1_000_000).toFixed(1)}M
Gross yield: ~${yieldPct}%
Location: ${l?.location ?? "high-demand neighborhood"} · strong appreciation curve over 5 years

Why this works:
· ${l?.propertyType ?? "Property"} demand in ${l?.location ?? "the area"} is outpacing supply
· Move-in ready — no rehab capex
· Multiple exit paths: hold-and-rent, flip in 18-24 months, or sell-back to developer

Open to discussing structure. I have the full underwriting available.`;
    },
  },
  "OFW Buyer Message": {
    type: "OFW Buyer Message",
    description: "Message tuned for overseas Filipino workers — remote-friendly framing.",
    requiresListing: false,
    supportsLanguage: true,
    estimatedChars: 360,
    build: (ctx) => {
      const name = ctx.buyer?.name?.split(/\s+/)[0] ?? "kabayan";
      return `Hi ${name}!

I understand you're abroad — buying a home from overseas is doable, and I've helped many OFW families through it. Here's what we can offer:

· Video walkthroughs and live FaceTime tours
· Reservation paperwork via DocuSign — sign from anywhere
· Pag-IBIG or in-house financing options available
· A trusted family member or attorney can represent you at signing

${ctx.listing ? `For ${ctx.listing.title}, I can schedule a video tour anytime that works for your timezone.` : "Send me your budget and preferences and I'll line up 2-3 strong matches."}

Talk soon!`;
    },
  },
  "Luxury Buyer Message": {
    type: "Luxury Buyer Message",
    description: "Premium-tone message for high-net-worth buyers.",
    requiresListing: true,
    supportsLanguage: false, // luxury defaults to English
    estimatedChars: 380,
    build: (ctx) => {
      const l = ctx.listing;
      const name = ctx.buyer?.name?.split(/\s+/)[0] ?? "";
      return `${name ? `Dear ${name},` : "Greetings,"}

I'd like to introduce ${l?.title ?? "a residence"} — a refined ${
        l?.propertyType ?? "home"
      } in ${l?.location ?? "an exceptional neighborhood"}, priced at ₱${
        l ? (l.price / 1_000_000).toFixed(1) : "X"
      }M.

What sets this property apart: refined finishes, considered architecture, and a setting that rewards privacy. Showings are by appointment, with discretion respected throughout.

I would be pleased to arrange a private viewing at your convenience.

With regards,
${ctx.agentName ?? "Your agent"}`;
    },
  },
};

// ----------------------------------------------------------------------------
// generateContentTemplate — sibling helper
// ----------------------------------------------------------------------------

/**
 * Generates a content template through the full pipeline:
 *   base = CONTENT_TEMPLATES[type].build(context)
 *   toned = applyShareTone(base, tone, options)
 *   translated = applyLanguage(toned, language, options)
 *
 * Composition over invention — reuses the EXISTING applyShareTone (5A)
 * and applyLanguage (3B) helpers. No new tone or language dispatchers.
 *
 * Sibling-helper pattern: generateContentTemplate sits alongside
 * generateShareMessage (5A) and applyTone (3B) — same family of "given
 * structured context, produce a styled message" but distinct I/O.
 * generateShareMessage takes a listing+buyer and produces a share-ready
 * outbound; generateContentTemplate takes a content type and produces a
 * styled template for any destination.
 */
export interface GenerateContentInput {
  type: ContentType;
  context: ContentContext;
  tone: Tone;
  language: Language;
}

export interface GenerateContentOutput {
  type: ContentType;
  destination: DestinationPlatform;
  text: string;
  charCount: number;
  /** Reasoning surface for UI transparency. */
  reasoning: {
    templateType: ContentType;
    tone: Tone;
    language: Language;
    supportsLanguage: boolean;
    requiresListing: boolean;
  };
}

export function generateContentTemplate(
  input: GenerateContentInput,
): GenerateContentOutput {
  const template = CONTENT_TEMPLATES[input.type];
  // Base build
  const base = template.build(input.context);
  // Tone shaping — compose with the existing applyShareTone helper.
  // applyShareTone returns a string directly.
  const buyerFirstName = input.context.buyer?.name?.split(/\s+/)[0];
  const toned = applyShareTone(
    {
      tone: input.tone,
      language: "English",
      body: base,
    } as any,
    input.tone,
    { buyerFirstName },
  );
  const tonedText = typeof toned === "string" ? toned : base;
  // Language translation — only when the template supports it
  const finalText = template.supportsLanguage
    ? applyLanguage(tonedText, input.language, {
        buyerFirstName,
      })
    : tonedText;
  return {
    type: input.type,
    destination: destinationForContentType(input.type),
    text: finalText,
    charCount: finalText.length,
    reasoning: {
      templateType: input.type,
      tone: input.tone,
      language: input.language,
      supportsLanguage: template.supportsLanguage,
      requiresListing: template.requiresListing,
    },
  };
}
