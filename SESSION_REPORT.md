# Session 5C — Report

**Branch:** `main`
**Stop signal:** met. Site Visit Booking (#24) shipped with list + detail + booking form. Deals Pipeline (#25) shipped with stage-distribution overview + mobile timeline + desktop collapsible-phase kanban + Deal Detail with 9-stage progress strip + AI Suggested Next Action + required-document checklist gate + Closed Deal Logging sheet. The deal lifecycle is walkable end-to-end (book a site visit → complete it → convert to deal → advance through pipeline stages with required documents → close to won via Closed Deal Logging sheet → see commission flip via expectedCommissionStatusFor). The marquee block (5A + 5B) is closed; 5C closed PRD-driven scope. **Session 6 marquee block (Commission Tracking) opens next** and reads what 5C wrote.

## At a glance
- **TypeScript:** clean
- **Build:** **39 routes** (+5 from 5B's 34). New: `/agent/site-visits` (1.98 kB), `/agent/site-visits/[id]` (2.34 kB), `/agent/site-visits/new` (5.89 kB), `/agent/deals` (6.05 kB), `/agent/deals/[id]` (8.62 kB). All under 130 kB First Load.
- **Verify:** **1431 / 1431 passed** (+162 from 5B's 1269). **Section 17 (Deals Pipeline + Site Visits): 124 asserts** — second-largest single-session section after 5B's 147.
- **PRD coverage:** **30 complete** · 0 scaffolded · 16 pending of 46
- **Walkability:** book a site visit → site visit detail → convert-to-deal (when Completed) → pipeline shows new deal at Site Visit Done → tap deal → see 9-stage strip + AI Next Action + required-doc checklist → tap docs to mark received → Advance button enables → advance through Documents Submitted → Financing Approved → Contract Signed (opens Closed Deal Logging sheet with final price + closing date + commission flip preview) → confirm → deal at Contract Signed; commission row's expected status shows "For Closing"

## What shipped (Session 5C's 2 promotions + 5 new routes)

| # | Route / Surface | Notes |
|---|---|---|
| 24 | `site-visit-booking` | pending → **complete**. List + detail + booking form. 3 routes (`/agent/site-visits`, `/.../[id]`, `/.../new`). Calendar/week view deferred to Session 9. |
| 25 | `deals-pipeline` | pending → **complete**. 2 routes (`/agent/deals` with mobile timeline + desktop collapsible-phase kanban, `/.../[id]` with progress strip + AI Next Action + required-doc gate + Closed Deal Logging sheet). |
| — | Closed Deal Logging sheet | Modal, not a route. Triggered when advancing into Contract Signed. Final price + closing date + handoff notes + commission flip preview. |
| — | AI Suggested Next Action | Co-located in `dealStageDerivations` (NOT a sibling helper — composes from existing stage-routing). 11-rule declarative table with rule transparency. |

## Architectural decisions documented

- **Desktop kanban: Option C (collapsible phase groups)** chosen over A (narrow columns) and B (sticky first+last). At 9 stages on 13" screens, A produces unreadably tight columns (~90px each); B preserves anchors but hides the active middle. C collapses entire phases (Discovery / Qualification / Closing × 3 stages each), letting the agent expand only the phases they're working on. Mobile uses the vertical timeline instead — same data, calmer surface for narrow viewports. **Matches the calm-UX discipline from 5A/5B: hide what's not active.**
- **Required-document gating** in `STAGE_REQUIREMENTS` declarative table — the 6th declarative rule table in the codebase. Per-stage required documents (Lead Generated 0; Buyer Qualified 1; Site Visit Done 1; Reservation Paid 1; Documents Submitted 3; Financing Approved 2; Contract Signed 1; Commission Processing 1; Commission Released 1). UI surfaces a tap-to-toggle checklist; Advance button gated. 4-pronged structural proof in verify.
- **Rule of Six for declarative rule tables CONFIRMED.** TONE_MARKERS (3B) / SEARCH_RULES (4B) / SHARE_RULES (5A) / FILE_RECOMMENDATION_RULES (5B) / SIMULATOR_TIMINGS (5B) / **STAGE_REQUIREMENTS (5C)** + NEXT_ACTION_RULES (5C). The pattern is now firmly the codebase's default for any rule-driven module: declared table + verify lock + transparency UI.
- **AI Suggested Next Action did NOT earn a sibling helper.** Decision: co-located in `dealStageDerivations.ts` as `suggestNextAction(deal)`. Rationale: the rule routing is so tightly coupled to stage data that splitting into a sibling adds surface area without separation value. **The sibling-helper pattern earns its weight when two helpers diverge in input/output** (the 5A/5B pair `applyShareTone` ↔ `applyTone`, `recommendFilesFor` ↔ `generateShareMessage`); here the inputs/outputs are too coupled. Documented as a deliberate non-application of the pattern.
- **Role-aware dealsForUser via parentId** — not via a denormalized `agentIds` field on User. Pure function takes `allUsers` as input to resolve the team graph. Realtor visibility includes direct network + transitive (agents under brokers under the realtor). Matches the existing role-aware pattern from 3A/4A.
- **Deal.commissionId optional.** PRD semantics: the commission lifecycle begins at Reservation Paid. Early-stage deals (Lead Generated / Buyer Qualified / Site Visit Done) legitimately have no commission row. FK check updated to handle the optional case. **Mockup-anchor preserving**: the early-stage deals added to agent-001's pipeline don't introduce new commission rows, so agent-001's total commission stays at ₱536,250 (locked by Section 17).
- **Closed Deal Logging as a sheet.** Modal, not a route. Triggered when the Advance action would move the deal into Contract Signed. Captures final closing price (defaults to contract price; can differ), closing date, handoff notes. Inline preview of the commission flip: "Deal advances to Contract Signed. Commission flips to For Closing and progresses to For Payout as the deal moves through Commission Processing." The actual flip is the declarative mapping in `expectedCommissionStatusFor(stage)`.
- **Session 6 hand-off pattern (Commission Tracking marquee).** `expectedCommissionStatusFor(stage)` is the declarative mapping that Session 5C writes and Session 6 reads. The Commission Tracking dashboard surfaces the same mapping as the Money on the Way KPI cards animate as deals advance through Closing.
- **Deal stage names exactly per PRD** with one minor preservation: PRD says "Financing / Payment Approved" → type uses "Financing Approved" (already shortened in DEAL_STAGES from Session 1; would ripple across multiple files to change). Documented; not a defect.

## Mockup ambiguities surfaced (NOT silently resolved)

(None — Session 5C is PRD-driven, no specific mockup beyond the PRD's described surfaces. The framing called this out: "5C returns to PRD-driven scope with no specific mockup beyond the design system the build has established.")

## 4-pronged structural proof on stage advancement gate

Deal at Reservation Paid with missing docs (anchor: deal-014 Lara Hizon, missing Income proof + Reservation agreement):
- **Prong 1:** deal-014 cannot advance with missing docs (`gate.canAdvance === false`, `gate.next === "Documents Submitted"`, `gate.missingForNext` non-empty)
- **Prong 2:** with `missingDocuments: []`, deal can advance (`gate.canAdvance === true`, `gate.missingForNext` empty)
- **Prong 3:** unrelated missing docs do NOT block advancement (gate evaluates ONLY next-stage requirements — setting "Some unrelated doc" missing doesn't block since it's not in `STAGE_REQUIREMENTS["Documents Submitted"]`)
- **Prong 4:** at end of pipeline (Commission Released), no advancement possible (`gate.next === undefined`, `gate.canAdvance === false`)

Each prong measures distinct gate behavior, not surface properties.

## Commission flip mapping (Session 5C writes → Session 6 reads)

```
Reservation Paid       → "For Approval"
Documents Submitted    → "For Approval"
Financing Approved     → "For Approval"
Contract Signed        → "For Closing"   ← closing event
Commission Processing  → "For Payout"
Commission Released    → "Paid"
```

Session 6's Commission Tracking dashboard reads this mapping. The flip from "For Closing" → "For Payout" is the "Money on the Way" animation moment.

## AI Suggested Next Action routing (11 rules)

| Stage / Condition | Rule | Label |
|---|---|---|
| Lead Generated | `leadGen_noMessage` | Send an introductory message |
| Buyer Qualified | `buyerQualified_noSiteVisit` | Book a site visit |
| Site Visit Done | `siteVisitDone_noReservation` | Collect reservation fee |
| Reservation Paid + missing docs | `reservationPaid_missingDocs` | Request remaining buyer documents |
| Reservation Paid + docs ready | `reservationPaid_docsReady` | Submit documents to developer |
| Documents Submitted | `documentsSubmitted_awaitingFinancing` | Follow up on financing approval |
| Financing Approved | `financingApproved_prepareContract` | Prepare and route the Contract to Sell |
| Contract Signed | `contractSigned_processCommission` | Endorse for commission processing |
| Commission Processing | `commissionProcessing_awaitPayout` | Monitor commission release |
| Commission Released | `commissionReleased_celebrate` | Log the closed-deal narrative |
| (fallback) | `fallback` | Check in with the buyer |

UI surfaces the rule key as "rule: {ruleKey}" subtitle. Same transparency pattern as `aiReply` / `aiShareMessage` rule names. Verify-locked per stage probe.

## Verify suite delta (1269 → 1431)

| Section | Asserts | Delta | Notes |
|---|---|---|---|
| 1. FK Integrity | 520 | +31 | new site visits + new deals + comm-014 + optional commissionId handling |
| 2. Structural invariants | 72 | +2 | optional commissionId discipline |
| 3. Demo beats | 20 | — | |
| 4. Role-aware aggregation lock | 5 | — | |
| 5. Commission Tracking mockup | 27 | — | unchanged — mockup anchor preserved |
| 6. Auth flow & schemas | 69 | — | |
| 7. Dashboard math | 29 | — | activeDeals 4→6, siteVisitsBooked 2→3 reflected |
| 8. Inbox & contradiction | 22 | — | |
| 9. AI Reply | 80 | — | |
| 10. Listings spine | 75 | — | |
| 12. Listings 4B | 75 | — | |
| 14. Share Listing | 96 | — | |
| 16. Attach Files + Engagement | 147 | — | |
| **17. Deals Pipeline + Site Visits** | **124** | **+124** | NEW — second-largest single-session section. STAGE_REQUIREMENTS totality + 4-pronged advancement gate proof + isClosedWon + expectedCommissionStatusFor flip + NEXT_ACTION_RULES totality + 8-stage probe + Reservation Paid two-variant routing + dealsForUser role-aware (Agent/Broker/Realtor + no leakage) + Ron Marquez Saturday-2pm anchor (status/agent/timestamp/Saturday-UTC) + sv-008 No-show anchor + site visit status variants + isUpcomingStatus + partitionSiteVisits (asc/desc/total-preserved) + convertSiteVisitToDeal (Site Visit Done stage + reference preservation + Reservation Paid reqs in missingDocuments) + groupDealsByStage covers all 9 stages + early-stage pipeline density + early-stage deals have NO commissionId invariant + comm-014 anchor + Session 6 mockup anchor preserved (agent-001 total = ₱536,250) + deal-012 composes with share-006 narrative. |
| 18. PRD Coverage | 70 | +5 | renumbered from 15; Session 5C advancement (2 routes × 2 + aggregate) |
| **Total** | **1431** | **+162** | |

## Demo walk (validated end-to-end)

1. From `/agent/site-visits`:
   - Header: "Site Visits" + Book CTA
   - Status filter chips: All (9) / Proposed (1) / Confirmed (3) / Reminder Sent (1) / Completed (1) / No-show (1) / Converted (2)
   - **Upcoming section (top): Ron Marquez Saturday-2pm Proposed at the very top** (sv-007, sage chip), then Confirmed visits sorted asc by scheduledAt
   - Past section: Completed / Converted / No-show sorted desc by scheduledAt
2. Tap Ron's row → site visit detail:
   - Header card: Ron Marquez + Veranda 8F + Proposed badge
   - Schedule card: "Saturday, May 31, 2:00 PM" · Asia/Manila · "The Veranda sales pavilion — Ron prefers Saturday afternoons"
   - Notes: "Demo anchor: Ron Marquez Saturday 2pm — proposed slot pending buyer confirmation"
   - Linked: open Ron's conversation (lead-portal-02) + Veranda 8F listing
   - Reminders card: "A reminder will be sent to the buyer 24 hours before the visit and again 2 hours before."
3. Tap a Completed visit (Bea Castro, sv-006) → see Convert-to-Deal CTA: "Create Deal at Site Visit Done"
4. `/agent/deals` (pipeline):
   - Header: "Deals Pipeline · 14 deals · 11 active across 9 stages"
   - Stage distribution overview: 9-cell grid with counts (1 / 1 / 1 / 1 / 2 / 0 / 3 / 1 / 3)
   - Mobile timeline: per-stage cards with deals nested
   - Desktop (lg+): 3 collapsible phase groups (Discovery 3 deals / Qualification 3 deals / Closing 7 deals)
5. Tap **deal-014** (Lara Hizon, Reservation Paid):
   - Header: Lara + Amaia Steps RFO + Reservation Paid badge + ₱4,500,000
   - Pipeline strip: 9 dots with stage 4 (Reservation Paid) emphasized gold-soft ring
   - AI Suggested Next Action: "Request remaining buyer documents · rule: reservationPaid_missingDocs · Reservation paid but docs incomplete — chase the requirements"
   - **Advancement card: "Advance to Documents Submitted" + 2 missing badge**; checklist shows 3 docs: Buyer valid ID (checked sage), Income proof / employment certificate (missing circle), Reservation agreement (missing circle)
   - **Advance button DISABLED** while missing
6. Tap "Income proof" → toggles to received (sage check); tap "Reservation agreement" → toggles to received → **Advance button enables**
7. Tap Advance → stage moves to Documents Submitted; new checklist appears for Financing Approved reqs (Bank letter of approval / Signed financing terms)
8. Toggle the new requirements as received → Advance → Financing Approved → Advance → **prompts to advance to Contract Signed → opens Closed Deal Logging sheet**:
   - Final closing price input (defaults to ₱4,500,000)
   - Closing date picker
   - Handoff notes textarea
   - "What happens next" sage banner: "Deal advances to Contract Signed. Commission flips to For Closing and progresses to For Payout as the deal moves through Commission Processing."
   - Log closed deal button
9. Confirm → deal moves to Contract Signed; Commission row's expected status updates to "For Closing"

Stop signal met across the board.

## Carry-forwards

- **The Listing Detail page (`/agent/listings/[listingId]`) still expected 404.** A polish session can ship the read-only detail view; not on the critical path.
- **The PRD bottom-nav vs AppShell discrepancy** noted in 5A's report remains for Session 9 polish.
- **Calendar/week view for Site Visits** (PRD lists both list + calendar) deferred to Session 9. List is sufficient for the demo.
- **The 9-stage kanban on desktop uses 3 phase groups, not 9 columns.** If a future demo needs all 9 columns visible at once, the layout choice would need to be revisited. For now, Option C is the right calmness/density trade-off.
- **Closed Deal Logging sheet does not yet persist the final price.** Demo state only. Backend wiring lands when the persistence layer arrives.
- **The PRD bullet "host membership (agent's broker/realtor)" for site visit booking** is not yet a UI affordance — the host is inferred from the lead's assigned agent. A Session 9 polish session could add a "host" field if the demo needs it.

## Block-close note + Session 6 framing setup

**Session 5C closes the PRD-driven scope leading up to the marquee.** The next session (Session 6) is the second marquee mockup-matching session — Commission Tracking. The build returns to mockup-fidelity discipline.

**Session 6 reads what 5C wrote:**
- `expectedCommissionStatusFor(stage)` — the declarative commission flip mapping
- Per-stage commission row visibility (For Approval / For Closing / For Payout / Paid / On Hold)
- The Closed Deal Logging sheet's "Money on the Way" preview
- agent-001's preserved commission total (₱536,250) as the marquee anchor

Session 6 will need to surface the Commission Tracking mockup's specific KPI cards, the commission timeline visualization, the campaign-001 May Closing Sprint integration, and the Money on the Way animation. The declarative mapping is the foundation Session 6 builds atop.
