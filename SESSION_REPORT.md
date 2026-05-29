# Session 5A — Report

**Branch:** `main`
**Stop signal:** met. Share Listing main page (#21) + Preview Message page (#23) at mockup-fidelity. AI Share Message engine + outbound-variant tone application + send architecture (campaign + thread message, linked) + smart-link generation all built and verify-locked. First marquee mockup-matching session complete.

## At a glance
- **TypeScript:** clean
- **Build:** 34 routes (was 32). +2 share routes. Share Listing 8.63 kB / 136 kB First Load; Preview 5.62 kB / 127 kB
- **Verify:** **1113 / 1113 passed** (+109 from Session 4B's 1004). **Section 14 Share Listing: 96 new asserts — largest single-session verify section to date** (Section 9 AI Reply: 80; Section 10 Listings spine: 75; Section 12 Listings 4B: 75)
- **PRD coverage:** **27 complete** · 0 scaffolded · 19 pending of 46
- **Walkability:** Unit Inventory → Share Listing → Refine (tones + languages) → Preview Message → Send → conversation thread receives the message with shareCampaignId link

## What shipped (Session 5A's 2 promotions)

| # | Route | Status | Notes |
|---|---|---|---|
| 21 | `/agent/listings/[listingId]/share` — Share Listing | pending → **complete** | Property hero + AI Generated Message panel (rule transparency) + 4 attach chips + 6-channel row + Smart Link card + recipient picker + sticky "Send to {Buyer}" CTA + Refine sheet |
| 23 | `/agent/listings/[listingId]/share/preview` — Preview Message | pending → **complete** | Phone-style chat bubble + inline listing card preview + 4 attachments + Send Now + Edit Message |

(#22 attach-files sheet remains pending — sheet implementation is Session 5B per framing; affordance is present in 5A.)

## Architectural decision documented: Send = campaign + thread message, linked

Framing carry-forward question answered: **both, with linkage**. The Send action creates a `ShareCampaign` (engagement metadata: opens, brochure clicks, computation requests, site visit bookings, replies) AND a `ConversationMessage` (buyer-visible message text). The two reference each other via `ConversationMessage.shareCampaignId` (new field, not new entity — justification logged). Backend wiring later: `shareCampaignId` becomes a foreign key.

Why both rather than one or the other:
- A single `ShareCampaign` record would not appear in the buyer conversation thread, breaking the unified-inbox experience the PRD describes
- A single `ConversationMessage` would not have an engagement-tracking surface, breaking the smart-link analytics the PRD describes
- The linkage lets the conversation row surface "this message came from a share campaign" and route to the campaign analytics

## Sibling-helper pattern: `applyShareTone()` not `applyTone(..., context: "share")`

The carry-forward from Session 3B framing — "Refine sheet pattern composed directly from 3B or needed adjustment" — landed on **adjustment**. Created `lib/logic/aiShareTone.ts` as a sibling to `lib/logic/aiReply/tones.ts`. Same `Tone` union (8 tones reused). Different per-tone shaper because outbound shares require different opener boilerplate. The reply variant inserts "Thank you for your inquiry" / "I'm really glad you reached out" — appropriate to inbound, wrong for outbound.

**`SHARE_FORBIDDEN_PHRASES` table** locked by verify: outbound tone outputs must never include any of the inbound-context phrases. Cross-contamination guard.

This is the same single-responsibility-helpers principle the framing flagged for `shareActionFor()` in 4B's closeout. **Naming this as a documented codebase principle**: when two adjacent contexts share a vocabulary (tones) but differ in shaping logic, prefer the sibling helper over a context-arg overload. Single-purpose pure functions compose more cleanly.

## Mockup ambiguities surfaced (NOT silently resolved)

Per the governing rule — "substantive deviations are reviewer's call, not the builder's." Surfacing for ratification:

1. **AI Recommendation side panel from the mockup deferred to 5B's Attach Files sheet.** The mockup shows a side panel: "Based on Maria's request, we recommend attaching the sample computation and brochure" with [Brochure] [Computation] chips. This is AI **file** recommendation (distinct from AI message generation). Per PRD: "AI should recommend files based on buyer question." Naturally belongs inside the Attach Files sheet — when the agent opens the sheet, AI surfaces "based on the buyer's last message, suggest these files." Logged the routing. **Asking you to ratify that this side panel surface is the right destination for 5B, not 5A.**

2. **Engagement Tracking / Share Performance / AI Match Preview side panels (mockup image 1) are POST-share views.** Meaningful only after a campaign has been sent. They're 5B's territory (smart-link tracking, engagement events). 5A renders the Share Listing PRE-send state.

3. **Channel set count discrepancy between mockups.** Image 1 shows 6 channels (Messenger / WhatsApp / Instagram DM / SMS / Email / More). Image 2 shows 5 (WhatsApp / Messenger / SMS / Email / More — no Instagram DM). I went with image 1's 6 since PRD explicitly lists 6 in the share-via section.

4. **Property hero image rendered as a CSS gradient placeholder, not a real photo.** The mockup uses a real property render; 5A doesn't ship image assets. The placeholder reads as a property thumbnail (charcoal slate gradient) and is acceptable at the polish bar for screenshot-defensibility. Real imagery is a 5B/9 concern.

5. **PRD bottom-nav vs current AppShell.** PRD specifies agent bottom nav as Dashboard / My Leads / My Listings / Commissions / Insights. Current AppShell has Dashboard / Leads / Listings / Deals / Earnings. The mockup shows PRD layout. **Deferred to a polish session (likely 9)** — changing the nav is structural and touches existing routes.

## Demo anchor verified

The mockup's exact message text emerges from the rule engine on Maria + Laurel 12A:

> "Hi Maria! Based on your budget and preference for a family-friendly home in Taguig, I think this property might be a great fit for you.
>
> Laurel Hills Estate — Unit 12A is a 4BR house & lot near schools, malls, and major roads.
>
> Would you like me to send the sample computation?"

Maria's profile (`purposeOfPurchase: "End-User"`, `familySize: 5`, `preferredLocations: ["Taguig", "BGC"]`) routes to the `familyEndUser` rule. The rule's body interpolates "Taguig" from her preferred locations, the listing title verbatim, and "4BR house & lot" from the listing's property type. The closer matches the mockup. **Verify locks every phrase.**

## 4-pronged structural proof on profile variation

Profile-driven message variation locked by verify with semantic-shape assertions (per the methodology refinement from 3B):

- **Prong 1 — rule routing:** family profile → `familyEndUser`; investor profile → `investor`
- **Prong 2 — vocabulary inclusion:** family body contains "family-friendly"; investor body does not
- **Prong 3 — vocabulary inclusion:** investor body mentions "yield" / "ROI" / "appreciation"; family body does not
- **Prong 4 — action set:** family actions include `book_site_visit`; investor actions do not

Each prong measures what the UI actually distinguishes between profiles, not length or count.

## All carry-forwards documented (no review needed)

- **AI Share rule set documented** in `SHARE_RULES` declarative table with description + priority per rule. Same transparency discipline as 3B's `TONE_MARKERS` and 4B's `SEARCH_RULES`. **Rule of Three confirmed for declarative rule tables across the codebase.**
- **Send action wiring documented:** ShareCampaign + ConversationMessage linked via `shareCampaignId`. Field, not entity. Justification logged.
- **Sibling-helper pattern (`applyShareTone` not context arg on `applyTone`) named as a codebase principle.** Same shape as the framing's `shareActionFor` instinct.
- **Smart link URL determinism locked** by verify: `smartLinkFor(listingId, agentId, buyerLeadId)` → `https://estatehq.ph/l/{slug}-{4charHash}` with FNV-1a base36 hash. Same inputs → same URL; different inputs → different URL.
- **Listing detail (`/agent/listings/[listingId]`) still expected 404.** The share route lives at `/agent/listings/[listingId]/share` — the missing detail page doesn't block the share flow. Polish session or Session 5B can ship the detail view.
- **`shareActionFor()` sixth helper NOT extracted yet.** The framing flagged this for "Share with buyer" vs "Share to my pipeline" context discrimination. In 5A all surfaces route to the same share page; the source context doesn't currently change destination behavior. Rule of Three not yet met. Will surface in 5B/7 when broker-side distribution lands with a genuinely different action ("Distribute to N agents" with the AI-recommended agent picker).

## Verify suite delta (1004 → 1113)

| Section | Asserts | Delta | Notes |
|---|---|---|---|
| 1. FK Integrity | 483 | +8 | new property files (Floor Plan + Location Map for Laurel 12A) add FK pairs |
| 2. Structural invariants | 70 | — | |
| 3. Demo beats | 20 | — | |
| 4. Role-aware aggregation lock | 5 | — | |
| 5. Commission Tracking mockup | 27 | — | tensions still recorded; Q1 (Option B) lands in S6 |
| 6. Auth flow & schemas | 69 | — | |
| 7. Dashboard math | 29 | — | |
| 8. Inbox & contradiction | 22 | — | |
| 9. AI Reply | 80 | — | |
| 10. Listings spine | 75 | — | |
| 12. Listings 4B | 75 | — | |
| **14. Share Listing** | **96** | **+96** | NEW — largest single-session verify section to date. Covers SHARE_RULES totality, demo anchor (Maria+Laurel→familyEndUser), mockup-anchor text fidelity, 4-pronged profile-variation proof, determinism, applyShareTone × 8 tones with forbidden-phrase guard, pairwise tone distinctness, per-tone greeting locks, smart-link determinism + input sensitivity, send action wiring (campaign + message), 4-file mockup anchor, Maria/Maria disambiguation, 5-channel coverage, send link integrity |
| **15. PRD Coverage** | **62** | **+5** | renumbered from 13; Session 5A advancement (2 routes × 2 + aggregate) |
| **Total** | **1113** | **+109** | |

## Demo walk (validated end-to-end)

1. From `/agent/listings`, tap For Sale → tap Developer Listings preview "See all" → tap Landmasters → tap Laurel Hills Estate → Unit Inventory loads with 6 units.
2. Tap "Share to my pipeline" on unit-laurel-12a → routes to `/agent/listings/listing-laurel-12a/share`.
3. **Share Listing main page** renders:
   - Header: ← back / Share Listing / Preview →
   - Hero card: gradient placeholder + "Laurel Hills Estate — Unit 12A" + "4BR House & Lot" + "Taguig City" + Developer Listing / For Sale badges + ₱18,500,000 + 3% Commission
   - AI Generated Message: gold-soft panel with "✨ AI Generated Message · rule: familyEndUser" + Regenerate button. Textarea: "Hi Maria! Based on your budget and preference for a family-friendly home in Taguig..." + rule description below
   - Tone: Friendly Agent · Language: English · Refine pills below
   - 📎 Attach Files (4): [Brochure 2.4 MB · PDF] [Computation 480 KB · PDF] [Floor Plan 1.8 MB · JPG] [Location Map 256 KB · PDF] [+ Add More]
   - Share via: 6 chips — Messenger (blue active) / WhatsApp / Instagram DM / SMS / Email / More
   - Smart Link Created: `https://estatehq.ph/l/laurel-12a-XXXX` + Copy Link + QR code row
   - Send to: [Maria Santos] active chip + other lead chips
   - Sticky CTA: ✉️ **Send to Maria Santos** (sage-deep)
4. Tap Refine → bottom sheet with 8 tones × 3 languages × Regenerate. Switch to "Professional Broker" → message regenerates: "Good day, Maria. Based on your budget..."
5. Switch language to Tagalog → "Kumusta, Maria po! Based on your budget..." + Salamat closer.
6. Tap Preview top-right → `/agent/listings/listing-laurel-12a/share/preview`.
7. **Preview Message page** renders:
   - Header: ← back / Preview Message / Eye via Messenger
   - Canvas-sunken bubble area with faux sender row (avatar "MS" + "Maria Santos / Messenger · to Maria Santos")
   - Sage-soft chat bubble with intro paragraph + inline listing card (gradient + "Laurel Hills Estate" + "4BR House & Lot" + ₱18,500,000 + "Near schools, malls and major roads.") + trailing paragraph + timestamp + sage-deep ✓✓
   - Attachments (4) card with 4 file rows (PDF/JPG color-coded icons + Eye view affordance)
   - "Files will be sent as attachments."
   - Sticky: ✉️ Send Now (sage-deep) + ✏️ Edit Message (ghost)
8. Tap Edit Message → returns to Share Listing.
9. Tap Send to Maria Santos → ShareCampaign + ConversationMessage created; routes to `/agent/leads/lead-instagram-01?shared={campaignId}` → message appears in Maria's thread.

Stop signal met across the board.

## One framing question for Session 5B

Per the surfaced ambiguity above: **does the AI file recommendation belong inside the Attach Files sheet (my instinct, naturally located when the agent opens the sheet) or as a sidebar/panel on the Share Listing main page (matching the mockup image 2 left side)?**

My instinct: **inside the sheet.** The agent opens the sheet to choose files; the AI suggestion naturally surfaces at the top of the sheet ("✨ Based on Maria's last message, we suggest these files first"). This keeps the Share Listing page itself clean and matches the progressive-disclosure principle.

The mockup shows it as a sidebar, but that mockup composition appears to be the desktop/educational layout (the bottom row of mockup image 2 shows the actual mobile sheet without the sidebar). Confirming the routing call.

---

**Next:** Session 5B — Attach Files sheet + Smart Link tracking + File Engagement strip + AI file recommendation. The second half of the Share flow surface block. After 5B, Session 5C covers Site Visit Booking (#24) and Deals Pipeline (#25). Awaiting framing.
