# Real Estate HQ — LLM Integration Notes

This document captures the four AI surfaces in the prototype that would
benefit from real Claude API calls in production. Each entry describes
the current deterministic implementation, the recommended Claude API
integration shape, and the swap-in approach.

The prototype's design discipline ensures these are **swap-in upgrades**,
not rewrites: every AI surface has a pure-function module behind it,
and the UI calls a thin wrapper that returns a structured result. The
LLM hookup replaces the module's body without changing its signature.

---

## 1. AI Reply Suggester (Session 3B)

**Where:** `/agent/leads/[id]` Buyer Conversation surface.

**Current implementation:**
`lib/logic/aiReply/suggester.ts` exports `suggestReply(input)` which
returns a `ReplyDraft` with `{ body, tone, language, reasoningRules }`.
The current logic is **keyword routing** — `TONE_MARKERS` declarative
table + per-tone templated bodies + applyLanguage dispatcher for
Tagalog/Cebuano translation. Reasoning rules are surfaced in the UI as
small chips (e.g., "matches buyer category: OFW Buyer", "responds to
financing question").

**Claude API integration shape:**
```ts
// Anthropic SDK
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 600,
  system: `You are a real estate sales assistant. Generate a reply to the
    buyer's most recent message. Match the requested tone: {tone}.
    Output language: {language}.
    Available context: buyer profile, conversation history, listing details.
    Constraints: max 4 sentences, professional but warm, no false promises
    on prices or availability.`,
  messages: [
    { role: "user", content: JSON.stringify(replyContext) },
  ],
});
```

The structured `replyContext` should include buyer's last 3-5 messages,
buyer profile (budget, location preferences, OFW status), the selected
listing's relevant fields, and the agent's preferred tone. The output
is a plain string body; the existing `TONE_MARKERS` table can be reused
as a **verification step** to confirm Claude's output matches the
requested tone before showing it to the agent.

**Swap-in approach:**
Replace the body of `suggestReply()`. The signature stays the same.
The UI continues to render the same `ReplyDraft` shape. Reasoning rules
remain useful as transparency surfaces — Claude's response can include
a structured `reasoning` field via prompt engineering.

**Risk if not done:** templated replies feel formulaic over many buyers.
Production value: ~30% higher reply quality, especially for nuanced
buyer questions outside the rule table's coverage.

---

## 2. Content Studio Templates (Session 8B)

**Where:** `/agent/content-studio` AI Content Studio.

**Current implementation:**
`lib/logic/contentTemplates.ts` exports `CONTENT_TEMPLATES` registry +
`generateContentTemplate({type, context, tone, language})`. The current
logic is **templated string assembly** — each `ContentType` has a
`build(ctx)` function that returns a base template; `applyShareTone` +
`applyLanguage` shape it.

**Claude API integration shape:**
```ts
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 800,
  system: `You are a real estate marketing copywriter. Generate a {type}
    for the listing below. Tone: {tone}. Language: {language}.
    Platform: {destinationPlatform}.
    Match the platform's conventions (hashtags for IG, hooks for TikTok,
    formal greeting for Email, etc.).
    Output ONLY the content, no preamble.`,
  messages: [
    {
      role: "user",
      content: `Listing: ${JSON.stringify(listing)}\nBuyer context: ${JSON.stringify(buyer)}`,
    },
  ],
});
```

**Swap-in approach:**
Replace the body of `generateContentTemplate()`. The 12 ContentType
entries become **prompts** instead of templates — the `build(ctx)`
function becomes a `prompt(ctx)` function that builds a system prompt
specific to that content type. The destination platform mapping remains
the same. The 4-pronged tone × language verification can run **after**
the LLM call as a quality gate (re-prompt if Tagalog output doesn't
contain "po"; re-prompt if Professional Broker output is too casual).

**Risk if not done:** generated content is templated and predictable.
Production value: highest impact upgrade — content variety + voice
match is the core value prop of "AI Content Studio."

---

## 3. AI Agent Recommendation (Session 7B)

**Where:** `/broker/listings/[id]/distribute` and
`/realtor/listings/[id]/distribute`.

**Current implementation:**
`lib/logic/agentRecommendation.ts` exports `AGENT_RECOMMENDATION_RULES`
declarative table + `scoreAgentForListing(agent, listing, deals)` pure
function. 8 rules with weighted contributions; output is a match
percentage + fired rule names. Rule-based scoring is **intentionally
interpretable** — the broker can see exactly why each agent was
recommended.

**Claude API integration shape:**
**Hybrid recommended.** Keep the rule-based score as the primary
ranking signal (interpretability matters for trust); add a Claude
"judgment layer" that re-ranks the top N candidates based on softer
signals the rules can't capture.

