# Real Estate HQ — Session Log

This file tracks per-session decisions, deliverables, and verify status.
Newest sessions at top.

---

## Session 5C — Site Visit Booking + Deals Pipeline + Closed Deal Logging
**Date:** 2025-05-29
**Branch:** main
**Scope:** Site Visit Booking (#24) with list + detail + booking form. Deals Pipeline (#25) with stage-distribution overview + mobile timeline + desktop collapsible-phase kanban + Deal Detail with 9-stage progress strip + AI Suggested Next Action + required-document checklist gate + Closed Deal Logging sheet. Last PRD-driven session before the marquee block returns at Session 6.

### What shipped

- **`lib/logic/dealStageDerivations.ts`** — Session 5C's concentration point and **6th declarative rule table** in the codebase:
  - `STAGE_REQUIREMENTS` — per-stage required documents (the 6th declarative rule table after TONE_MARKERS / SEARCH_RULES / SHARE_RULES / FILE_RECOMMENDATION_RULES / SIMULATOR_TIMINGS). Lead Generated has 0 reqs; Documents Submitted has 3 reqs (Buyer valid ID / Income proof / Reservation agreement); Reservation Paid has "Reservation fee receipt"; Contract Signed has "Contract to Sell (CTS)"; etc.
  - Pipeline navigation: `stageIndex`, `nextStage`, `previousStage`, `pipelineProgress` (monotonic 0..1 across 9 stages).
  - `advancementGateFor(deal)` — returns `{canAdvance, missingForNext, next}`. A deal at stage N can advance to stage N+1 only when N+1's required docs are NOT in `deal.missingDocuments`. Pure function; UI surfaces it as disabled-Advance-button + required-doc-checklist.
  - `isClosedWon` — true at Contract Signed and beyond.
  - `expectedCommissionStatusFor(stage)` — declarative mapping for the commission flip (Reservation Paid → For Approval; Contract Signed → For Closing; Commission Processing → For Payout; Commission Released → Paid). **Session 6 reads what 5C writes.**
  - `dealsForUser(deals, user, allUsers)` — role-aware visibility with parentId-based team resolution. Agent sees own; Broker sees own + team (via `parentId === broker.id`); Realtor sees direct network + transitive (agents under brokers under the realtor).
  - `NEXT_ACTION_RULES` — **11-rule declarative table** for AI Suggested Next Action (10 stages + Reservation Paid has 2 variants + fallback). Same transparency discipline as `aiReply` / `aiShareMessage`: rule name visible in UI as "rule: {ruleKey}".
  - `suggestNextAction(deal)` — returns `{rule, description, label}` with rule transparency for the UI.
  - `convertSiteVisitToDeal(input)` — pure function creating a new Deal at `Site Visit Done` stage from a Completed visit, populating Reservation Paid reqs as `missingDocuments`, preserving lead/listing/agent references, and referencing the visit ID in `notes`.
  - `STAGE_PHASES` — Discovery / Qualification / Closing × 3 stages each = 9 total. Used by desktop kanban for collapsible phase groups.
  - `phaseFor`, `groupDealsByStage`.
- **`lib/logic/siteVisitDerivations.ts`** — `statusVariantForSiteVisit` (Confirmed/Reminder Sent/Converted → sage "paid"; Proposed/Rescheduled → gold "warm"; Completed → navy "nurture"; No-show → terracotta "hot"), `isUpcomingStatus`, `partitionSiteVisits(visits, nowIso)` with asc/desc sort guarantees.
- **`lib/types.ts`** — `Deal.commissionId` made optional. Matches PRD semantics: the commission lifecycle begins at Reservation Paid, so deals at Lead Generated / Buyer Qualified / Site Visit Done legitimately have no commission row.
- **Seed updates**:
  - **+3 site visits**: sv-007 Ron Marquez Saturday-2pm Proposed (`scheduledAt: "2025-05-31T06:00:00.000Z"` = Sat 2pm Manila — the demo's marquee upcoming-visit anchor); sv-008 Romeo Bautista No-show (covers the no-show variant); sv-009 Eugene Cabrera Confirmed.
  - **+4 deals** spread across early pipeline stages: deal-011 Ron Marquez @ Lead Generated (₱9.2M Veranda 8F); deal-012 Maria Santos @ Buyer Qualified (₱18.5M Laurel 12A — **composes with share-006 narrative**, the same Maria + Laurel pair as Session 5A/5B's marquee anchor, now flowing into the pipeline); deal-013 Bea Castro @ Site Visit Done (₱28M Talisay villa); deal-014 Lara Hizon @ Reservation Paid mid-document-collection (₱4.5M RFO, missing income proof + reservation agreement — the demo's advancement-gate anchor).
  - **+1 commission row**: comm-014 for deal-014 ("For Approval" status, agent-007 / broker-003, SPLIT_BROKER_DIRECT).
- **5 routes built**:
  - `/agent/site-visits` (list with Upcoming/Past sections + 7 status filter chips with counts + Book CTA)
  - `/agent/site-visits/[id]` (detail with schedule + location + notes + linked entities + Convert-to-Deal action when Completed + Reminders affordance)
  - `/agent/site-visits/new` (booking form: buyer / listing / datetime / location / notes; sticky bottom CTA)
  - `/agent/deals` (pipeline with stage-distribution overview 9-cell grid + mobile timeline + **desktop collapsible-phase kanban**)
  - `/agent/deals/[id]` (Deal Detail with 9-stage progress strip + AI Suggested Next Action panel with rule transparency + required-document checklist gate with checkable toggle + Advance button disabled when blocked + Close Deal sheet triggered when advancing to Contract Signed + linked Commission row showing expected status per stage + linked Lead/Listing)
- **PRD manifest**: site-visit-booking (#24) and deals-pipeline (#25) both promoted to complete with comprehensive expectedElements lists (6 elements for #24, 11 elements for #25).

### Decisions and engineering notes (carry-forwards)

- **Desktop kanban Option C (collapsible phase groups)** chosen over A (narrow columns) and B (sticky first+last). Rationale: at 9 stages on a 13" screen, fixed-narrow columns become unreadably tight (~90px each minus padding). The sticky pattern preserves first-and-last as anchors but hides the active middle of the pipeline — where document gates and stage advancement actually happen. Option C collapses entire phases (3 stages each) into a single header bar, letting the agent expand only the phases they're working on. **Matches the calm-UX discipline established in 5A/5B**: hide what's not active.
- **Rule of Six for declarative rule tables confirmed.** TONE_MARKERS / SEARCH_RULES / SHARE_RULES / FILE_RECOMMENDATION_RULES / SIMULATOR_TIMINGS / **STAGE_REQUIREMENTS** + NEXT_ACTION_RULES. Shape consistently: declared table + verify lock + transparency UI. The pattern has now generated 7 declarative tables across the codebase.
- **AI Suggested Next Action did NOT earn a sibling helper** — `suggestNextAction` composes from existing stage-routing pattern. Decision rationale: while it could have been split into a sibling of `advancementGateFor`, the rule routing is so tightly coupled to the stage data that co-locating in `dealStageDerivations.ts` keeps the surface area focused. The sibling-helper pattern earns its weight when two helpers diverge in input/output (`applyTone` vs `applyShareTone`, `recommendFilesFor` vs `generateShareMessage`); here the inputs and outputs share too much for the split to add value.
- **Closed Deal Logging is a sheet, not a route.** Per framing. Triggered when the user taps Advance and the next stage is Contract Signed. Captures final price (defaults to contract price), closing date, handoff notes. Surfaces an inline preview of what the commission flip will do ("Deal advances to Contract Signed. Commission flips to For Closing and progresses to For Payout as the deal moves through Commission Processing"). The actual flip is read declaratively via `expectedCommissionStatusFor(stage)` — Session 6 surfaces the same mapping in the Commission Tracking dashboard.
- **Required-document gating** lives in `STAGE_REQUIREMENTS` declarative table. UI surfaces a checkable list (tap to mark received → tap again to mark missing); the Advance button is disabled when any required doc is in `missingDocuments`. The 4-pronged structural proof in Section 17 locks: (1) deal cannot advance with missing docs, (2) can advance when satisfied, (3) unrelated missing docs do NOT block (gate evaluates ONLY next-stage reqs), (4) at end of pipeline no advancement possible.
- **Deal stage names exactly per PRD** with one minor preservation: PRD says "Financing / Payment Approved" → the type uses "Financing Approved" (already shortened in DEAL_STAGES from Session 1; would ripple too widely to change). Documented; not a defect.
- **Deal.commissionId made optional.** Reflects reality: the commission lifecycle begins at Reservation Paid. Early-stage deals (Lead Generated / Buyer Qualified / Site Visit Done) legitimately have no commission row. FK invariant updated to handle the optional case.
- **Pattern flag for Session 6**: the Closed Deal Logging commission flip is the upstream half of Commission Tracking's "Money on the Way" flow. Session 6's Commission Tracking dashboard reads `expectedCommissionStatusFor(deal.stage)` — Session 5C writes this declarative mapping, Session 6 visualizes the resulting commission row movement through the timeline.
- **deal-012 (Maria + Laurel 12A @ Buyer Qualified) composes with share-006 narrative.** The same Maria + Laurel pair that was the marquee anchor in 5A/5B's share campaign is now in the demo's pipeline — the narrative chain is share-006 (Maria received the share message + opened all 4 files at 10:24/10:26/10:27/10:28 AM) → deal-012 (Maria is now a qualified buyer in the pipeline awaiting site visit). **The same buyer + same listing, two sessions apart, woven into a single demo arc.**
- **Mockup-anchor numbers preserved.** Agent-001's total commission stays at ₱536,250 (the 6 existing commissions: comm-001 through comm-006). The new early-stage deals deliberately have NO commission rows so they don't shift the Session 6 anchor. Locked by Section 17.

### Verify

- TypeScript: clean (`tsc --noEmit`).
- Build: **39 routes** (was 34 in 5B; +5 new routes: /agent/site-visits + /agent/site-visits/[id] + /agent/site-visits/new + /agent/deals + /agent/deals/[id]).
- Verify: **1431 / 1431 passed** (+162 from Session 5B's 1269). Distribution:
  - Section 1 FK Integrity: 489 → 520 (+31 from new site visits, new deals, new commission row, new FK invariants)
  - Section 2 Structural invariants: 70 → 72 (+2 from optional commissionId handling)
  - Section 7 Dashboard math: 29 → 29 (assertions updated for new active deal count + new upcoming visit count, total preserved)
  - **Section 17 NEW (Deals Pipeline + Site Visits): 124 asserts** — second-largest single-session section after 5B's 147
  - Section 18 PRD Coverage: 65 → 70 (+5 from Session 5C advancement + manifest re-validation)

### Stop signal met

End-to-end deal lifecycle walkable:
- ✅ `/agent/site-visits` — see Upcoming list with Ron Marquez Saturday-2pm Proposed at top, Past list with No-show / Converted / Completed visits below
- ✅ Tap Ron's row → site visit detail with schedule (Saturday, May 31, 2:00 PM, Asia/Manila), location (The Veranda sales pavilion), linked Ron Marquez lead + Veranda 8F listing
- ✅ Tap a Completed visit (e.g., Bea Castro's) → see Convert-to-Deal CTA
- ✅ `/agent/deals` — stage distribution overview shows 14 deals across 9 stages (1 / 1 / 1 / 1 / 2 / 0 / 3 / 1 / 3); mobile timeline lists each stage with deal cards; desktop kanban groups into Discovery / Qualification / Closing phases with collapse toggles
- ✅ Tap a deal card → Deal Detail with 9-stage progress strip showing current stage emphasized; AI Suggested Next Action panel with rule transparency ("rule: reservationPaid_missingDocs · Reservation paid but docs incomplete — chase the requirements")
- ✅ At deal-014 (Reservation Paid, missing 2 docs): Advance button DISABLED, checklist shows "Income proof / employment certificate" and "Reservation agreement" as missing circles; tap each to mark received → button enables → tap Advance → stage moves to Documents Submitted; new requirements appear for next stage
- ✅ Advance through Documents Submitted → Financing Approved → click Advance to Contract Signed → Closed Deal Logging sheet opens with final price + closing date + notes + "What happens next" preview (Commission flips to For Closing → For Payout as deal moves through Commission Processing)
- ✅ Linked Commission row shows current commission status + expected status for current stage; updates as stage advances

---

## Session 5B — Attach Files + Smart Link + Engagement Simulation (marquee follow-on)
**Date:** 2025-05-29
**Branch:** main
**Scope:** Attach Files bottom sheet (#22) with 3 stages (categories → select → selected) and AI Recommendation banner. Smart Link QR code rendering via `qrcode.react`. Engagement event simulation (real-time setTimeout chain firing post-Send). File Engagement Tracking strip embedded on Share Listing + Conversation thread. share-006 marquee anchor seeded.

### What shipped

- **`lib/types.ts`** — extended `ShareCampaign` with `smartLinkToken: string` (the trailing slug-hash segment, used by QR encoder and redirect resolver) and `engagementEvents: EngagementEvent[]` (full timeline). Added `EngagementEvent` interface + `EngagementEventKind` union (15 kinds covering link/brochure/computation/floor plan/location map/photo/video/computation request/site visit/reply/reshare).
- **`data/shareCampaigns.ts`** — full rewrite to populate the new fields on all 5 historical campaigns + add the **share-006 marquee anchor**: Maria (lead-instagram-01 / buyer-005) + Laurel 12A sent at 2025-05-29T02:20:00.000Z (10:20 AM PHT, ~2 hours before the seed reference time). 4 attachments (Brochure / Computation / Floor Plan / Location Map). 5 engagement events at 02:22 / 02:24 / 02:26 / 02:27 / 02:28 UTC — which render as 10:22 / **10:24 / 10:26 / 10:27 / 10:28 AM** in PHT, matching the mockup's File Engagement Tracking strip EXACTLY.
- **`lib/logic/aiFileRecommendation.ts`** — **sibling helper** `recommendFilesFor({ lead, listing, availableFiles })`. Same 7-rule routing as `aiShareMessage` (Rule of Five for declarative rule tables now confirmed across the codebase: TONE_MARKERS / SEARCH_RULES / SHARE_RULES / FILE_RECOMMENDATION_RULES / AI Reply rules):
  - investor → Brochures + Computations + Price List
  - ofw → Brochures + Computations + Payment Terms
  - familyEndUser → Brochures + Computations + Floor Plans + Location Map ← matches the mockup's 4-file selection
  - luxury (≥₱25M) → Brochures + Photos + Floor Plans
  - firstTimeBuyer → Brochures + Computations
  - rental → Brochures + Price List
  - default → Brochures + Computations
  `FILE_RECOMMENDATION_RULES` declarative table is the public, verify-locked contract. Resolves categories → file IDs by preferring official developer files when present, otherwise the first file in the category.
- **`lib/logic/engagementSimulator.ts`** — `buildEngagementSchedule()` is the pure schedule builder + `useEngagementSimulation()` is the React hook that dispatches the schedule via setTimeouts. **Attachment-aware**: brochure_opened only fires if a brochure was attached; floor_plan_viewed only if a floor plan was attached; etc. Probabilistic site_visit_requested fires at the 38s mark with 40% probability, only if a brochure or computation was attached. Determinism via seeded LCG (verify uses fixed seed). Cleans up timers on unmount. `SIMULATOR_TIMINGS` constants exported for verify.
- **`lib/shareStore.ts`** — added `appendEngagementEvent(campaignId, { kind, fileId })` that handles BOTH sent campaigns (mutates the campaign's events array in place + bumps scalar counters) AND seed campaigns (writes to a shadow buffer that's merged on read). `getEngagementEvents(campaignId)` returns the merged events sorted by `at` ascending.
- **`components/share/AttachFilesSheet.tsx`** — three-stage bottom sheet matching the mockup's bottom row:
  - **Stage 1 (categories):** AI Recommendation banner at top (with rule transparency + Apply → affordance + recommended-category chips) + 9 category tiles (Photos / Brochures / Floor Plans / Computations / Price List / Payment Terms / Location Map / Requirements / Upload New File). Each tile shows a colored icon + label + subtitle + selected count badge if any.
  - **Stage 2 (select):** All / PDF / Images / Docs / Links format tabs + search bar + scrollable file rows with sage-deep circular checkmark + file icon badge + file name + size·format + AI badge on individually recommended files. Footer: "N files selected (X MB)" + green "Add Files" button.
  - **Stage 3 (selected):** review list with remove × per row + yellow Tip card ("Buyers love it when you send complete information...") + green "Done" button + "Clear All" in header.
  - State management: staged selection diverges from props until Done/Add Files commits; re-syncs when sheet opens. Body scroll locked while open.
- **`components/share/FileEngagementStrip.tsx`** — post-send live engagement view. Pure rendering from props (files + events). Per-file status cards with sage-deep eye icon + live-pulse animation on the most-recent engaged file. Per-event label/timestamp resolution via pure `labelFor(kind)` + `categoryShortLabel(category)` helpers (exported for verify). Two variants: `inline` (default, compact header) and `standalone` (larger header). `formatTime()` uses `toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" })` so the UTC-stored times render correctly as Manila wall-clock.
- **`qrcode.react@4.2.0`** installed. Library disk size 148KB; gzipped client bundle contribution ~6KB (under the framing's 12KB budget). `<QRCodeSVG value={smartLink} size={144} level="M" />` renders an SVG QR code on the Share Listing page when the user taps "Scan QR Code".
- **Share Listing page wiring**:
  - `[attachOpen, setAttachOpen]` state — opens the AttachFilesSheet
  - `[showQR, setShowQR]` state — toggles real QR code visibility
  - AttachFilesSheet mounted alongside ShareRefineSheet
  - QR placeholder replaced with real `<QRCodeSVG>` (data-qr-value attribute exposes the encoded URL for verify)
  - `existingCampaign` memo finds the most recent campaign for the selected listing+buyer; if present, the FileEngagementStrip surfaces below the recipient picker. This is why opening Maria + Laurel 12A immediately shows the share-006 strip with all 4 files in their engagement state.
- **Conversation thread page wiring** (`/agent/leads/[leadId]`):
  - `useSearchParams` reads `?shared=` query (set by Send action redirect from Share Listing or Preview Message)
  - `liveCampaign` memo: prefers `findCampaign(sharedId)` for a fresh send; falls back to the most recent campaign for the listing+buyer for first-paint demo (share-006 surfaces immediately on Maria's thread)
  - "Just shared" sage-soft banner renders when `?shared=` is set
  - `useEngagementSimulation(liveCampaign, filesById, appendEvent)` — when the live campaign has no events yet (fresh send), the hook schedules events that fire over the next ~40s; `eventsTick` state forces re-render on each event arrival
  - FileEngagementStrip rendered with `liveEvents` (merged seed + shadow buffer); the strip's live-pulse animation runs on the most-recently engaged file

### Decisions and engineering notes (carry-forwards)

- **AI file recommendation built as a sibling helper** (`recommendFilesFor`), not added as a context arg to `generateShareMessage`. Same architectural shape as `applyShareTone` vs `applyTone` from 5A. The two helpers share the 7-rule routing skeleton but produce different outputs (one returns prose, the other returns file categories). Naming this as another instance of the **sibling-helper pattern** the codebase principle named in 5A's report.
- **Rule of Five for declarative rule tables confirmed across the codebase**: TONE_MARKERS (3B) / SEARCH_RULES (4B) / SHARE_RULES (5A) / **FILE_RECOMMENDATION_RULES (5B)** / AI Reply rules. Plus engagementSimulator's timing table follows the same shape. The pattern is now generative: any rule-driven module follows this shape.
- **Smart Link token format**: lowercase alphanumeric, 4 characters, deterministic FNV-1a hash over `listingId|agentId|buyerLeadId`. Trailing segment of the URL after the slug. Stored separately on `ShareCampaign.smartLinkToken` so the redirect resolver can look up by token (when backend lands). The QR encodes the full URL (including https://) so any QR app routes correctly. **Under the 12KB framing budget**: qrcode.react contributes ~6KB gzipped, the simulator + recommendation + sheet contribute ~3-4KB combined (~9-10KB total).
- **Engagement simulator timings**: 3s / 6s / 12s / 18s / 25s / 38s (vs framing's suggested 5s / 10s / 15s / 25s / 40s). Slightly tighter pacing: the link_opened event needs to fire faster than the framing suggested to feel responsive (3s vs 5s), and the file events shift accordingly. The site_visit_requested at 38s keeps the original ~40s ceiling. **Feels right for demo pacing — the agent sees the strip animate as they're still on the page.** 40% probability for site visit is exact per the framing.
- **File Engagement Tracking strip composed as a reusable component** (`<FileEngagementStrip files={} events={} />`), not bespoke to a single route. Used by:
  - Share Listing page (existingCampaign surface, post-send tracking visible inline)
  - Conversation thread page (liveCampaign surface, fresh-send tracking with simulator)
  - Future surfaces (Listing Detail when built, Campaign analytics page) compose the same component
- **share-006 marquee anchor pattern**: same shape as Cherry's noise-anchor + Marisol's contradiction-anchor from earlier sessions. Lock the exact agent (agent-001) + listing (listing-laurel-12a) + buyer (buyer-005) + 4-attachment set + 5 events with exact timestamps. This is the demo's "look — engagement is happening live" beat: opening Maria's thread shows the strip with Brochure Opened 10:24 / Computation Downloaded 10:26 / Floor Plan Viewed 10:27 / Location Map Opened 10:28, matching the mockup precisely.
- **Timestamp convention for engagement strip**: UTC-stored ISO strings rendered with `toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" })`. For the strip to read "10:24 AM" the UTC stored time must be 02:24:00Z. This is the same convention used elsewhere in the codebase for `sentAt` rendering. The seed times are calibrated to Manila wall-clock.
- **AI Recommendation lives inside the Attach Files sheet, not as a Share Listing sidebar** — per the Session 5A ratification ("AI recommendations surface in the contextual sheet where the relevant decision is made"). The mockup's "AI Recommendation" sidebar in image 2 was illustrative; the routed implementation matches the calm-UX discipline.

### Verify

- TypeScript: clean (`tsc --noEmit`).
- Build: **34 routes**. Share Listing 17.9 kB / 149 kB First Load (+9.27 kB from 5A's 8.63 kB, accounting for the sheet + QR + strip). Conversation thread 8.82 kB / 140 kB. Preview Message unchanged at 5.14 kB / 128 kB.
- Verify: **1269 / 1269 passed** (+156 from Session 5A's 1113). Distribution:
  - Section 1 FK Integrity: 483 → 489 (+6 from new engagement events referencing files)
  - **Section 16 Attach Files + Engagement: 147 new asserts — largest single-session verify section in the suite to date** (was 96 in 5A, 80 in 3B)
  - Section 15 PRD Coverage: 62 → 65 (+3 from Session 5B advancement)

### Stop signal met

End-to-end share-and-track flow walkable:
- ✅ Open Unit Inventory → tap "Share to my pipeline" on unit-laurel-12a → Share Listing opens with Maria pre-selected, share-006 FileEngagementStrip shows below recipient picker (4 cards: Brochure Opened 10:24 / Computation Downloaded 10:26 / Floor Plan Viewed 10:27 / Location Map Opened 10:28)
- ✅ Tap "View All" or "Add More" on Attach Files row → AttachFilesSheet opens at stage 1 with AI Recommendation banner ("familyEndUser · Family end-user — brochure, computation, floor plan, location map" + 4 category chips + "Apply →")
- ✅ Tap "Apply →" → stage 3 (Selected Files) with 4 files listed + Tip card + Done
- ✅ Tap Brochures category → stage 2 with All/PDF/Images/Docs/Links tabs + search + file rows with AI badges on recommended files + "Add Files" footer
- ✅ Tap "Scan QR Code" → real `<QRCodeSVG>` renders, encoding the smart link URL (data-qr-value matches `smartLinkFor(...)`)
- ✅ Tap "Send to Maria Santos" → ShareCampaign created + ConversationMessage dropped into Maria's thread + redirect to `/agent/leads/lead-instagram-01?shared={campaignId}`
- ✅ Conversation thread renders "Sent — Watch this space" banner + FileEngagementStrip with the just-sent campaign's files
- ✅ Engagement simulator fires events over 40s window: link_opened at +3s, brochure_opened at +6s (file-001), computation_downloaded at +12s (file-002), floor_plan_viewed at +18s, location_map_opened at +25s, site_visit_requested at +38s (40% probability — deterministic with seed)
- ✅ Each event arrival re-renders the strip; live-pulse animation moves to the most-recently engaged file

---

## Session 5A — Share Listing + Preview Message (FIRST MARQUEE MOCKUP-MATCHING SESSION)
**Date:** 2025-05-29
**Branch:** main
**Scope:** Share Listing main page (#21) and Preview Message page (#23) at mockup-fidelity. AI Share Message engine, outbound-variant tone application, ShareCampaign + ConversationMessage send wiring, smart-link generation. The first session where the mockup is the visual contract.

### What shipped

- **`lib/logic/aiShareMessage.ts`** — rule-driven outbound share message generator. Same posture as `lib/logic/aiReply/suggester.ts` from Session 3B: no LLM call, pure-function rule routing on `(listing, lead)` → `{rule, ruleDescription, draft, actions}`. 7 declarative rules in priority order: `ofwBuyer` → `investor` → `luxury` (price ≥ ₱25M) → `familyEndUser` (End-User + familySize ≥ 3) → `firstTimeBuyer` → `rentalYield` → `defaultIntroduction`. `SHARE_RULES` table is the public, verify-locked contract. Demo anchor verified: Maria's profile (End-User, family 5, Taguig) + Laurel 12A → `familyEndUser` rule → body matches mockup word-for-word: "Based on your budget and preference for a family-friendly home in Taguig, I think this property might be a great fit for you. Laurel Hills Estate — Unit 12A is a 4BR house & lot near schools, malls, and major roads. Would you like me to send the sample computation?"
- **`lib/logic/aiShareTone.ts`** — **outbound-variant** of `applyTone`. Same `Tone` union (8 tones reused from `aiReply/tones.ts`), but per-tone shaping calibrated for OUTBOUND messages, not replies. Phrases like "Thank you for your inquiry" and "I'm really glad you reached out" — appropriate to inbound context but wrong for outbound — are explicitly forbidden. `SHARE_FORBIDDEN_PHRASES` table locked by verify. Greeting always regenerated per tone (Friendly: "Hi Maria!"; Professional: "Good day, Maria."; Investor: "Hi Maria,") so when the Refine sheet changes tone, the greeting style follows. **Carry-forward from Session 3B framing satisfied: "Refine sheet pattern composed directly from 3B or needed adjustment" — adjustment.**
- **`lib/shareStore.ts`** — client-side ShareCampaign store mirroring `conversationStore.ts`. `shareListing(input)` is the send action: creates a `ShareCampaign` (with a deterministic `smartLinkFor()` URL) AND calls `sendMessage()` to drop a `ConversationMessage` into the buyer's thread with `shareCampaignId` linking back to the campaign. `useShareCampaignsForListing()` hook for live listing-level engagement. `_resetShareStoreForTests()` and `getClientShareCount()` for verify.
- **`lib/types.ts`** — added `shareCampaignId?: string` field to `ConversationMessage`. **Field, not entity.** Justification: the agent's outbound conversation message that originates from the Share Listing flow needs to be queryable as "this message came from a share campaign" for engagement back-traceability. Translates cleanly to a backend foreign key.
- **`app/agent/listings/[listingId]/share/page.tsx`** — Share Listing main page (#21). Composition matches mockup image 2:
  - Header strip with back arrow + "Share Listing" + "Preview" link top-right
  - Property hero card with image placeholder + title + property type + location + price + ownership/transaction badges + commission percentage
  - AI Generated Message panel (gold-soft surface): editable textarea, Regenerate button, rule name visible in header strip ("· rule: familyEndUser"), rule description below
  - Tone + Language pills (open the Refine sheet on tap)
  - Attach Files (4) chips row with 4 PDF/JPG chips + "Add More" tile (sheet implementation deferred to 5B per framing)
  - Share via channel row: Messenger / WhatsApp / Instagram DM / SMS / Email / More — 6 chips with brand-aware colors (Messenger blue #0084FF; WhatsApp green #25D366; Instagram gradient; SMS sage-deep; Email ink; More ink)
  - Smart Link Created card: live URL (`https://estatehq.ph/l/...`), Copy Link button with confirmation state, QR Code scan affordance
  - Recipient picker (horizontal chip row of active leads, Maria selected by default)
  - Sticky bottom primary CTA: **"Send to Maria Santos"** in sage-deep with Send icon — matches mockup exactly
  - Refine sheet (bottom sheet) with all 8 tones + 3 languages + Regenerate button
- **`app/agent/listings/[listingId]/share/preview/page.tsx`** — Preview Message page (#23). Composition matches mockup image 2 right panel:
  - Header strip with back arrow + "Preview Message" + channel indicator
  - Phone-style chat-bubble preview area (canvas-sunken background)
  - Faux sender row at top of preview (agent initials avatar + name + "Messenger · to Maria Santos")
  - Sage-soft chat bubble with rounded-tl-md (chat-bubble corner), max-width 92%:
    - Intro paragraph (first paragraph of message)
    - Inline listing card preview (gradient hero + title + property type + price + "Near schools, malls and major roads.")
    - Trailing paragraphs (sample computation question)
    - Footer with timestamp + sage-deep CheckCheck icon (read receipts)
  - Attachments list card with 4 file rows (file icon, name, size + format, Eye icon)
  - "Files will be sent as attachments." caption
  - Sticky bottom: "Send Now" primary CTA (sage-deep) + "Edit Message" ghost button
- **`components/share/ChannelChips.tsx`** — 6-channel chip row with `channelVisualFor()` mapping (sixth concentration point in spirit, though only used in this surface so doesn't yet meet Rule of Three threshold — flagged for future reuse). Active state fills with brand color, inactive shows brand color on neutral background.
- **`components/share/ShareRefineSheet.tsx`** — bottom sheet composing `ALL_TONES` (8) and `ALL_LANGUAGES` (3) from aiReply with a Regenerate button.
- **`components/listings/ListingActionRow.tsx`** — extended with `primaryHref?: string` prop. When provided, the primary action renders as a styled Next.js Link instead of a button — enables clicking "Share to my pipeline" on a unit card or My Listings card to route to the Share Listing page. Cross-file invariant on role-aware action labels still locked.
- **Wiring updates**:
  - `app/agent/listings/for-sale/developers/[developerId]/[projectId]/page.tsx` — Unit Inventory cards now resolve their unit → listing (via `seedListings.find(l => l.unitId === unit.id)`) and pass `primaryHref` so Agents tapping the action chip route to `/agent/listings/{listingId}/share`
  - `app/agent/my-listings/page.tsx` — My Listings cards pass `primaryHref` for Agents
- **`data/propertyFiles.ts`** — added Floor Plan and Location Map files for `listing-laurel-12a` so the Share Listing page can render the 4 attachments visible in the mockup (Brochure / Computation / Floor Plan / Location Map). Demo anchor: 4 files in 4 different categories.
- **Seed name disambiguation**: `data/leads.ts`, `data/siteVisits.ts`, `verify/index.ts` updated to rename buyer "Maria Santos Buyer" → "Maria Santos" so the CTA reads "Send to Maria Santos" exactly matching the mockup. Both broker-001 (Maria Santos, User) and buyer-005 (Maria Santos, BuyerProfile) share first/last name; they're distinguishable by entity type and surface context (broker as logged-in user; buyer as recipient). Cross-disambiguation verify-locked.

### Decisions and engineering notes (carry-forwards)

- **Send architecture: campaign + thread message (both, linked).** The framing carry-forward question: "Does the Send action create a ConversationMessage in the buyer's thread, or is it a separate ShareCampaign entity?" Answer: **both**. `ShareCampaign` records WHAT was shared, on WHICH channel, with engagement metadata (opens / brochure clicks / computation requests / site visit bookings / replies). `ConversationMessage` records the buyer-visible message text. The two reference each other via `ConversationMessage.shareCampaignId`. This is the right architecture because the campaign and the message answer different questions (engagement analytics vs conversation history); a single record would conflate them. Backend wiring later: `shareCampaignId` becomes a foreign key.
- **Refine sheet pattern adjusted from 3B, not composed verbatim.** Created `applyShareTone()` as a sibling to `applyTone()` because outbound shares require a different per-tone shaper (no "I'm really glad you reached out" — that's inbound-context). Same `Tone` union and tone count. `SHARE_FORBIDDEN_PHRASES` table is the verify contract: outbound tones must never include the inbound phrases. **Flag for the codebase principle: the sibling-helper pattern (3B's `applyTone` + 5A's `applyShareTone`) is the right shape when two adjacent contexts share a vocabulary (tones) but differ in shaping logic — single-responsibility helpers composing better than one multi-purpose helper. Same principle the framing flagged for `shareActionFor()` in 4B.**
- **AI Share rule set documented in `SHARE_RULES`** as a declarative table with `description` + `priority` per rule. Same transparency discipline as 3B's AI Reply (rule name surfaced in panel header) and 4B's AI Search (extraction rules table). The Share page shows the active rule name AND its description below the message. **Rule of Three confirmed for declarative rule tables**: `aiReply` rules, `aiListingSearch` `SEARCH_RULES`, `aiShareMessage` `SHARE_RULES`. All three follow the same shape: a declared mapping that's verify-locked + UI-surfaced for transparency.
- **Sixth helper flagged: `shareActionFor()`** — NOT extracted in 5A. The framing called for this in My Listings ("Share with buyer" vs "Share to my pipeline" context discrimination). 5A's surfaces route to the same Share Listing page; the source context (discover vs my-listings) doesn't currently change the destination behavior. Will surface in Session 5B/7 when the broker-side distribution UI lands with a genuinely different action ("Send to N agents" → "Distribute to agents now" with the AI-recommended agent picker). Defer until 3 real call sites exist.
- **Mockup composition fidelity decisions**:
  - The mockup image 1 (sharing page hero) shows 6 channels (Messenger / WhatsApp / Instagram DM / SMS / Email / More) — taken as canonical.
  - The mockup image 2 (organizer with attach files visible) shows 5 channels (WhatsApp / Messenger / SMS / Email / More — no Instagram DM). I went with image 1's 6-chip set since the PRD explicitly lists 6.
  - Property hero image: rendered as a CSS gradient placeholder (charcoal slate ramp). The mockup uses a real photo; 5A doesn't ship image assets — placeholder reads as a property thumbnail. Acceptable for screenshot-defensibility at this polish level; real imagery is a 5B/9 concern.
  - The Share via channel row uses brand-aware colors (Messenger blue, WhatsApp green, Instagram gradient) only on the selected/active state. The mockup shows brand-tinted icons on neutral backgrounds for inactive chips, which I matched.
  - "Send to Maria Santos" CTA is sage-deep with white text — matches mockup (which shows the same sage/dark-green primary).
  - "Send Now" / "Edit Message" stacked CTAs on Preview Message — sage-deep primary + ghost secondary, matches mockup.
- **Mockup ambiguity surfaced (NOT silently resolved):** The mockup shows "AI Recommendation" side panel ("Based on Maria's request, we recommend attaching the sample computation and brochure" with [Brochure] [Computation] chips). This is an AI file-recommendation feature — distinct from the AI message generation. **Per PRD: "AI should recommend files based on buyer question."** This is logically the Attach Files sheet's responsibility — when the agent opens the sheet, AI surfaces "based on the buyer's last message, we suggest these files." **Deferred to Session 5B explicitly, where the Attach Files sheet ships** — at which point the recommendation surfaces naturally inside the sheet rather than as a separate side panel. Surfacing here for reviewer ratification.
- **Mockup ambiguity surfaced**: The mockup image 1 also shows "Engagement Tracking" (Live — Buyer opened listing 3 times) and "Share Performance" (donut chart, 28 total shares) and "AI Match Preview" (Maria Santos 92% Match) side panels. These are POST-share views — they're meaningful only after a campaign has been sent. **They are 5B's territory** (smart-link tracking, engagement events, file engagement). 5A renders the Share Listing PRE-send state. Surfaced here so the reviewer knows the mockup's side-panel content isn't missing — it's deferred.
- **Smart link URL determinism: `smartLinkFor(listingId, agentId, buyerLeadId)` → `https://estatehq.ph/l/{slug}-{hash}` where hash is a 4-char FNV-1a base36 token over the input tuple.** Verify locks the URL host + slug presence + determinism + input sensitivity. Backend smart-link wiring (token registration, redirect, engagement events) is 5B.
- **PRD bottom-nav discrepancy noted (not addressed in 5A).** PRD says agent bottom nav should be: Dashboard / My Leads / My Listings / Commissions / Insights. Current AppShell has: Dashboard / Leads / Listings / Deals / Earnings. The mockup shows the PRD layout. **Deferred to a polish session (likely 9)** — changing the nav is structural and impacts existing routes. Surfaced for reviewer awareness.
- **The Share Listing route lives at `/agent/listings/[listingId]/share`.** Not `/agent/share/[listingId]` or `/agent/listings/[listingId]/[action=share]`. The route nesting follows the natural ownership ("share" is a verb on a listing, so listing → share). Matches the 4A correction principle (use the most PRD-true route structure even if the original manifest had a flatter assumption).
- **The Listing detail route (`/agent/listings/[listingId]`) is still expected 404.** A polish session or Session 5B can ship the read-only detail view. The Share button on a listing card routes directly to the share sub-route, so the missing detail page doesn't block the share flow.
- **Verify Section 14 (Share Listing, 96 asserts)** is the largest single-session verify section to date (vs Section 9 AI Reply's 80, Section 12 Listings 4B's 75, Section 10 Listings spine's 75). Reflects the marquee nature: 7 rules × multiple invariants each, 4-pronged structural proof on profile variation, mockup-anchor text fidelity, all 8 tones × forbidden-phrase × distinctness, deterministic smart link, send action wiring, 4 files × 4 categories anchor.

### Verify

- TypeScript: clean (`tsc --noEmit`).
- Build: **34 routes** (was 32). +2 share routes. Share Listing at 8.63 kB / 136 kB First Load; Preview Message at 5.62 kB / 127 kB.
- Verify: **1113 / 1113 passed** (+109 from Session 4B's 1004). Distribution:
  - Section 1 FK Integrity: 475 → 483 (+8 from new private offerings + Floor Plan + Location Map files)
  - Section 14 Share Listing: 96 new asserts
  - Section 15 PRD Coverage: 57 → 62 (+5 from Session 5A advancement)

### Stop signal met

- ✅ Open Unit Inventory for Laurel Hills (`/agent/listings/for-sale/developers/dev-landmasters/proj-laurel-hills`).
- ✅ Tap "Share to my pipeline" on unit-laurel-12a → `/agent/listings/listing-laurel-12a/share` opens with Maria Santos pre-selected as recipient.
- ✅ AI Generated Message panel shows Maria-personalized text: "Hi Maria! Based on your budget and preference for a family-friendly home in Taguig, I think this property might be a great fit for you..." with "· rule: familyEndUser" badge in header.
- ✅ Tap Refine → bottom sheet opens; switch to Professional Broker → message regenerates with "Good day, Maria." opener.
- ✅ Switch language to Tagalog → message rewraps with "Kumusta, Maria po!" opener and "Salamat po..." closer.
- ✅ Switch language to Cebuano → "Maayong adlaw, Maria!" opener; verify locks NO "po" anywhere.
- ✅ Tap Messenger chip → channel selects (blue brand color); tap WhatsApp → switches.
- ✅ Tap Copy Link → smart link copied to clipboard; button shows "Copied" sage-deep feedback for 1.8s.
- ✅ Tap Preview link top-right → `/agent/listings/listing-laurel-12a/share/preview` opens with phone-style bubble showing message + inline listing card + attachments list.
- ✅ Tap Edit Message on Preview → returns to Share Listing.
- ✅ Tap "Send to Maria Santos" → ShareCampaign created, ConversationMessage dropped into Maria's thread with `shareCampaignId` linking back, routes to `/agent/leads/lead-instagram-01?shared={campaignId}`.
- ✅ The 4-pronged profile-variation structural proof holds: investor lead routes to `investor` rule; family lead body contains "family-friendly" while investor body does not; investor body mentions "yield/ROI/appreciation" while family does not; family actions include `book_site_visit` while investor's do not.

---

## Session 4B — Private Offerings + My Listings + AI Listing Search
**Date:** 2025-05-29
**Branch:** main
**Scope:** Private Offerings full surface (#19) with read-side verification badges + filter chips; My Listings (#20) with role-mirror; AI Listing Search natural-language filter mounted on Listings Menu + My Listings. Closes out the Listings module surface-completion phase.

### What shipped

- **`lib/logic/verificationVisual.ts`** — **fifth concentration point** confirmed. Pure mapping `verificationVisualFor(status)` → `{label, Icon, badgeClass, iconAccentClass, semantic}`. Three states, three visual treatments: Verified→sage-deep + ShieldCheck; Pending→gold-deep + Clock; Unverified→terracotta-deep + ShieldAlert. `ALL_VERIFICATION_STATUSES` exported for filter-chip iteration. Architecturally identical to `primaryActionFor` from 4A: pure helper exported separately so verify can lock the contract without React. **Cross-file invariant locked: no inline color literals for verification states outside this helper.**
- **`components/listings/VerificationBadge.tsx`** — React badge component using the helper. Test-id includes the `data-verification-status` and `data-testid="verification-badge-{semantic}"` so verify can locate badges per listing.
- **`lib/logic/aiListingSearch.ts`** — the deterministic rule-based search engine. No real LLM call. Components:
  - `SEARCH_RULES` — declarative table of 14 rules (bedrooms, maxPriceM, minPriceM, minCommission, transaction types × 6, property types × 4). Each rule has a `description` field (transparency contract for the UI) and a `pattern` regex. Future expansion adds rules to the table.
  - `LOCATION_KEYWORDS` — ordered list of PH locations (longest-first so "Cebu Business Park" wins over "Cebu"); standalone "Cebu" / "Manila" as last-resort fallbacks.
  - `extractQuery(input)` → `ExtractedQuery` — pure structured extraction. Strips matched substrings sequentially so each rule "consumes" its territory.
  - `applyQuery(q, listings)` — filters a Listing[] against the ExtractedQuery. Bedroom matching is **permissive** when a listing's bedrooms can't be parsed from text (don't exclude on ambiguity — the transparency chip still shows the filter).
  - `transparencyChipsFor(q)` → `TransparencyChip[]` — exactly the chips for whatever was extracted. Mirrors the AI Reply panel's rule-name display from Session 3B.
  - `searchListings(input, listings)` → `{query, matches, chips}` — one-shot convenience for UI.
  - Stopword list expanded post-extraction (the, with, properties, listings, commission, near, etc.) so orphan structural words don't pollute freeText filters.
- **`components/listings/AISearchInput.tsx`** — search bar component. Sparkles icon, gold-soft focus state, transparency chips row below input ("Filtering by: 2BR · Condo · BGC · ≤₱20M"), inline results card showing up to 6 matches with "+N more" overflow, empty-state with suggestion chips.
- **`lib/logic/myListingsDerivations.ts`** — `listingsForUser(user, allListings, allUsers)` with per-role semantics:
  - Agent: `ownerAgentId === me` OR `assignedAgentIds.includes(me)`
  - Broker: `ownerBrokerId === me` OR `ownerAgentId` belongs to one of my agents
  - Realtor: `ownerBrokerId` belongs to one of my brokers OR `ownerAgentId` belongs to one of my brokers' agents OR `assignedAgentIds` overlaps with my brokers' agents
  - `applyActiveFilter` (All / Active / Archived where Active = Available + Sold Out Soon; Archived = Sold + Reserved)
  - `applyTransactionTypeFilter` (one of 7 PRD categories + "All")
  - `myListingsHeadingFor(role)` — per-role heading copy (Agent: "My Listings"; Broker: "Listings I've distributed"; Realtor: "Listings across my network")
- **`app/agent/listings/for-sale/private/page.tsx`** — Private Offerings (#19). 10 private For-Sale offerings rendered with verification badges + ownership badges + owner names + engagement counts + role-aware action rows. 4 filter chips (All + 3 verification states). Footer note that the verification workflow ships in Session 9. Back link smart-routes: Agent → For Sale, Broker/Realtor → Listings Menu (because broker/realtor's `/listings/for-sale` doesn't exist as a route yet).
- **`app/agent/my-listings/page.tsx`** — My Listings (#20). Per-role heading via `myListingsHeadingFor`. AISearchInput mounted at the top filtering scoped-to-user listings. All/Active/Archived chips + transaction-type chips. Listing cards with transaction-type badge + availability badge + verification badge (when applicable) + engagement count + role-aware action row.
- **App routes added/touched:**
  - `app/agent/listings/for-sale/private/page.tsx` (new) — Private Offerings full surface
  - `app/agent/my-listings/page.tsx` (new) — My Listings
  - `app/broker/listings/for-sale/private/page.tsx` (new role mirror)
  - `app/realtor/listings/for-sale/private/page.tsx` (new role mirror)
  - `app/broker/my-listings/page.tsx` (new role mirror)
  - `app/realtor/my-listings/page.tsx` (new role mirror)
  - `app/agent/listings/page.tsx` (modified — AISearchInput mounted above category grid)
  - `app/agent/listings/for-sale/page.tsx` (modified — Private Offerings tab gets "See all →" linking to the full surface; preview uses VerificationBadge)
- **`lib/types.ts`** — added `assignedAgentIds?: string[]` field to `Listing`. **Field, not entity**; pragmatic prototype representation of distribution. Translates cleanly to a backend relation table later. No new entity type; rationale logged here per the build rule.
- **Seed data expanded** (`data/listings.ts`):
  - Added 7 new private For-Sale offerings to reach **10 total** with verification ratio **5 Verified / 3 Pending / 2 Unverified = 50% / 30% / 20%** per framing.
    - Verified: listing-private-banawa-townhouse (anchor), listing-private-bgc-condo, plus 3 original (listing-private-cebu-house, listing-exclusive-talisay, listing-broker-mactan-villa)
    - Pending: listing-private-ortigas-condo, listing-private-ayala-heights, listing-private-paranaque-bungalow
    - Unverified: listing-private-talamban-lot, listing-private-fairview-house
  - Added `assignedAgentIds` to 7 listings to seed My Listings density: demo agent agent-001 (Alyssa) now sees **11 listings** spanning developer For-Sale (laurel-12a, laurel-14b, cebu-prime-2br, cebu-prime-1br, veranda-8f), broker For-Sale (broker-mactan-villa, listing-private-bgc-condo, listing-private-ortigas-condo), personal For-Sale (listing-private-banawa-townhouse, listing-private-talamban-lot), and one rental (listing-rent-2).
- **PRD manifest updated** — promoted private-offerings (#19) and my-listings (#20) from pending to complete with `completedInSession: 4`. Routes corrected: `/agent/listings/for-sale/private` (more PRD-true than original flat path) and `/agent/my-listings`.
- **Verify Section 12 (Listings 4B, 75 asserts)** added:
  - Verification visual: 3 states registered, label/badgeClass/semantic per state, pairwise label distinctness, stable semantic IDs locked.
  - Private Offerings seed: ≥8 private For-Sale offerings; ≥1 in each of 3 states; Verified > Pending > Unverified ratio sanity.
  - **Seeded-prop anchor: listing-private-banawa-townhouse** — exists, For Sale + Personal Listing, Verified, owned by agent-001, ₱9.8M, in Banawa Cebu City, assigned to agent-001.
  - AI Listing Search behavior: 7 representative queries × multiple invariants each (location-only, price ceiling, bedrooms, transaction type, composite, commission, anchor query). Each assertion measures the actual UI invariant — "every result has location ∋ 'BGC'", "every result has price ≤ 20M", "chip kinds present match extracted fields", "anchor query returns exactly 1 match = listing-private-bgc-condo with exactly 4 chips."
  - Search determinism: identical inputs → identical match count + identical IDs in same order.
  - `extractQuery` primitives: bedrooms/propertyType/location/maxPrice all extract correctly from "2BR condo in BGC under 20M".
  - `applyQuery + extractQuery === searchListings` consistency.
  - `SEARCH_RULES` declarative-table totality (≥10 rules).
  - `LOCATION_KEYWORDS` totality (BGC, Cebu, Makati, Manila, Mactan all present).
  - `transparencyChipsFor` invariants: extracted fields → chips of matching kinds; unextracted fields → no chip.
  - My Listings derivations: Alyssa has ≥8 listings; every result is owned-or-assigned; Maria (broker) sees own + her agents'; Alex (realtor) sees ≥ broker's count; ACTIVE_FILTERS triad; active vs archived mutual exclusion; transaction-type filter exclusivity.
  - Per-role heading distinctness for the My Listings page.
- **Verify Section 13 (PRD Coverage)** renumbered from 11. Session 4B advancement: 2 routes assert `status="complete"` + `completedInSession=4`; aggregate `complete >= 25`.

### Decisions and engineering notes (carry-forwards)

- **Fifth concentration point: `verificationVisualFor()`** ✓ — the framing explicitly invited this if the pattern composed naturally. It did. Verified/Pending/Unverified visual treatment now lives in exactly one place. Future verification surfaces (S5 listing detail badge, S7 broker dashboard "needs verification" filter, S9 verification workflow itself) compose this helper. **Rule of Three is now Rule of Five across the codebase: `applyTone`, `applyEngineRule`, `splitCommission`, `primaryActionFor`, `verificationVisualFor`.**
- **Seed verification ratios: 50% Verified / 30% Pending / 20% Unverified** across 10 private For-Sale offerings = 5/3/2. Matches framing guidance. Demo realism honored.
- **AI Search rule set documented in `SEARCH_RULES` and `LOCATION_KEYWORDS`** as declarative tables. This IS the public contract — verify locks ≥10 rules + key locations. The transparency discipline from Session 3B's AI Reply (`rule: cold-qualifier` in panel header) carries through: the search input shows extracted chips in real time.
- **AI Search rule set carry-forward:** 14 extraction rules cover bedrooms, max/min price in millions, min commission, 6 transaction types (For Rent / Foreclosure / For Assume / Pre-Selling / RFO / Commercial), and 4 property types (Condo / House and Lot / Townhouse / Lot Only). 24 location keywords ordered longest-first. Stopword list filters structural words ("properties", "commission", "listings") that survive extraction. Future expansions: developer-name match (Session 6/7), OFW-intent match (S7 broker analytics), free-text match against PRD's "Best for OFW / investment / family / rental" tags (S7/9).
- **AI Search bedroom matching is permissive on ambiguity.** Listings without parseable bedroom counts in their title or property type aren't excluded by a "2BR" query — they're surfaced and the transparency chip shows the filter was applied. The alternative (exclude on absence) would silently filter out broker-listed townhouses, foreclosure houses, etc. Permissive interpretation aligns with how real estate agents actually want to use natural-language search ("show me 2BR options" should surface the candidates and let the agent dig in).
- **PRD ambiguity on My Listings filter taxonomy resolved.** PRD says "Tabs or filter for: For Sale / For Rent / ..." AND separately "Filter: All / Active / Archived." I read these as two orthogonal axes both present (transaction type + lifecycle state), not either/or. Two chip rows render. Both filter independently.
- **Distribution model: `assignedAgentIds?: string[]` field on Listing.** Not a new entity. Justification logged here per the build rule. Pragmatic for prototype; translates cleanly to a backend relation table when wired. The semantics are stable: "listings this agent has been distributed (assigned) to share."
- **Per-role heading distinctness** is the third application of the role-aware action pattern in the listings module: 4A's `primaryActionFor` (action button label), 4A's role-aware subtitle on the Menu page, and now `myListingsHeadingFor` for the My Listings page header. The pattern of three keeps the per-role text differentiation in a single helper per surface.
- **`primaryActionFor` extension flagged for Session 5/7.** In My Listings, the per-card action button should arguably read "Share with buyer" rather than "Share to my pipeline" — because the listing is already in the agent's pipeline. Session 5A's Share Listing flow will face this directly. Note for 5A planning: either (a) extend `primaryActionFor` with a context arg (e.g. `primaryActionFor(role, count, context: "discover" | "share")`) or (b) introduce a sibling helper `shareActionFor(role, count)`. My instinct is (b) — keep primaryActionFor for the inventory-discovery context and add a focused helper for the share-with-buyer context. Both keep the concentration discipline.
- **Role mirror scope: Menu + Private Offerings + My Listings.** `/broker/listings`, `/broker/listings/for-sale/private`, `/broker/my-listings` and the realtor equivalents are 1-line re-exports of the agent pages. Drill-down routes (`/for-sale/developers/...`) still aren't mirrored under broker/realtor — Session 7 work. From a broker's Private Offerings page, the back link goes to `/broker/listings` (Menu) rather than `/broker/listings/for-sale` because that route doesn't exist yet under the broker prefix.
- **Expected 404 carry-forward** continues: tapping a listing's title in any listings surface routes to `/{role}/listings/{listingId}` which is Session 5 work. Surfaced inline as italic subtle note.
- **Methodology refinement applied throughout Section 12.** AI Search assertions measure the UI invariant directly: "every result has price ≤ 20M" (not "max-price chip exists"); "transparency chips match extracted fields" (not "chips array length is 4"); "anchor query returns exactly 1 match" (not "match count > 0"). Each assertion measures what the agent depends on, not a proxy.

### Verify

- TypeScript: clean (`tsc --noEmit`).
- Build: **32 routes** (was 26). +6 new routes (Private Offerings + My Listings + 4 role mirrors). Largest: Buyer Conversation at 13.1 kB / 134 kB First Load (unchanged from 3B).
- Verify: **1004 / 1004 passed** (+87 from Session 4A's 917). Crossed 1000.
  - Section 1 FK Integrity: 468 → 475 (+7 from new listings)
  - Section 12 Listings 4B: 75 new asserts
  - Section 13 PRD Coverage: 52 → 57 (+5 from Session 4B advancement)

### Stop signal met

- ✅ Open `/agent/listings` → AISearchInput appears at the top above the category grid. Type "2BR condo BGC" → transparency chips appear → 1 result card slides in.
- ✅ Empty results: type "studios with helipad" → empty state with 4 suggestion chips; tap one → search runs with the suggestion as input.
- ✅ Open `/agent/listings/for-sale` → Private Offerings tab shows "See all →" link with 6-card preview using VerificationBadge.
- ✅ Tap "See all →" → `/agent/listings/for-sale/private` → 10 private offerings rendered with their verification badges. 4 filter chips (All 10 / Verified 5 / Pending 3 / Unverified 2) work.
- ✅ Filter to Verified → 5 cards showing sage-deep ShieldCheck badges.
- ✅ Filter to Pending → 3 cards with gold-deep Clock badges labeled "Pending review."
- ✅ Filter to Unverified → 2 cards with terracotta-deep ShieldAlert badges.
- ✅ Open `/agent/my-listings` as Agent → "My Listings" heading; 11 cards across transaction types; All/Active/Archived chips work; transaction-type chips work; AISearchInput filters within scope.
- ✅ Open `/broker/my-listings` as Broker → "Listings I've distributed" heading; action labels on every card read "Send to 9 agents."
- ✅ Open `/realtor/my-listings` → "Listings across my network" heading; action labels read "Send to network."
- ✅ Anchor query "2BR condo in BGC under 20M" → exactly 1 match: Premium 2BR Condo — BGC.

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
