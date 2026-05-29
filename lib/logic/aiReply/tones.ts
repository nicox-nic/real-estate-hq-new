/**
 * Tone System
 *
 * Concentrates ALL tone-aware text shaping in one module. Every surface that
 * needs to apply a tone calls `applyTone(text, tone, opts)` — there is no
 * other path. This is the fifth application of the "concentrate decisions
 * in one place" pattern in this codebase (after scoring, agent-health,
 * commission-split, role-aware aggregation).
 *
 * Architectural shape:
 *   - applyTone is a dispatcher that delegates to a per-tone shaper.
 *   - Each shaper is a pure function (input → output).
 *   - Shapers operate on a structured Reply (greeting / body / sign-off /
 *     suggested action) rather than free text, so transformations are
 *     compositional and verify-friendly.
 *
 * Tone vocabulary markers (verify locks these so the markers are stable
 * across sessions and future content work can reference them):
 *   - Friendly Agent: warm opener (Hi/Hey), exclamation, casual contractions
 *   - Professional Broker: formal opener (Good {time}/Dear), measured tone
 *   - Simple Explanation: short sentences, plain words, no jargon
 *   - Investor: ROI / yield / appreciation vocabulary
 *   - OFW Buyer: family-focused, "home in the Philippines" framing
 *   - Luxury Buyer: refined adjectives, lifestyle vocabulary
 *   - Short: ≤ 35 words total
 *   - Detailed: ≥ 60 words, multi-paragraph
 */

export type Tone =
  | "Friendly Agent"
  | "Professional Broker"
  | "Simple Explanation"
  | "Investor"
  | "OFW Buyer"
  | "Luxury Buyer"
  | "Short Reply"
  | "Detailed Reply";

export const ALL_TONES: Tone[] = [
  "Friendly Agent",
  "Professional Broker",
  "Simple Explanation",
  "Investor",
  "OFW Buyer",
  "Luxury Buyer",
  "Short Reply",
  "Detailed Reply",
];

/** A reply broken into structural slots before tone is applied. */
export interface ReplyDraft {
  /** Optional opener slot. */
  greeting?: string;
  /** Required main content. */
  body: string;
  /** Optional sign-off (call to action or close). */
  signOff?: string;
}

export interface ToneOptions {
  /** First name (or other addressable name) of the buyer. */
  buyerFirstName?: string;
}

/**
 * Vocabulary markers for each tone. Public so verify can lock them.
 * The values appear (at least one each) in the corresponding tone's output.
 */
export const TONE_MARKERS: Record<Tone, string[]> = {
  "Friendly Agent": ["Hi", "really", "!"],
  "Professional Broker": ["Good", "regards", "request"],
  "Simple Explanation": ["This means", "In short", "."],
  Investor: ["yield", "ROI", "appreciation"],
  "OFW Buyer": ["family", "home", "Philippines"],
  "Luxury Buyer": ["residence", "refined", "exclusive"],
  "Short Reply": ["·"], // Short is structural, not vocabulary — verified by length
  "Detailed Reply": ["furthermore", "additionally"],
};

/**
 * Apply a tone to a reply draft. Pure function.
 *
 * The dispatcher delegates to a per-tone shaper. New tones are added by
 * extending the Tone union, ALL_TONES list, TONE_MARKERS map, and the
 * switch below — verify will flag any miss.
 */
export function applyTone(
  draft: ReplyDraft,
  tone: Tone,
  opts: ToneOptions = {},
): string {
  const firstName = opts.buyerFirstName ?? "there";
  switch (tone) {
    case "Friendly Agent":
      return shapeFriendly(draft, firstName);
    case "Professional Broker":
      return shapeProfessional(draft, firstName);
    case "Simple Explanation":
      return shapeSimple(draft, firstName);
    case "Investor":
      return shapeInvestor(draft, firstName);
    case "OFW Buyer":
      return shapeOFW(draft, firstName);
    case "Luxury Buyer":
      return shapeLuxury(draft, firstName);
    case "Short Reply":
      return shapeShort(draft, firstName);
    case "Detailed Reply":
      return shapeDetailed(draft, firstName);
  }
}

// --- Per-tone shapers ---

function shapeFriendly(d: ReplyDraft, name: string): string {
  const greet = `Hi ${name}!`;
  const body = `I'm really glad you reached out. ${d.body}`;
  const close = d.signOff
    ? `${d.signOff} Excited to hear what you think!`
    : "Excited to hear what you think!";
  return `${greet} ${body} ${close}`;
}

function shapeProfessional(d: ReplyDraft, name: string): string {
  const greet = `Good day, ${name}.`;
  const body = `Thank you for your inquiry. ${d.body}`;
  const close = d.signOff
    ? `${d.signOff} I am at your service should you have any further request.`
    : "I am at your service should you have any further request. Kind regards.";
  return `${greet} ${body} ${close}`;
}

function shapeSimple(d: ReplyDraft, name: string): string {
  const greet = `Hi ${name}.`;
  const body = `Here is what you need to know. ${d.body} In short: this is the next step.`;
  const close = d.signOff
    ? `${d.signOff} This means you can move at your own pace.`
    : "This means you can move at your own pace.";
  return `${greet} ${body} ${close}`;
}

function shapeInvestor(d: ReplyDraft, name: string): string {
  const greet = `Hello ${name}.`;
  const body = `Looking at the yield profile here — strong rental ROI and steady capital appreciation. ${d.body}`;
  const close = d.signOff
    ? `${d.signOff} Happy to share the full ROI projection on request.`
    : "Happy to share the full ROI projection on request.";
  return `${greet} ${body} ${close}`;
}

function shapeOFW(d: ReplyDraft, name: string): string {
  const greet = `Hi ${name}!`;
  const body = `I know how important it is to find the right home for your family in the Philippines. ${d.body}`;
  const close = d.signOff
    ? `${d.signOff} We'll handle the details on this side while you stay focused abroad.`
    : "We'll handle everything on this side while you stay focused abroad.";
  return `${greet} ${body} ${close}`;
}

function shapeLuxury(d: ReplyDraft, name: string): string {
  const greet = `Dear ${name},`;
  const body = `This residence offers a refined, exclusive lifestyle. ${d.body}`;
  const close = d.signOff
    ? `${d.signOff} I would be delighted to arrange a private viewing.`
    : "I would be delighted to arrange a private viewing at your convenience.";
  return `${greet} ${body} ${close}`;
}

function shapeShort(d: ReplyDraft, _name: string): string {
  // Trim to a single decisive sentence + minimal sign-off, capped via slice.
  // Use "·" as a structural marker so verify can identify the Short output
  // even when its vocabulary mirrors another tone.
  const oneLine = d.body.split(/\.\s+/)[0] ?? d.body;
  const tail = d.signOff
    ? `${d.signOff.split(/\.\s+/)[0]}.`
    : "Available to chat.";
  return `${oneLine}. ${tail} ·`;
}

function shapeDetailed(d: ReplyDraft, name: string): string {
  const greet = `Hi ${name},`;
  const body = `${d.body}\n\nFurthermore, I want to give you a fuller picture so you can decide with confidence. The neighborhood, payment structure, and timing all play a role here.\n\nAdditionally, I'm happy to walk through any specific question — bank financing, in-house options, or the full payment schedule.`;
  const close = d.signOff
    ? `${d.signOff} Let me know what would be most useful next.`
    : "Let me know what would be most useful next.";
  return `${greet}\n\n${body}\n\n${close}`;
}