```ts
// Step 1: rule-based scoring (current implementation)
const rankedByRules = recommendAgentsForListing({ listing, agents, deals });

// Step 2: LLM re-ranks top 10 candidates
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 800,
  system: `You are a real estate operations advisor. Re-rank the candidate
    agents for this listing distribution. Consider rule-based scores AND
    softer signals: recent client mix, communication style fit, geographic
    proximity nuances. Output a JSON array of {agentId, finalRank, reasoning}.`,
  messages: [
    {
      role: "user",
      content: JSON.stringify({
        listing,
        candidates: rankedByRules.slice(0, 10),
        recentDealsContext,
      }),
    },
  ],
});
```

**Swap-in approach:**
Add a `reRankRecommendations()` function in the same module. The UI
shows both rankings (rule-based + LLM-adjusted) when they differ, with
the LLM's reasoning surfaced as an additional chip. The architectural
discipline (interpretable rules first, LLM judgment second) keeps trust
high.

**Risk if not done:** rule-based scoring can miss soft fit (a top
performer who happens to be on vacation; an agent specializing in
"investment" who actually prefers end-user buyers).
Production value: medium — rule-based is already production-quality;
LLM adds polish for edge cases.

---

## 4. AI Coaching Banner (Session 7B)

**Where:** `/broker/agents/[id]` and `/realtor/agents/[id]` Agent Profile.

**Current implementation:**
`components/manager/AgentProfile.tsx` computes the weakest health
component and renders a hardcoded coaching template keyed by component
label (e.g., "Alyssa has unattended leads. Recommend a daily 30-minute
lead-outreach block..."). Rule-driven; 6 templates total.

**Claude API integration shape:**
```ts
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 400,
  system: `You are a real estate team coach. Generate a specific,
    actionable coaching recommendation for an agent based on their
    performance breakdown. Address the weakest component. Be specific
    about what action to take this week. Keep it 2-3 sentences.
    Avoid generic advice ("work harder", "follow up more").`,
  messages: [
    {
      role: "user",
      content: JSON.stringify({
        agent: { name, role, specializations },
        healthBreakdown,
        weakestComponent,
        recentDeals,
        recentSiteVisits,
      }),
    },
  ],
});
```

**Swap-in approach:**
Replace the body of `generateCoachingMessage()` with the LLM call. The
UI continues to render the same `data-driven-by` attribute (which
component triggered) — the LLM's output becomes the coaching text, but
the rule (weakest component) is still the trigger. Same transparency
contract.

**Risk if not done:** coaching messages feel generic after 2-3 agents.
Production value: medium-high — coaching specificity directly affects
agent uptake.

---

## Surfaces NOT requiring LLM hookup

These work fine with the current deterministic logic:

- **AI Listing Search (4B)** — `SEARCH_RULES` table handles natural-
  language search. LLM could help with very-loose queries but rule-
  based is sufficient for the demo's scope.
- **Share Message Generation (5A)** — templated buyer-personalized
  message. The 5A reviewer approved the current shape; LLM is
  optional polish.
- **AI Briefing Card on Dashboard (3A)** — single-paragraph greeting
  summary. Templated assembly works fine; LLM would add ~5% variety
  but isn't core value.
- **File Recommendation (5B)** — keyword-routed file suggestions based
  on buyer's latest question. Rule-based is interpretable and works.
- **Next Action Suggestions on Deal Pipeline (5C)** — `NEXT_ACTION_RULES`
  table maps stage to suggested action. Rule-based is correct;
  predictability matters here.

---

## Implementation order (recommended)

If integrating Claude API one surface at a time, do them in this order:

1. **Content Studio** (highest impact, lowest risk — content quality is
   the core value prop)
2. **AI Reply Suggester** (high impact, medium risk — replies are
   user-facing and need quality guardrails)
3. **AI Coaching Banner** (medium impact, low risk — internal-facing,
   manager-only)
4. **AI Agent Recommendation** (medium impact, medium risk — only as
   re-rank layer over rule-based, never replacing it)

Each surface's signature is preserved; the UI doesn't change. The verify
suite's section-22 assertions continue to lock structural correctness
(tone × language coverage, registry totality, etc.) — LLM output passing
through the existing `applyLanguage` + tone markers still satisfies the
4-pronged structural proofs.

---

## Cost envelope

Rough monthly estimates assuming 100 active agents, each generating
~20 AI calls/day:

- Content Studio: ~600K input + ~300K output tokens/month → ~$15-25
- AI Reply: ~400K input + ~150K output → ~$10-18
- AI Coaching: ~50K input + ~30K output → ~$1-3
- Agent Rec re-rank: ~80K input + ~40K output → ~$2-4

Total: ~$30-50/month for 100 agents, ~$0.30-0.50 per agent/month. Well
within SaaS pricing margins.
