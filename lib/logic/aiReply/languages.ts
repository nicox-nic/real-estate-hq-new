/**
 * Language System for AI Replies
 *
 * Three languages per PRD: English / Tagalog / Cebuano.
 *
 * Translations are PRE-TEMPLATED, not real LLM calls — the prototype demo
 * needs deterministic outputs for verify-locking. The native-speaker audit
 * (especially for Cebuano nuance) is explicitly deferred to Session 9 polish.
 *
 * Language vocabulary markers (verify locks these):
 *   - English: no po, no opo, no Cebuano openers; uses "Hi"/"Hello"/"Dear"
 *   - Tagalog: po appears, Kumusta opener, Salamat sign-off
 *   - Cebuano: NEVER uses po; Maayong opener, Salamat (shared, distinctive in context)
 *
 * Architecturally identical to tones.ts: dispatcher → per-language shaper.
 * Tones and languages are coordinate axes — both apply independently and
 * compose at the call site.
 */

export type Language = "English" | "Tagalog" | "Cebuano";

export const ALL_LANGUAGES: Language[] = ["English", "Tagalog", "Cebuano"];

/**
 * Vocabulary markers per language. Public so verify can lock them.
 * Each entry lists at least one phrase that MUST appear in the corresponding
 * language's output, and (in the negative list) a phrase that MUST NOT.
 *
 * The MUST_NOT lists are what enforce Tagalog ≠ Cebuano: po appears in
 * Tagalog and never in Cebuano (correct usage), Maayong appears in Cebuano
 * and never in Tagalog (Tagalog uses Kumusta), etc.
 */
export const LANGUAGE_MARKERS: Record<
  Language,
  { must: string[]; mustNot: string[] }
> = {
  English: {
    must: [],
    mustNot: ["po", "Maayong", "Kumusta"],
  },
  Tagalog: {
    must: ["po", "Kumusta"],
    mustNot: ["Maayong"],
  },
  Cebuano: {
    must: ["Maayong"],
    // Cebuano does not use po (that's Tagalog) — common error to guard against.
    mustNot: [" po ", " po,", " po."],
  },
};

/**
 * Apply a language transform. Operates on already-toned text — wraps the
 * English text with a localised opener/closer rather than translating
 * sentence-by-sentence (prototype-honest; full per-sentence translation is
 * Session 9 polish).
 *
 * The English path is the identity transform; Tagalog/Cebuano wrap the
 * already-toned body in a localised greeting and sign-off.
 */
export function applyLanguage(
  englishText: string,
  language: Language,
  opts: { buyerFirstName?: string } = {},
): string {
  const name = opts.buyerFirstName ?? "there";
  switch (language) {
    case "English":
      return englishText;
    case "Tagalog":
      return wrapTagalog(englishText, name);
    case "Cebuano":
      return wrapCebuano(englishText, name);
  }
}

function wrapTagalog(englishText: string, name: string): string {
  // Strip the existing English greeting if present (Hi/Hello/Good/Dear).
  const stripped = stripCommonGreeting(englishText);
  const opener = `Kumusta, ${name} po!`;
  const closer = "Salamat po sa inyong tiwala — abangan ko ang inyong sagot.";
  return `${opener} ${stripped} ${closer}`;
}

function wrapCebuano(englishText: string, name: string): string {
  const stripped = stripCommonGreeting(englishText);
  const opener = `Maayong adlaw, ${name}!`;
  const closer = "Salamat kaayo — hinaut nga makatabang ni nimo.";
  return `${opener} ${stripped} ${closer}`;
}

/**
 * Strip a common English-style greeting from the start of a reply so we can
 * replace it with a localised one. Conservative — only matches the openers
 * that the tone shapers actually produce.
 */
function stripCommonGreeting(text: string): string {
  // Matches: "Hi X!", "Hi X.", "Hello X.", "Good day, X.", "Dear X,"
  return text.replace(/^(Hi|Hello|Good day|Good morning|Dear)[^.!,]*[.!,]\s*/i, "");
}
