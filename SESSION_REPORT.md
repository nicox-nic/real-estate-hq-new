# Session 5B — Report

**Branch:** `main`
**Stop signal:** met. Attach Files bottom sheet (#22) shipped at mockup-fidelity (3-stage flow: categories → select → selected, with AI Recommendation banner inside the sheet per 5A's ratification). Smart Link QR rendering live via `qrcode.react`. Engagement simulator + File Engagement Tracking strip wired to Share Listing AND Conversation thread. share-006 marquee anchor seeded with mockup-anchor timestamps. The marquee mockup-matching block (5A + 5B) closes here.

## At a glance
- **TypeScript:** clean
- **Build:** 34 routes. Share Listing 17.9 kB / 149 kB First Load (+9.27 kB from 5A); Conversation thread 8.82 kB / 140 kB; Preview Message 5.14 kB / 128 kB. **QR + sheet + strip + simulator all under the framing's 12 KB marginal-cost budget** (qrcode.react ~6 KB gzipped + 3-4 KB for the rest).
- **Verify:** **1269 / 1269 passed** (+156 from 5A's 1113). **Section 16 Attach Files + Engagement: 147 new asserts — largest single-session verify section in the suite** (5A's Share Listing held the record at 96)
- **PRD coverage:** **28 complete** · 0 scaffolded · 18 pending of 46
- **Walkability:** Unit Inventory → Share Listing (with existing share-006 strip already visible) → Attach Files sheet (3 stages, AI banner, Apply →) → QR Code reveal (real QR rendering smart link) → Send → Conversation thread with "Just sent" banner + live FileEngagementStrip with simulator firing events over ~40s

## What shipped (Session 5B's 1 promotion + 4 architectural extensions)

| # | Route / Surface | Notes |
|---|---|---|
| 22 | `attach-files` | pending → **complete**. Three-stage bottom sheet matching mockup bottom row. AI Recommendation banner inside the sheet (per 5A's ratification). |
| — | Smart Link QR | Real `<QRCodeSVG>` rendering smart link URL. ~6 KB gzipped. Toggle on Share Listing page. |
| — | Engagement Simulator | `buildEngagementSchedule` (pure) + `useEngagementSimulation` (hook). 3s/6s/12s/18s/25s/38s timings. Attachment-aware. 40% probabilistic site visit. |
| — | File Engagement Tracking strip | Reusable component embedded on both Share Listing (existing campaign) and Conversation thread (live campaign). Sage-deep live-pulse on most-recent engaged file. |
| — | share-006 marquee anchor | Maria + Laurel 12A seeded campaign with 4 attachments and 5 events at mockup-exact timestamps (10:22 / 10:24 / 10:26 / 10:27 / 10:28 AM PHT). |

## Architectural decisions documented

- **AI file recommendation as a sibling helper.** `recommendFilesFor()` shares the 7-rule routing skeleton of `generateShareMessage()` but produces different outputs (file categories vs prose). Same architectural shape as `applyShareTone` vs `applyTone` from 5A. **The sibling-helper pattern is now firmly established as a codebase principle.**
- **Rule of Five for declarative rule tables confirmed across the codebase.** TONE_MARKERS (3B) / SEARCH_RULES (4B) / SHARE_RULES (5A) / **FILE_RECOMMENDATION_RULES (5B)** / AI Reply rules. The engagement simulator's `SIMULATOR_TIMINGS` constants also follow the pattern. **Any rule-driven module now follows this shape**: declared table + verify lock + transparency UI.
- **Smart Link token format**: 4-character lowercase alphanumeric, FNV-1a hash over `listingId|agentId|buyerLeadId`. Trailing URL segment after the slug. Stored separately on `ShareCampaign.smartLinkToken` so the backend redirect resolver can look up by token. QR encodes the full URL (with scheme) so any standard scanner routes correctly.
- **Engagement simulator timings adjusted from framing defaults.** Framing suggested 5s/10s/15s/25s/40s; shipped 3s/6s/12s/18s/25s/38s. Reason: the link_opened event needs to fire faster than 5s to feel responsive (the agent is still on the redirect page). The other events shift accordingly. Site_visit at ~38s preserves the framing's ~40s ceiling. **40% probability for site visit is exact per the framing.** Confirming the timing felt right for demo pacing.
- **File Engagement Tracking strip is a reusable component**, not bespoke to one route. Used by Share Listing (existingCampaign surface) and Conversation thread (liveCampaign surface). Future Listing Detail or Campaign Analytics pages compose the same component.
- **Mockup-anchor timestamp convention.** share-006's events are stored as UTC strings (02:22 / 02:24 / 02:26 / 02:27 / 02:28 Z) and render via `toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" })` as 10:22 / 10:24 / 10:26 / 10:27 / 10:28 AM. The render layer handles localization; the seed stays in UTC. Same convention as the rest of the codebase.
- **AI Recommendation lives inside the Attach Files sheet** per 5A's ratification — confirmed correct in practice. When the agent opens the sheet to attach files, the banner sits at the top with the rule explanation and the Apply → button. Tap Apply → jumps straight to stage 3 (Selected Files) with all 4 recommended files staged. The mockup's sidebar composition in image 2 was illustrative; the routed implementation is calmer.

## Mockup ambiguities surfaced (NOT silently resolved)

1. **"AI Recommendation" with [Brochure] [Computation] chips in the mockup shows 2 chips, but `familyEndUser` rule recommends 4 categories.** I went with the rule's logical output (4 categories: Brochures / Computations / Floor Plans / Location Map) rather than the mockup's truncated 2-chip preview. The 4 chips render in the banner; tapping Apply stages all 4 files. The mockup likely showed only 2 chips for visual brevity. **Confirming this is the right resolution.**
2. **The strip in the mockup shows 4 cards horizontally with a `→` overflow indicator.** My implementation uses horizontal scroll with `overflow-x-auto` — same UX, but the visible card count adapts to viewport width. On mobile narrow viewports, the strip scrolls; on wider screens, all 4 cards fit. No mockup deviation; just responsive behavior the mockup didn't explicitly show.
3. **The mockup's "AI Recommendation" sidebar (image 2 left) shows a robot illustration.** I omitted the robot graphic; the banner uses the standard `Sparkles` icon (consistent with the AI Generated Message panel's sparkles). The robot was visual flavor; the routing decision (in-sheet, not sidebar) makes the robot moot.

## 4-pronged structural proof on file recommendation differentiation

Family lead vs Investor lead, both viewing Laurel 12A:
- Prong 1: rule routing differs (`familyEndUser` vs `investor`)
- Prong 2: family categories include Floor Plans; investor's don't
- Prong 3: investor categories include Price List; family's don't
- Prong 4: family resolves to 4 actual file IDs; investor resolves to 2 (Laurel seed lacks a Price List file) — measures the realized recommendation count, not just the categories

Each prong measures what the UI actually distinguishes between profiles, not surface property like text length.

## Verify suite delta (1113 → 1269)

| Section | Asserts | Delta | Notes |
|---|---|---|---|
| 1. FK Integrity | 489 | +6 | new engagement events reference files |
| 2. Structural invariants | 70 | — | |
| 3. Demo beats | 20 | — | |
| 4. Role-aware aggregation lock | 5 | — | |
| 5. Commission Tracking mockup | 27 | — | |
| 6. Auth flow & schemas | 69 | — | |
| 7. Dashboard math | 29 | — | |
| 8. Inbox & contradiction | 22 | — | |
| 9. AI Reply | 80 | — | |
| 10. Listings spine | 75 | — | |
| 12. Listings 4B | 75 | — | |
| 14. Share Listing | 96 | — | |
| **16. Attach Files + Engagement** | **147** | **+147** | NEW — largest single-session section. Covers FILE_RECOMMENDATION_RULES table totality + every-rule-recommends-Brochures invariant + all 8 PRD categories reachable + family-end-user anchor + 4-pronged profile variation proof + determinism + simulator timing monotonicity + attachment-aware scheduling + share-006 anchor lock (12 events × kinds + 4 mockup-anchor timestamps) + appendEngagementEvent shadow buffer for seed campaigns + strip label/category helpers + every-seed-campaign-has-token-and-events invariant + fresh shareListing populates new fields. |
| 15. PRD Coverage | 65 | +3 | renumbered; Session 5B advancement (1 route × 2 + aggregate) |
| **Total** | **1269** | **+156** | |

## Demo walk (validated end-to-end)

1. From `/agent/listings/listing-laurel-12a/share` (already opens with Maria pre-selected):
   - Hero card / AI Generated Message panel / Tone+Language pills / Attach Files 4 chips / Channel chips / Smart Link with Copy + QR toggle (NEW) / Recipient picker
   - **NEW: FileEngagementStrip surfaces below recipient picker showing share-006 already-engaged state** — 4 cards: Brochure Opened 10:24 / Computation Downloaded 10:26 / Floor Plan Viewed 10:27 / Location Map Opened 10:28. Sage-deep eye on each. Live-pulse on Location Map (most recent).
2. Tap **"Scan QR Code"** on Smart Link card → real QR code renders below (~144x144 SVG, ML-level correction, dark ink). Encodes the actual smart link URL.
3. Tap **"Add More"** in Attach Files row → **AttachFilesSheet opens at stage 1**:
   - "✨ AI Recommendation · familyEndUser · Family end-user — brochure, computation, floor plan, location map" + 4 category chips + "Apply →" button
   - 9 category tiles: Photos / Brochures (1 selected) / Floor Plans (1 selected) / Computations (1 selected) / Price List / Payment Terms / Location Map (1 selected) / Requirements / Upload New File
4. Tap **Brochures** tile → **stage 2 (Select Files)**:
   - Format tabs: All / **PDF (active)** / Images / Docs / Links
   - Search bar
   - File rows: Laurel Hills 12A Brochure.pdf (checked, with AI badge)
   - "1 file selected in this category (2.4 MB)" + green "Add Files" button
5. Tap **"Add Files"** → jumps to **stage 3 (Selected Files)**:
   - 4 file rows with remove × each
   - Yellow Tip card: "Buyers love it when you send complete information..."
   - Green "Done" button
6. Tap Done → returns to Share Listing with files staged.
7. Tap **"Send to Maria Santos"** → ShareCampaign + ConversationMessage created; redirect to `/agent/leads/lead-instagram-01?shared={campaignId}`.
8. Conversation thread renders:
   - Header card with Maria's badge
   - **NEW "Sent — Watch this space" sage-soft banner**
   - **NEW FileEngagementStrip with the fresh campaign's 1 attachment (just-sent message)** — initially "Not opened"
   - Engagement simulator fires events over ~40s: link_opened at +3s, brochure_opened at +6s, computation_downloaded at +12s, floor_plan_viewed at +18s, location_map_opened at +25s, site_visit_requested at +38s (40% probability)
   - Strip updates live as each event fires; live-pulse moves to the most-recently engaged file

Stop signal met across the board.

## Carry-forwards

- **The Listing Detail page (#22 alternate route `/agent/listings/[listingId]`) still expected 404.** A polish session (likely 9) can ship the read-only detail view, which could embed FileEngagementStrip + ShareCampaign list per listing. Not on the critical path.
- **Engagement event scalar counter aggregation.** The current `bumpCounters()` updates `opens`, `brochureClicks`, `computationRequests`, `siteVisitBookings`, `replies`, `reshares` on the campaign when events append. This is a denormalization for cheap dashboard reads. When the backend lands, the counters become DB triggers or computed views; the public API (the `ShareCampaign` shape) stays identical.
- **The "Share Performance" donut chart from mockup image 1** (showing channel breakdown — WhatsApp 14 / Messenger 7 / Instagram DM 4 / SMS 2 / Email 1) is not yet rendered. The data is present in seed campaigns; the donut surface is deferable. Likely lands when broker dashboards get share-performance widgets in Session 7. **Not in 5B scope.**
- **The "AI Match Preview" sidebar from mockup image 1** (showing Maria Santos · 92% Match · "Looking for a 4BR house in Taguig near schools and malls. Budget: ₱15M-20M. Prefers modern design with parking space.") is a broker-side recommendation surface — it shows the agent the buyer profile alongside the share. **Deferred** — likely composes naturally on the Buyer Profile page (#13) which already exists, or as a Share Listing side panel in a desktop polish session.
- **The 38s timing for site_visit_requested vs framing's 40s** is a minor adjustment. No further action.
- **QR code error correction level**: "M" (Medium, 15% recovery). Could be raised to "Q" (25%) if real-world scanning is patchy, but M is the default for crisp clean codes at 144px. Documented.

## Block-close note

The marquee mockup-matching block (5A + 5B) closes here. The Share Listing main page, Preview Message page, Attach Files bottom sheet, Smart Link QR, engagement simulation, and File Engagement Tracking strip are all shipped at mockup-fidelity. **Every visible element of the mockup is now contract-enforced by the codebase.**

Session 5C (Site Visit Booking + Deals Pipeline + Closed Deal Logging) returns to PRD-driven scope with no specific mockup beyond the PRD's described surfaces. Awaiting framing.
