/**
 * applyShareTone — outbound-share variant of applyTone.
 *
 * Same Tone union as aiReply (reuse), but the per-tone shaping is calibrated
 * for OUTBOUND messages (sharing a listing with a buyer) rather than
 * REPLIES to inbound buyer messages.
 *
 * Why a sibling rather than a context-arg overload on applyTone:
 *   - Single-responsibility helpers compose better. applyTone answers
 *     "how does THIS REPLY phrase itself in tone X." applyShareTone answers
 *     "how does THIS OUTBOUND share phrase itself in tone X." Different
 *     question; different opener boilerplate; different sign-off.
 *   - The reply variant inserts phrases like "Thank you for your inquiry"
 *     and "I'm really glad you reached out" — appropriate to inbound
 *     context but wrong for outbound shares.
 *   - The share variant honors a pre-set greeting from the share-message
 *     generator. The reply variant rebuilds the greeting from buyerFirstName.
 *
 * Markers + language application reuse the aiReply infrastructure verbatim.
 * This is the carry-forward from Session 4B's framing — "Refine sheet
 * pattern composed directly from 3B or needed adjustment." Adjustment.
 *
 * Verify locks the shared TONE markers AND the share-specific opener phrases
 * being absent (no "Thank you for your inquiry" in outbound).
 */

import type {
  ReplyDraft,
  Tone,
  ToneOptions,
} from "@/lib/logic/aiReply/tones";

/** Markers that must appear in outbound share output for each tone.
 *  Subset of the aiReply TONE_MARKERS — share-specific markers may differ. */
export const SHARE_TONE_MARKERS: Record<Tone, string[]> = {
  "Friendly Agent": ["!"],
  "Professional Broker": ["regards"],
  "Simple Explanation": ["short"],
  Investor: ["yield"],
  "OFW Buyer": ["Philippines"],
  "Luxury Buyer": ["refined"],
  "Short Reply": ["·"],
  "Detailed Reply": ["additionally"],
};

/**
 * Phrases that the REPLY variant inserts but the SHARE variant must NOT
 * include (because they imply prior inbound contact).
 */
export const SHARE_FORBIDDEN_PHRASES = [
  "Thank you for your inquiry",
  "I'm really glad you reached out",
  "I'm glad you reached out",
];

export function applyShareTone(
  draft: ReplyDraft,
  tone: Tone,
  opts: ToneOptions = {},
): string {
  const firstName = opts.buyerFirstName ?? "there";
  // Always assemble a tone-appropriate greeting. Outbound shares regenerate
  // per tone — when the user picks a different tone in the Refine sheet,
  // the greeting style matches the new tone.
  const greeting = defaultGreeting(tone, firstName);

  switch (tone) {
    case "Friendly Agent":
      return `${greeting} ${draft.body}${draft.signOff ? " " + draft.signOff : ""}`;
    case "Professional Broker":
      return `${greeting} ${draft.body} Kind regards.${draft.signOff ? " " + draft.signOff : ""}`;
    case "Simple Explanation":
      return `${greeting} ${draft.body} In short: this property could be a good match — happy to walk you through it.${draft.signOff ? " " + draft.signOff : ""}`;
    case "Investor":
      return `${greeting} ${draft.body} The yield outlook and ROI are worth a closer look.${draft.signOff ? " " + draft.signOff : ""}`;
    case "OFW Buyer":
      return `${greeting} ${draft.body} The process can be handled remotely while you're outside the Philippines.${draft.signOff ? " " + draft.signOff : ""}`;
    case "Luxury Buyer":
      return `${greeting} ${draft.body} The refined finishes and exclusive amenities reflect the level you're looking for.${draft.signOff ? " " + draft.signOff : ""}`;
    case "Short Reply":
      return `${greeting} ${condense(draft.body)}`;
    case "Detailed Reply":
      return `${greeting} ${draft.body} Additionally, I can prepare a side-by-side comparison with other matching options if you'd like.${draft.signOff ? " " + draft.signOff : ""}`;
  }
}

function defaultGreeting(tone: Tone, firstName: string): string {
  switch (tone) {
    case "Professional Broker":
      return `Good day, ${firstName}.`;
    case "Luxury Buyer":
      return `Good day, ${firstName},`;
    case "Investor":
      return `Hi ${firstName},`;
    default:
      return `Hi ${firstName}!`;
  }
}

/**
 * Condense to a single short sentence — Short Reply variant.
 * Takes a body of "sentence1. sentence2. sentence3." and keeps the first
 * sentence plus the closer "·"-marked CTA.
 */
function condense(body: string): string {
  const sentences = body.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  const first = sentences[0] ?? body;
  return `${first} · Want details?`;
}
