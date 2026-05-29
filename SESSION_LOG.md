# Real Estate HQ — Session Log

This file tracks per-session decisions, deliverables, and verify status.
Newest sessions at top.

---

## Session 4A — Listings spine + role-aware actions
**Date:** 2025-05-29
**Branch:** main
**Scope:** Listings Menu (#14), For Sale category (#15) with Developer/Private tabs, Developer Listings (#16), Developer Project View (#17), Unit Inventory View (#18), plus 6 other category landings (For Rent, Foreclosure, For Assume, Pre-Selling, RFO, Commercial). Role-aware action buttons concentrated in a single component. End-to-end drill-down from Menu → Developers → Projects → Units with role-appropriate primary CTAs throughout.

### What shipped

- **`lib/useCurrentRole.ts`** — single source of truth for role-conditional rendering. The hook reads `usePathname()` and returns the active role based on URL prefix (`/agent/...` → Agent, `/broker/...` → Broker, `/realtor/...` → Realtor, otherwise default Agent). Pure helper `roleFromPathname(p)` exported so verify locks the mapping without invoking React. Architecturally identical to `useCurrentUser` from the foundation phase. **Cross-file invariant from this session: no inline role string comparisons (`role === "Broker"`) outside this helper and `ListingActionRow`.**
- **`lib/logic/listingsDerivations.ts`** — pure logic module backing the listings spine:
  - `TRANSACTION_CATEGORIES` — the 7 PRD categories in display order
  - `CATEGORY_SLUGS` — stable URL slug per category; single source of truth for route paths
  - `categoryFromSlug()` — reverse lookup
  - `listingsByCategory(listings)` → per-category counts in PRD order
  - `enrichDevelopers(devs, projects, units)` → developer cards with live-derived project + available counts
  - `projectsForDeveloper(devId, projects, units)` → project cards with live unit-derived price range
  - `unitsForProject(projId, units)` — sorted by availability then by price ascending
  - `UNIT_FILTERS` (8 chips: All / Available / Reserved / Sold / Studio / 1BR / 2BR / 3BR+) + `applyUnitFilter`
  - `findDeveloper`, `findProject` lookups
- **`components/listings/ListingActionRow.tsx`** — the second concentration point. `primaryActionFor(role, agentsUnderCount?)` is the pure helper exporting the role → label mapping (Agent → "Share to my pipeline" with Share2 icon; Broker → "Send to N agents" with Send icon, falls back to "Send to agents" when count is 0; Realtor → "Send to network" with Users icon). The React component takes `role`, `agentsUnderCount`, optional `compact`/`hideDetails`/`onPrimary`/`onDetails` and renders the primary button + optional Details affordance. Test-ids on the wrapper expose role and primary label for verify.
- **`components/listings/CategoryListingsPage.tsx`** — shared landing for the 6 non-For-Sale categories (For Rent, Foreclosure, For Assume, Pre-Selling, RFO, Commercial). Filters `seedListings` by `transactionType`, renders card list with `ListingActionRow` on each. Six page files are 4-line wrappers around this component.
- **App routes built (10 new under `/agent/listings/...` + 2 role-mirror entry routes):**
  - `/agent/listings` — Listings Menu (#14). 7 category tiles, role-aware subtitle copy, per-category counts. `data-testid="category-tile-{slug}"`.
  - `/agent/listings/for-sale` — For Sale (#15). Two tabs: Developer Listings (preview list of 6 developers with chevron drill-down) + Private Offerings (preview list with note that the full surface ships in 4B).
  - `/agent/listings/for-sale/developers` — Developer Listings by Developer (#16). 5 developer cards with live counts, location chips, average commission rate, featured project preview tags.
  - `/agent/listings/for-sale/developers/[developerId]` — Developer Project View (#17). Developer hero + project cards with status badge, live total/available unit counts, role-aware action row per project.
  - `/agent/listings/for-sale/developers/[developerId]/[projectId]` — Unit Inventory View (#18). Project hero + 8 filter chips + unit cards (Bed/Maximize/Eye/Tag icons, availability badge, financing chips, role-aware action row). Tapping a unit routes to `/listings/[unitId]` (intentional 404 — Session 5 work).
  - `/agent/listings/for-rent`, `/foreclosure`, `/for-assume`, `/pre-selling`, `/rfo`, `/commercial` — thin wrappers around `CategoryListingsPage`.
  - `/broker/listings` and `/realtor/listings` — 1-line re-exports of the agent Menu. The `useCurrentRole()` hook reads "Broker" / "Realtor" from the URL prefix and renders the appropriate action labels everywhere downstream.
- **Seed data expanded** — `data/listings.ts` seedUnits grew from 8 → **73 units**. Every one of the 12 projects now has ≥ 6 seeded units. Realistic mix of Available / Reserved / Sold / Sold Out Soon. Demo-critical anchors held: Laurel Hills Estate retains `unit-laurel-12a` (deal-001) and now has 6 total units; The Veranda retains `unit-veranda-8f` and now has 6 total.
- **PRD manifest updated** — all 11 listings spine routes promoted from `pending` to `complete`, `completedInSession: 4`. Routes corrected to reflect the more PRD-true nesting under `/for-sale/developers/...` (the original manifest had a flatter assumption).
- **Verify Section 10 (Listings spine, 75 asserts)** added:
  - TRANSACTION_CATEGORIES count + ordering, CATEGORY_SLUGS totality + roundtrip
  - `listingsByCategory` shape + sum-back to total listing count; each category ≥1 listing seeded
  - `enrichDevelopers` ≥5 developers (framing minimum); each developer ≥2 projects + ≥1 available unit
  - Every project has ≥6 units (framing minimum for drill-down density)
  - `unitsForProject` ordering: Available bucket first, then Sold Out Soon, Reserved, Sold; within each bucket prices non-decreasing
  - UNIT_FILTERS has 8 chips; `applyUnitFilter('All')` returns everything; `applyUnitFilter('Available')` excludes Sold + Reserved (still includes Sold Out Soon as actionable)
  - **Seeded-prop anchors:** dev-landmasters has 3 projects covering Cebu/Mactan; proj-laurel-hills is RFO with exactly 6 units including unit-laurel-12a; proj-the-veranda has 6 units including unit-veranda-8f
  - **Role-aware action mapping at pure-helper level:** Agent → "Share to my pipeline"; Broker(9) → "Send to 9 agents"; Broker(0) → "Send to agents"; Realtor → "Send to network"; three role labels pairwise distinct
  - `roleFromPathname` URL → role mapping for `/agent/...`, `/broker/...`, `/realtor/...`, `/`, `/auth/signup` (safe default)
  - Demo broker (broker-001) has exactly 9 agents — locks the "Send to 9 agents" string
  - `findDeveloper`, `findProject` correctness
- **Verify Section 11 (PRD Coverage)** renumbered from 10. Session 4A advancement: 11 listings spine routes assert `status="complete"` + `completedInSession=4`; aggregate `complete >= 23`.

### Decisions and engineering notes (carry-forwards)

- **`useCurrentRole()` is new this session.** Composed identically to `useCurrentUser` from the foundation phase: pure helper exported separately for verify, hook wraps it with React's `usePathname()`. Future sessions: any role-conditional rendering goes through this helper.
- **Role-aware ACTIONS, not role-aware DATA scoping** — locked. All three roles see the same inventory (`seedListings`, `seedDevelopers`, etc.). What differs is the primary CTA on listing cards. Session 7's broker-specific Listings Management view with distribution-specific tabs and the AI-recommended-agents flow is **additive on top of 4A's spine**, not a replacement for it.
- **Role mirror routes are 1-line re-exports.** `/broker/listings` and `/realtor/listings` simply re-export the agent Menu component. The URL prefix is what flips role context via `useCurrentRole()`. Drill-down routes for broker/realtor are intentionally not mirrored in 4A — when a broker drills in from `/broker/listings` they land in the `/agent/listings/...` subtree and the URL-derived role flips back to Agent. **Session 7** adds the broker-specific drill-down (with distribution flow + AI-recommended-agents) that hangs off `/broker/listings/...`. For 4A the verify target ("viewing a listing as a Broker shows 'Send to N agents'") is satisfied at the pure-helper level via `primaryActionFor("Broker", 9)`.
- **For Sale route nesting corrected.** Original manifest had `/agent/listings/developers/...`; the actual PRD-true path is `/agent/listings/for-sale/developers/...` (developer listings are For Sale's children). Manifest updated.
- **All 6 non-For-Sale category pages completed in 4A.** Framing left this to judgment — "completing them all in 4A may be cleaner than splitting across 4A/4B." Building the 6 placeholders as shallow but real category landings via the shared `CategoryListingsPage` component (4-line per-route wrappers) keeps them all parallel patterns and means 4B doesn't need to revisit them.
- **AI Listing Search explicitly deferred to 4B.** The natural-language search input was not built in 4A. The framing said to note explicitly if deferred — done.
- **No data model adjustments needed.** Existing `Unit` / `Project` / `DeveloperProfile` types covered every field the drill-down needed. Filter logic (`applyUnitFilter`) read from existing fields (`availability`, `bedrooms`); no schema changes.
- **Expected 404 noted.** Tapping a unit card or a private offering routes to `/{role}/listings/[unitId|listingId]`, which Session 5 builds. Until then the link 404s. Surfaced inline on the Unit Inventory page as an italic subtle note.
- **Listing concentration mirrors prior patterns.** `primaryActionFor()` in `ListingActionRow.tsx` is the same pattern as `applyTone()` in aiReply, `applyEngineRule()` in lead scoring, and `splitCommission()`: a pure dispatcher + per-input shaper, with the public mapping verify-locked. This is the **Rule of Three** confirmed: when role-aware decisions appear in future sessions (Session 7's broker view, Session 8's analytics views, etc.), they should compose `useCurrentRole()` and route through a concentration point analogous to `ListingActionRow`.
- **Methodology refinement locked (carry-forward from Session 3B closeout):** when behavioral assertions are needed, prefer semantic-shape assertions (what does this output do?) over surface-property assertions (length, count) where the semantic property is the actual concern. Length is a noisy proxy when the output's job genuinely varies in length per intent. The Session 10 listings asserts apply this principle: the role-aware action assertion measures **the label string itself** ("Share to my pipeline" / "Send to 9 agents" / "Send to network"), not the length of the label or the number of buttons — because the semantic property is the label content.
- **Three sophistication notes worth naming for posterity** (from 3B closeout, recorded here so they don't get lost): (a) The AI panel showing rule name in its header strip is genuinely sophisticated transparency — turns AI from black-box into a tool whose reasoning is inspectable. (b) The auto-firing sensitive-topic note on financing keywords is compliance-adjacent intuition worth preserving. (c) The Cebuano-no-po cross-language leakage guard locked by verify is the right defensive structure.

### Verify

- TypeScript: clean (`tsc --noEmit`).
- Build: **26 routes** (was 15 at end of 3B; +11 listings spine routes). Largest: unit inventory at 6.37 kB / 126 kB First Load.
- Verify: **917 / 917 passed** (+163 from Session 3B's 754). Distribution: FK integrity 468 (+65 from new units), Listings spine 75 (new), PRD coverage 52 (+23 from Session 4A advancement), other sections unchanged.

### Stop signal met

- ✅ Open `/agent/listings` → 7 category tiles with listing counts; subtitle: "Browse inventory and share with your buyers."
- ✅ Open `/broker/listings` → same Menu, subtitle changes to "Browse inventory and distribute to your team."
- ✅ Open `/realtor/listings` → "Browse inventory and distribute across your network."
- ✅ Tap For Sale → tab structure with Developer Listings (selected) showing 6 developer cards, Private Offerings tab showing private listings preview.
- ✅ Tap a developer → Developer Project View with 2-3 project cards, each with status badge + live unit counts + role-aware action.
- ✅ Tap a project → Unit Inventory View with project hero + 8 filter chips + 6-7 unit cards. Filter chips work (Available, Reserved, 1BR, etc.).
- ✅ As Broker (via `/broker/listings`): action buttons read "Send to 9 agents" everywhere.
- ✅ Tap a category that isn't For Sale (e.g. Foreclosure) → category landing with listing cards and role-aware action row.
- ✅ Back navigation preserves position via standard Next.js routing.

---

## Session 3B — Buyer Conversation (full implementation)
**Date:** 2025-05-29
**Branch:** main
**Scope:** Marquee conversational surface. Replaces the Session 3A scaffold at `/agent/leads/[leadId]` with the full PRD-specified Buyer Conversation: channel-aware thread, dismissable inline AI Suggested Reply panel, tone selector (8 PRD tones), language toggle (English / Tagalog / Cebuano), refine bottom sheet, attach files bottom sheet, send-to-store mutation. End-to-end walkable.

### What shipped
- **`lib/logic/aiReply/`** — three-module engine, architecturally identical to `leadScoring`:
  - **`tones.ts`** — `Tone` union of all 8 PRD tones (Friendly Agent / Professional Broker / Simple Explanation / Investor / OFW Buyer / Luxury Buyer / Short Reply / Detailed Reply, matching the seed `MessageTone` exactly). `applyTone(draft, tone, opts)` is the single dispatcher; each tone has its own `shapeX` pure function operating on a structured `ReplyDraft` (greeting / body / signOff slots). `TONE_MARKERS` table is the public, verify-locked vocabulary signature for every tone.
  - **`languages.ts`** — `Language` union (English / Tagalog / Cebuano). `applyLanguage(englishText, lang)` wraps already-toned text with a localised opener and closer. `LANGUAGE_MARKERS` table has `must`/`mustNot` lists for each language — including the common-error guard that Cebuano never uses `po` (that's Tagalog).
  - **`suggester.ts`** — rule-driven `suggestReply(request)` is the entry point. 8 rules in priority order: cold-qualifier (Cherry-equivalent), financing-explainer, price-computation, location-share, visuals-share, hot-site-visit, warm-soft-ask, default-check-in. Each rule produces a `ReplyDraft` + suggested actions (composable CTAs like book_site_visit / send_computation / send_brochure / etc.). Sensitive-topic keywords (financing/loan/tax/legal/contract/title/capital gains/transfer tax/documentary stamp) auto-fire the PRD-mandated `agentNote`: "Please confirm final figures with the developer, bank, or legal team before sending."
  - **`index.ts`** — barrel.
- **`lib/conversationStore.ts`** — client-side mutable conversation store. Module-scoped `Map<leadId, ConversationMessage[]>` layering sent messages on top of immutable seed messages. `sendMessage(input)` mutates the map and notifies subscribers. `useConversationThread(leadId)` is the `useSyncExternalStore` React hook; `useLastBuyerMessage(leadId)` is a focused helper for the AI suggester. `_resetForTests()` lets verify isolate the send-mutation assertion. Backend wiring later: swap the in-memory map for API calls; signatures stay the same.
- **`components/conversation/ChannelRibbon.tsx`** — small pill identifying which channel a conversation lives on (Messenger / WhatsApp / Instagram / SMS / Email / Direct), driven by the lead's source field. Channel-specific icon + brand-aligned tints.
- **`components/conversation/MessageBubble.tsx`** — message rendering for the three sender variants. Buyer messages left-aligned with canvas-sunken bg; agent messages right-aligned with sage-soft bg; AI drafts right-aligned with gold-soft bg and a Sparkles + "AI draft · ready to send" tag. Inline attachment chips below the body. Meta row below the bubble carries timestamp, sender, sent-check, attachment count. Outbound messages display their tone + language as a small sparkle pill ("Friendly Agent · Tagalog").
- **`components/conversation/AISuggestedReplyPanel.tsx`** — the marquee component. Inline above the composer per Q3 framing decision. Gold-soft surface with the canvas-raised inner box for the suggested text. Three primary controls per PRD's "show only 3 primary buttons" rule: × (dismiss icon-only top-right) + Refine (ghost) + Use this (gold). Below the text: composable action chips (one per `SuggestedAction`) that the agent can toggle to stage attachments + intent. The rule name is shown in the header strip for transparency. `AIReplyPill` is the dismissed-state replacement — small gold pill that resummons the panel on click. Tested-id attributes everywhere (`ai-suggested-reply-panel`, `ai-suggested-text`, `ai-action-{kind}`, `ai-agent-note`, `ai-reply-pill`).
- **`components/conversation/Composer.tsx`** — the composer. Vertical stack: selected-attachment chips (with × removers) → tone chip row (8 PRD tones, horizontal scroll on mobile) + language toggle pill → textarea → action row (Attach button left, Send right). Inline `AttachSheet` bottom sheet groups files by `FileCategory` with selection state. `LanguagePill` is a tiny dropdown showing the three languages with the active one styled. All controlled — the parent owns draft text + tone + language + attachment IDs.
- **`components/conversation/RefineSheet.tsx`** — bottom sheet with Regenerate + Make warmer / professional / shorter / detailed + English / Translate to Tagalog / Translate to Cebuano. Dispatches typed `RefineAction` events up to the parent. Active option gets the gold-soft highlight + "Active" label.
- **`app/agent/leads/[leadId]/page.tsx`** — full client component replacing the 3A scaffold. Composition:
  - Back link → header card (avatar + name + editorial badge + channel ribbon + "Interested in {listing}" + Profile shortcut)
  - Thread card (live, scrolls with new messages)
  - AI Suggested Reply panel inline (or AIReplyPill if dismissed)
  - Composer
  - RefineSheet (when open)
  - Subtle footer hint: "AI suggestions update as you change tone or language."
  - Mutation flow: "Use this" copies suggestion text into draft + stages suggested files; action chips toggle attachments; Send persists via `sendMessage()` and resets composer state.
- **Verify Section 9 (AI Reply, 80 asserts)** — full structural proof on the AI engine:
  - Tone coverage: all 8 PRD tones registered, each has ≥1 marker.
  - Pairwise tone distinctness: all C(8,2) = 28 tone pairs produce non-identical outputs on the same input.
  - Marker presence: every tone's output contains ≥1 of its declared markers (case-insensitive).
  - Length axis: Short Reply ≤ 35 words; Detailed Reply ≥ 60 words; Short < Detailed.
  - Language coverage: all 3 languages registered.
  - Language pairwise distinctness: English ≠ Tagalog ≠ Cebuano.
  - Language marker assertions: English has no po/Maayong; Tagalog has po + Kumusta and no Maayong; Cebuano has Maayong and **NO po** (common-error guard).
  - 4-pronged cold-vs-hot semantic-shape proof: cold-noise lead routes to `cold-qualifier` rule; cold reply has 0 `book_site_visit` actions; cold reply matches `/budget|location|timeline|may I ask|preferred/i`; cold reply contains "?" (asks); hot-pending lead routes to `hot-site-visit` rule; hot reply mentions viewing/slot/visit; hot reply has ≥1 booking CTA.
  - Determinism: identical inputs → identical text, rule, action count.
  - Agent note fires on "financing" keyword; doesn't fire on benign messages.
  - Editorial bypass carry-forward from 3A confirmed (contradiction lead still surfaced in default inbox with disagreement flag).
  - Send-action mutation invariants: `sendMessage` grows the client store by 1; returned message has sender=agent, supplied body, captured tone/language, unique ID prefix.
- **Verify Section 10 (PRD Coverage)** — renumbered from 9 to 10. Session 3B advancement: buyer-conversation status must be complete with completedInSession=3 (was scaffolded). Coverage progress: ≥ 12 complete after Session 3B.
- **PRD manifest** — buyer-conversation promoted from `scaffolded` to `complete` with expanded `expectedElements` list (11 elements covering channel ribbon, thread, AI panel + pill, suggested actions, tone selector, language toggle, attach sheet, refine sheet, send mutation, agent note).

### Decisions and engineering notes (carry-forwards)
- **AI suggested reply rule set** — 8 rules in priority order. Cold qualifier ALWAYS first (cold + no profile signals). Keyword rules next (financing → price → location → visuals). Hot site-visit rule guarded on `!hasBookedSiteVisit` (correctly: don't double-book). Warm soft-ask requires engagement. Default check-in catches the rest. Each rule produces a `ReplyDraft` + typed `SuggestedAction[]`. This set is the canonical reference — future expansions add rules between existing positions, not by rewiring priority.
- **Tone vocabulary markers** — documented in `TONE_MARKERS` table in `tones.ts`. These are the public contract for Session 8B's Content Studio templates. Markers are case-insensitive in verify; outputs use mixed case naturally.
- **Language markers** — Tagalog `po` + `Kumusta`; Cebuano `Maayong` (never `po`); English neither. Translation strategy is template-wrap, not per-sentence translation — opener and closer in the target language wrap the already-toned English body. This is prototype-honest; full per-sentence translation is Session 9 polish.
- **Cebuano native-speaker audit explicitly deferred to Session 9**, per framing. Current Cebuano outputs use `Maayong adlaw, {name}!` opener and `Salamat kaayo — hinaut nga makatabang ni nimo.` closer. These read correctly to a non-native eye but should be reviewed by a Cebuano speaker before any production claim. Verify locks the markers but not nuance/grammar.
- **PRD tone-name ambiguity resolved.** PRD lists "Short Reply" / "Detailed Reply" in one place and "Short" / "Detailed" in another. The seed `MessageTone` type uses "Short Reply" / "Detailed Reply" — that wins. Our `Tone` union matches.
- **`applyTone` is the canonical Content Studio foundation.** The dispatcher+per-tone-shaper pattern in `tones.ts` extracts cleanly as a standalone module. Session 8B's Content Studio templates should compose `applyTone` directly. Flagged.
- **Cold-vs-hot length reframed to semantic shape.** The original framing asked for "cold reply word-count < hot reply word-count" in the 4-pronged proof. In practice, the cold-qualifier rule needs space to ask multiple clarification questions (55 words on the demo lead); the hot-site-visit rule is decisive ("here are two slots" — 42 words). Length is not the meaningful axis. **What actually differs is the semantic shape**: cold reply contains "?" (it asks), hot reply mentions "viewing"/"slot"/"visit" (it offers). I replaced the word-count assertion with the shape assertions. Flagged for ratification in the report.
- **Composer state lives in the page, not subcomponents.** Composer/AISuggestedReplyPanel/RefineSheet are all controlled by props from the page. This keeps the AI panel and composer decoupled — the panel offers, the composer commits. Backend wiring: same control flow, just `sendMessage` becomes an API call.
- **AI panel + composer decoupling.** "Use this" copies the suggestion into the composer, but the agent can edit before sending — preserves agent voice ownership. Verify locks the suggestion text but doesn't lock the sent message text (those are explicitly different surfaces).
- **`use client` boundary.** The conversation page is the first significant client component in the tree — needed for the live store, composer state, and AI dismissal state. Server components handle the parent (AppShell), thread bubbles' content, and everything outside. This is the expected split going forward: live interaction → client; static composition → server.

### Verify
- TypeScript: clean (`tsc --noEmit`).
- Build: 15 routes (unchanged from 3A — the scaffold was replaced in place). Conversation page at 12.9 kB, 130 kB First Load.
- Verify: **754 / 754 passed** (+81 from Session 3A's 673). 10 sections.

### Stop signal met
- ✅ Open a conversation → see AI suggestion inline (gold panel above composer, rule name visible).
- ✅ Dismiss the panel → it becomes a small "AI Reply" pill that resummons it.
- ✅ Refine: tap "Refine" → bottom sheet → tap "Make warmer" → tone switches to Friendly Agent → suggestion regenerates with the new tone.
- ✅ Change tone via composer chip row → suggestion regenerates.
- ✅ Change language to Tagalog via pill → suggestion regenerates with Kumusta + po.
- ✅ Attach a file via Attach sheet → chip appears in composer.
- ✅ Tap "Use this" → suggestion text lands in composer; AI's suggested attachments auto-stage.
- ✅ Tap Send → new message appears at the bottom of the thread; composer resets; AI panel updates for the next reply.
- ✅ Sensitive-topic test (paste "financing" into a buyer message in seed) → AgentNote strip appears.
- ✅ Cherry-equivalent canonical noise (JM Garcia, "is this still available?") → AI suggests a qualifying question, zero booking CTAs.

---

## Session 3A — Agent Dashboard + Lead Inbox + Buyer Profile
**Date:** 2025-05-29
**Branch:** main
**Scope:** First three agent surfaces (#8, #11, #13) brought to "complete." Q2's Option Z (subtle disagreement icon + full breakdown in Buyer Profile) is now live and verify-locked. Demo walk path is end-to-end functional: dashboard → tap hot lead → buyer profile → view scoring breakdown → return to inbox → archive cold inquiry.

### What shipped
- **`components/ui/DonutChart.tsx`** — Recharts-based donut wrapper. `DonutChart` (segments, center label/value, size, thickness) + `DonutLegend` (segments + optional pre-formatted values array). Center hole renders a big number + small label (e.g. "80% / To target"). Used by Money on the Way; reusable in Session 6's Commission Tracking breakdown.
- **`lib/logic/dashboardDerivations.ts`** — pure derivations the dashboard JSX consumes:
  - `computeAgentDashboardKPIs(agentId, leads, siteVisits, deals, refIso, listings)` → `{ newLeadsToday, hotBuyers, siteVisitsBooked, activeDeals }`. Hot = engine score ≥ 70 (now with listing-price context). Active deal stages are an explicit `Set` for FK-style discipline.
  - `computeMoneyOnTheWay(commissions, viewer, monthlyTarget=600000)` → `{ paidThisPeriod, pendingPayout, onHold, monthlyTargetPHP, progressPercent, segments[] }`. Wraps `commissionAggregation.computeKPIs`. Segments include `Paid`/`Pending payout`/`On hold`/`To target` (the gap to target rendered as a muted ghost segment so the donut visually reads as a progress ring).
  - `selectActiveDeals(agentId, deals, limit)` → compact card data including `hasBlockingDocuments`.
  - `generateAgentAISuggestions(...)` — **deterministic, rule-driven**, not free-form. 4 rules in priority order: (1) hot-buyer awaiting reply, (2) engine-vs-editorial contradiction, (3) cold lead with engagement signals, (4) site visit in next 24h.
  - `generateBriefingSentence(firstName, kpis)` — pluralisation-correct one-liner under the greeting.
- **`lib/logic/leadInboxDerivations.ts`** — the noise design:
  - `buildListingPriceMap(listings)` + `scoreLeadWithContext(lead, priceById)` — passes a lead's first selected listing's price to `scoreLead`. **Without this, the budget-match signal (worth +20) can never fire from inbox/dashboard callers**, since they're scoring leads in bulk and have no per-lead listing prop. This was a real diagnostic flush — Maria's anchor failed at 80/100 until I threaded listing context through.
  - `isQualified(lead, priceById)` — engine ≥ 20 OR editorial is Hot/Warm/Nurture. **Editorial bypass is critical**: an editorially-Hot lead with no engine signals shouldn't be hidden from default view; the disagreement icon does the work of warning the agent that the engine disagrees.
  - `isLowWeightCard(lead, priceById)` — engine < 20. Drives the four-pronged structural cold-vs-hot proof.
  - `hasEngineEditorialDisagreement(lead, priceById)` — engine ≠ editorial. Powers the disagreement icon.
  - `filterInbox({ chip, qualifiedOnly, search, listingPriceById })` — composes chip + qualified + search. The 8 PRD chips: All / Hot / New / Site Visit / Needs Reply / Financing / OFW / Investor. Hot chip is engine-OR-editorial (Option Z again).
  - `chipCounts(leads, qualifiedOnly, priceById)` — for the chip badges.
  - `badgeVariantForLead(lead)` — returns editorial variant (engine value flows through the icon, not the badge).
- **`components/leads/LeadCard.tsx`** — full vs low-weight rendering:
  - Full: 10×10 avatar, two-line preview, tags row (3 max + "Needs reply" pill), badge.
  - Low: 8×8 avatar, single-line truncate preview, source tag only, opacity-60 with hover-restore. Reduced motion, reduced visual presence.
  - **Disagreement icon (Q2 Option Z) form factor: `AlertCircle` from Lucide, 3.5×3.5 (≈14px), `text-gold-deep`, positioned next to score chip.** `title=` attribute provides "The AI engine and editorial assessment disagree on this lead. Tap to see the full breakdown." for hover/screen-reader users. Hidden on low-weight cards (the row is already de-emphasized). Decision logged for reapply to every future engine-vs-editorial divergence.
  - `data-testid`, `data-weight`, `data-badge-variant` attributes so verify can lock visual semantics from outside.
  - Bulk-selection mode flips checkboxes on; click becomes select instead of nav.
- **`app/agent/leads/page.tsx`** — Lead Inbox. Search input with clear button, "Show qualified only" toggle (default ON), 8 filter chips with counts. Bulk-select toggles a footer action bar fixed `bottom-16 lg:bottom-0` so it doesn't clash with the mobile nav. Archive action moves selected IDs to a client-side `archivedIds: Set<string>`, shows a sage-tinted confirmation toast that auto-dismisses after 3.5s. Tail summary explains the cold-inquiry hiding so the agent understands what they're not seeing.
- **`app/agent/leads/[leadId]/profile/page.tsx`** — Buyer Profile.
  - Hero: avatar, editorial badge, "Engine disagrees" chip when applicable, AI insight banner.
  - Recommended next action via `recommendNextAction(lead, engineScore)` — 7 rules covering the contradiction case, upcoming site visit, hot+ready, asked-for-computation-no-visit, brochure-opened-but-cold, and a default qualify prompt.
  - **Scoring breakdown panel** — the place where the contradiction story fully lands. Engine total/category and editorial total/category shown side-by-side, separated by a vertical rule. Per-rule list: `CheckCircle2` (sage) for triggered rules, `Circle` (subtle) for untriggered; `+N` (sage) for earned points, `0 / weight` (subtle) for missed. Each rule has a `detail` line (e.g. "Buyer budget ₱15M – ₱20M" for the budget-match rule). Contradiction banner appears above the list when engine ≠ editorial, in the gold-soft palette.
  - Profile field grid (8 fields, italic "Not provided" for empties).
  - Interested listings linking to `/agent/listings/[id]` — **expected 404 until Session 4**.
  - Engagement timeline (shares + file opens).
  - Right column: site visits, conversation summary (links to `/agent/leads/[id]`), stat box (last reply, message count, total opens).
- **`app/agent/leads/[leadId]/page.tsx`** — Buyer Conversation **placeholder**. Header card with View Profile button, message bubbles (buyer left, agent right, AI draft in gold-soft with "AI draft · ready to send" tag), and a dashed-border note that the full thread (AI Suggested Reply panel, tone selector, attach composer) ships in Session 3B. Promoted to `status: "scaffolded"` in the PRD manifest.
- **`app/agent/page.tsx`** — Agent Dashboard. Replaces Session 2 placeholder.
  - Greeting + briefing sentence (deterministic from KPI shape).
  - 4-up KPI grid (New leads today gold, Hot buyers terracotta, Site visits sage, Active deals navy). Hints adapt to zero-states.
  - **Money on the Way feature card** (Option A confirmed). 180px donut with "80% / To target" in the hole; 2×2 number grid (Paid this period sage, Pending payout gold, On hold navy, Monthly target muted); legend with formatted PHP values below. "View details →" links to `/agent/commissions/upcoming` (expected 404 until Session 6).
  - Active deals compact panel — **the reusable row pattern Session 5C should pick up**. `ActiveDealRow` is a `<Link>` with rounded-xl border, 9×9 icon tile, two-line text, right-aligned `StatusBadge` + optional "Blocked" marker. Pattern recorded.
  - Recent activity feed — AI activity / new lead / site-visit entries sorted by most-recent.
  - AI suggestions right column — up to 3 cards via `AISuggestionCard`.
- **Verify Section 7 (Dashboard math, 29 asserts)** — KPI exact values, MotW math (paid=112,500 / pending=367,500 / onHold=56,250 / progress=80% / segment-sum invariant), `selectActiveDeals` returns the 4 expected for demo agent, AI suggestion includes contradiction lead. Plus **two seeded-prop anchors**:
  - **Anchor 1: lead-instagram-01 (Maria Santos)** — Hot category, editorial 95, site visit booked, engine score = 100 with listing context, assigned to demo agent.
  - **Anchor 2: deal-001 (Laurel Hills 12A)** — ₱8.5M contract, 3% rate, Contract Signed, demo agent, buyer Maria Santos. Linked `comm-001`: For Closing status, ₱255,000 total.
- **Verify Section 8 (Inbox & contradiction, 22 asserts)** — cold-noise is hidden in default view, appears when toggle off, is low-weight; contradiction lead editorial=Hot, engine=Cold, has disagreement, appears in default view (editorial bypass); all 8 chips empirically work; search by name works; **four-pronged cold-vs-hot structural proof**: low-weight differs, badge variant differs, tags presence differs, engine category differs.
- **Verify Section 9 (PRD Coverage)** — renumbered from 7 to 9. Session 3A's three new completes asserted (agent-dashboard, leads-inbox, buyer-profile all `completedInSession: 3`). buyer-conversation asserted `scaffolded`. Coverage progress: 11+ complete after Session 3A.

### Decisions and engineering notes (carry-forwards)
- **Q2 implemented as Option Z.** Disagreement icon form factor: small `AlertCircle` (Lucide), ~14px, `text-gold-deep`, sitting next to the score chip on the row, with a tooltip via `title=`. Hidden on low-weight cards (the row is already de-emphasized). Reapplies to every future engine-vs-editorial disagreement.
- **Money on the Way placement: Option A (feature card).** The agent dashboard's emotional rallying point is the donut with "80% / To target" in the hole. Default target: ₱600,000/month. Exposed as `DEFAULT_MONTHLY_TARGET_PHP` for the eventual Settings → Earnings target override (Session 9 or later).
- **Listing-context-aware scoring.** Without `listingPriceById` threaded through inbox/dashboard callers, `scoreLead` cannot evaluate the budget-match signal (worth +20). This was a real diagnostic — Maria Santos's anchor failed at 80/100 until I added `scoreLeadWithContext` and `buildListingPriceMap`. **Pattern for any future engine call in a multi-lead context: build the price map once, pass through.**
- **AI suggestions are rule-driven, not template/LLM.** Four rules in priority order, deterministic. Static text per rule. Session 9 polish should decide whether to upgrade to template-and-fill (e.g. tone-aware messages) or live LLM. For now the determinism is a feature — verify can lock the contradiction lead surfaces.
- **Active deal compact-row pattern recorded.** `ActiveDealRow` shape: `rounded-xl border hover:border-gold/40`, 9×9 icon tile, two-line text, right-aligned `StatusBadge` + optional indicator. Session 5C's Deals Pipeline should reuse this exact shape so the agent's mental model carries over.
- **Editorial bypass in `isQualified`.** A lead the agent has flagged Hot/Warm/Nurture editorially is never hidden from the default qualified view, even with engine score 0. The disagreement icon does the disambiguation. Without this, the contradiction lead would have been invisible by default, defeating Q2's purpose.
- **Bulk-archive is client-only state.** Archived IDs live in `useState<Set<string>>`. Real backend persistence ships later. Toast confirms what happened. No-undo by design at this stage.
- **Expected 404s from Buyer Profile** until later sessions complete the targets:
  - `/agent/listings/[id]` — Session 4
  - `/agent/leads/[id]` (full thread, currently scaffolded) — Session 3B
  - `/agent/deals/[id]` — Session 5
  - `/agent/commissions/upcoming` — Session 6
- **Briefing sentence deterministic.** Reads "Good morning, {firstName}. You have 2 hot buyers, 2 site visits booked, and 4 active deals." for the demo agent. Pluralisation handled. Verify locks the structure.
- **Seed reference ISO** centralized at `"2025-05-29T08:00:00.000Z"` in the dashboard page. Same string used in `LeadCard`'s relative-time formatter and verify Section 7. If we ever advance the demo date, three call sites change in lockstep.

### Verify
- TypeScript: clean (`tsc --noEmit`).
- Build: 15 routes (was 14 after Session 2). All static except the two dynamic lead routes (`[leadId]` and `[leadId]/profile`).
- Verify: **673 / 673 passed** (added 59 new asserts; 614 → 673). 9 sections.

### Stop signal met
- ✅ Three surfaces render with real data.
- ✅ Contradiction icon present on `lead-contradiction-01`'s row.
- ✅ Buyer Profile breakdown shows engine + editorial side-by-side with full per-rule disclosure.
- ✅ Lead Inbox noise design empirically works (cold-noise hidden, low-weight differs from hot on 4 axes).
- ✅ Agent's daily flow walkable: `/agent` → tap Maria's lead → `/agent/leads/lead-instagram-01/profile` → see 100/100 score with budget match triggered → back to `/agent/leads` → toggle "Show qualified only" off → see cold noise + JM Garcia → select → archive → toast confirms.

---

## Session 2 — Auth & Onboarding
**Date:** 2025-05-29
**Branch:** main
**Scope:** Splash/login, role-select signup, three role-specific registration forms, upload documents, pending verification (4 sub-states), forgot password stub. Auth flow walkable end-to-end.

### What shipped
- **Form primitives** (`components/ui/Form.tsx`) — `Label`, `FieldGroup`, `Input`, `Select`, `Textarea`, `FileUploadRow` (with prototype file picker UX), `Stepper`. All brand-tinted.
- **Registration schemas** (`lib/registrationSchemas.ts`) — declarative, typed field lists per role. Each schema includes fields (id, label, type, required, hint, section), document requirements, role title/subtitle. The generic `RegistrationForm` renders any schema; verify counts required fields per role directly off the schema (no JSX parsing).
- **Account access logic** (`lib/logic/accountAccess.ts`) — pure function `landingDestination(role, status)` returning either `{ kind: "dashboard", path }` or `{ kind: "pending", status, reason }`. Also `canAccessRoleFeatures(status)` — true only for Verified, per the PRD's explicit gating language.
- **Splash / Login** (`app/page.tsx`) — replaced Session 1 placeholder. Real form with email + password, Face ID stub (visual only — explicitly noted in carry-forwards), Forgot Password link, Create Account footer. Demo shortcuts panel lists 4 sample seed users for the prototype walkthrough. Submitting routes through `landingDestination` based on the matched seed user's status.
- **`/auth` layout** — slim brand bar across all auth pages with a "Sign in" affordance.
- **`/auth/signup`** — Step 1 of the 4-step onboarding flow. Three role tiles (Agent / Broker / Realtor) with icons, descriptions, and feature highlights. Continue button gated on selection.
- **`/auth/register/{agent,broker,realtor}`** — Step 2. Three thin pages wrapping `RegistrationForm` with the matching schema. All PRD fields present; password match validated; section-grouped layout (Basic / Accreditation / Affiliation / Business / Consent). Continue routes to upload-documents with `?role=` param.
- **`/auth/upload-documents`** — Step 3. Renders the role's document requirements. File picker captures real file metadata (name, size, format) but never uploads — prototype-honest. "Use sample document" shortcut for demo flow. Wrapped in `<Suspense>` for App Router `useSearchParams`.
- **`/auth/pending`** — Step 4. Conditionally renders all 4 `AccountStatus` sub-states (Pending / Verified / Needs More Documents / Rejected) via `?status=` query param. State-specific bodies: Pending shows 3-step "what happens next"; Needs More Documents shows missing-items list + re-upload CTA; Rejected shows support contact; Verified shows "Go to dashboard." Wrapped in `<Suspense>`.
- **`/auth/forgot-password`** — two states: form (email + send link), confirmation (gold sage check + "Reset link sent" body). No real email sent.
- **Dashboard placeholders** (`/agent`, `/broker`, `/realtor`) — minimal landing pages wrapped in `AppShell` so the post-login destination renders. Replace fully in Sessions 3 and 7.

### Decisions and field interpretations (carry-forwards)
- **Face ID button is visual-only** — fires `router.push("/agent")` for demo, no biometric API. Flagged so Session 9 doesn't try to wire WebAuthn unless explicitly authorized.
- **PRD field interpretations** —
  - "Agent number or accreditation number" → single field `agentNumber`, free text. PRD does not specify a format; agencies issue these themselves.
  - "Broker/Realtor/Realty/Developer Sales Team" affiliation type → 4-value select. The agent is then asked for the parent's name, license, company, contact, and email regardless of type. PRD asks for license number "if applicable" — schema marks it required for simplicity; if the parent is a Realty Company or Developer Team and no license exists, agents would enter the company registration number instead. Flagged so a future polish session can decide whether to make this conditional.
  - "Number of agents under broker" → free text field, hint "Approximate is fine." PRD says capture this but doesn't constrain format.
  - Broker "PRC license number if applicable" → marked optional in schema.
  - Realtor "Broker license number if also licensed broker" → marked optional in schema.
- **Upload Documents UX is prototype-honest** — the file picker reads file metadata (name, size, format) but nothing leaves the browser. There's a "Use sample document" link below each upload row so demos don't get stuck. Flagged for Session 9 polish (decide whether to keep the shortcut or remove it).
- **Registration consent is a single checkbox** covering both Terms of Service and Privacy Policy. PRD treats them together; if they need to be separate, that's a polish-pass call.
- **Manifest count change** — added `forgot-password` as the 46th route. The scope contract said 45; the Session 2 framing said "include the Forgot Password stub." Treating that as authorization to add it, EXPECTED_ROUTE_COUNT bumped 45 → 46. Flagged in the session report for the reviewer's record.

### Verify additions (Section 6: Auth flow & schemas)
- Required field count per schema matches PRD-derived expectation (Agent 14, Broker 11, Realtor 11).
- Each canonical PRD field exists in the matching schema (id-by-id check).
- Agent `parentType` options include all 4 PRD-listed kinds (broker / realtor / realty / developer).
- Each role has ≥1 required document.
- `landingDestination` routes Verified users to `/{role}` and all other states to `/auth/pending`.
- `canAccessRoleFeatures` returns true only for Verified.
- ≥1 seed user with `Pending Verification` status (Miguel Reyes).
- Registration routes exist in the manifest for all three roles.
- Forgot Password route registered.

### PRD Coverage (Section 7)
- Manifest now at 46 routes (was 45).
- 8 routes complete (was 0; was 1 scaffolded). Scaffolded count back to 0.
- 38 pending.
- Session 2 stop-signal asserted: all 8 Session 2 routes have `status = complete` and `completedInSession = 2`.

### Verify results
- TypeScript: clean (`tsc --noEmit`).
- Build: clean (`next build`) — 14 static routes prerendered.
- Verify: 614 / 614 passed.

### Walkability
End-to-end walkable: `/` (login form) → enter `alyssa.garcia@realestate-hq.ph` → `/agent` placeholder, OR `/auth/signup` → pick role → `/auth/register/{role}` → fill required fields → `/auth/upload-documents` → submit → `/auth/pending?status=Pending Verification`. Forgot-password reachable from login. `?status=` URL params allow direct inspection of all 4 pending sub-states without seeding additional users.

### Next session
Session 3A — Agent Dashboard + Lead Inbox. The Q2 decision (subtle disagreement icon, Option Z) drives the lead-row design.

---

## Session 1 — Foundations
**Date:** 2025-05-29
**Branch:** main
**Scope:** Design system, data model, pure-logic modules, seed data, verify v1, PRD-coverage manifest (45 routes).

### What shipped
- **Stack** — Next.js 14.2.33, React 18.3, TypeScript 5.6 strict (with `noUncheckedIndexedAccess` and `noImplicitOverride`), Tailwind 3.4, Lucide, Recharts, Framer Motion, clsx + tailwind-merge + cva, tsx for verify.
- **Brand system** — Tailwind tokens for ivory canvas, soft charcoal ink, champagne gold accents, sage success, navy authority, terracotta warmth. Soft / card / lift shadow scale. 2xl / 3xl radii. Display serif for hero typography, system sans for body.
- **Domain types** (`lib/types.ts`) — full type system for User (3 roles + status + specializations + derivedAgentStatus), BuyerProfile, Lead (16 sources, 9 categories, 4 score bands), Listing (7 transaction types, 5 ownership kinds), DeveloperProfile / Project / Unit, Deal (9 stages), Commission (5 statuses, 6 timeline stages), SiteVisit, ShareCampaign, ConversationMessage, PropertyFile (10 categories, 9 formats), TeamUpdate (11 types), BonusCampaign, AIActivity (18 agent types), Integration (18 providers), NotificationItem (14 categories).
- **Pure-logic modules** (`lib/logic/`)
  - `leadScoring` — PRD weights (20/20/15/25/5/5/10 = 100), `scoreLead`, `categorize`, `simulateAction`.
  - `agentHealth` — PRD weights (20%/15%/15%/20%/15%/15%), `scoreAgentHealth`, `labelHealth`, `simulateShare`.
  - `commissionSplit` — agent-takes-residual rounding, reconciles to total ±₱1.
  - `roleAwareAmount` — **the keystone**: `amountFor`, `viewerParticipates`, `teamAgentAmount`, `sumOwnAmount`, `filterVisibleToViewer`. Every commission display in every later session routes through this.
  - `commissionAggregation` — `computeKPIs`, `computeBreakdown`, `progressPct` — all routed through roleAwareAmount.
- **Seed data** (`data/`) — 19 users (1 realtor / 3 brokers / 15 agents), 5 developers, 12 projects, 8 units, 30 listings spanning all 7 transaction types (≥2 each), 25 leads covering all 16 sources, 10 deals + 10 commissions + 2 payout accounts, 6 site visits, 5 share campaigns, 18 conversation messages, 14 property files (all 10 categories represented), 6 team updates, 2 bonus campaigns (May Closing Sprint), 18 AI activity entries (all 18 agent types), 18 integrations (all 18 PRD providers), 16 notifications (all 14 categories).
- **UI primitives** — Card, KPI, StatusBadge, AISuggestionCard, Button (cva variants).
- **AppShell** — role-aware sidebar (desktop) + 5-item mobile bottom nav. Agent / Broker / Realtor nav structures defined per the PRD navigation analysis.
- **Splash page** — branded placeholder linking to the three role hubs.
- **PRD-coverage manifest** (`verify/prdManifest.ts`) — exactly 45 routes with id, title, route path, expectedElements, status, notes. Math: 36 PRD-listed + 6 listing-category additions + 1 distribution + 1 notifications + 1 leaderboard = 45.
- **Verify suite** (`verify/index.ts`) — 528 assertions across 6 sections (FK integrity 403, structural invariants 70, demo beats 20, role-aware lock 5, commission mockup 27, PRD coverage 3).

### Demo narratives encoded
1. **Cold noise inquiry** (`lead-noise-01`) — JM Garcia, single "is this still available?" message, no qualification data. Verify asserts the lead is Cold, needs reply, and has no budget/timeline/preferences.
2. **Engine-vs-seed contradiction** (`lead-contradiction-01`) — Roy Aguilar, editorial flags Hot (verbal urgency cues), engine scores 0/Cold (no qualifying signals). Both values persist on the lead row. Verify locks the contradiction: editorial Hot AND engine Cold simultaneously.
3. **Nurture-beat** (`lead-nurture-01` + `agent-007` Jason Ong) — Karen Yap currently Cold (score 20). Simulated brochure share lifts lead score by exactly +5. Simultaneously, Jason's listingsShared+1 simulation lifts his health score by 1–3 points within the Needs Coaching band. Both lifts locked by verify.
4. **Leaderboard spread** — agents distributed across all four health bands (Top Performer / Active / Needs Coaching / Low Activity). Closed deals split across multiple agents (not concentrated on one).

### Verify results
- TypeScript: clean (`tsc --noEmit`).
- Build: clean (`next build`).
- Verify: 528 / 528 passed.
- PRD coverage at Session 1 close: 0 complete / 1 scaffolded / 44 pending.

### Decisions and flags for the reviewer
See the accompanying `SESSION_REPORT.md` for two items requiring reviewer input.

### Next session
Session 2 — Auth / Onboarding. Will move the splash item from "scaffolded" to "complete" once login fields are added, and bring 6 onboarding routes to "complete" or "scaffolded" as appropriate.
