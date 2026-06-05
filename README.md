# Real Estate HQ

An AI-powered real estate sales operating system for agents, brokers, and
realtors in the Philippine market. Real Estate HQ helps users generate
leads, manage listings, share properties, reply professionally to buyers,
book site visits, close deals, track commissions, manage agent teams, and
distribute listings across social and messaging channels.

**Status:** clickable prototype, mock data only. Feature-complete against
the product requirements; ready for backend wiring as a subsequent phase.

**Standalone product.** Real Estate HQ is not part of a larger platform
and does not integrate with any property-management or post-sale
operations system. The data model is designed for the Philippine real
estate sales workflow specifically.

---

## Contents

- [Project overview](#project-overview)
- [Demo highlights](#demo-highlights)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Key features](#key-features)
- [Architectural patterns](#architectural-patterns)
- [Verify suite](#verify-suite)
- [Data model](#data-model)
- [AI features](#ai-features)
- [Known limitations](#known-limitations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [Methodology](#methodology)

---

## Project overview

Real Estate HQ is a role-aware sales platform with three primary roles —
**Agent**, **Broker**, **Realtor** — each with their own dashboard,
navigation, and scope. Agents work leads and listings; brokers manage
agent teams and run distribution campaigns; realtors operate at a network
level. The application surfaces AI-driven assistance throughout (reply
suggestion, listing search, agent recommendation, content generation),
with all reasoning surfaced transparently to the user.

At the time of delivery the build covers 46 of 46 PRD-listed surfaces
across 60 Next.js routes, with 1948 verify assertions locking data
integrity, structural invariants, behavioral correctness, and PRD
coverage. Every value rendered in the UI derives from underlying seed
data; nothing is fabricated for cosmetic effect.

---

## Demo highlights

The build's strongest surfaces for evaluation:

- **Commission Tracking** (`/agent/commissions`) — mockup-fidelity KPI
  strip, donut breakdown, upcoming payouts, commission transactions
  table with role-aware totals. Every value reconciles to underlying
  deal data within ₱1.
- **Buyer Conversation with AI Reply** (`/agent/leads/[id]`) — 8 tones
  × 3 languages (English / Tagalog / Cebuano) with real-time
  regeneration and transparent reasoning rules surfaced as chips.
- **Listing Distribution AI Recommended mode**
  (`/broker/listings/[id]/distribute`) — declarative-rule-driven
  recommendations with per-agent match% and reasoning. The same flow
  is mirrored at `/realtor/listings/[id]/distribute` via a
  parameterized component.
- **Broker Command Center & Realtor Network Dashboard** (`/broker`,
  `/realtor`) — KPI strip, leaderboard, May Closing Sprint card,
  bonus podium. Same parameterized component, role-aware scope.
- **Agent Profile health breakdown**
  (`/broker/agents/[id]`) — 6 health components × `raw% × weight% =
  +contribution` rows that sum exactly to the agent's overall score.
  AI Coaching banner is rule-driven by the weakest component.
- **Content Studio** (`/agent/content-studio`) — 12 PRD content types
  with platform-flavored preview chrome (Facebook card, Instagram
  square, TikTok / Reels script, Messenger blue bubble, WhatsApp green
  bubble, Email envelope), tone and language switching, copy CTA.

A narrative chain ties data across 8 surfaces and 6 development sessions
— Maria Santos's lead, her Laurel Hills deal, Alyssa Garcia's commission,
the broker leaderboard position, the bonus campaign progress, and the
notification feed all reference the same underlying records. The AI
agent-recommendation engine identifies Alyssa as a top match for the
Laurel Hills listing she actually closed, because the underlying data
fires the `topPerformer` rule — the engine reads the data, it does not
pick favorites.

---

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**-style primitives in `components/ui/`
- **Lucide** icons
- **Recharts** for charts (wrapped in `components/ui/DonutChart`,
  `BarChart`, `LineChart` — cross-file invariant disallows inline
  Recharts on analytics pages)
- **Framer Motion** (transitions)
- **class-variance-authority**, **clsx**, **tailwind-merge**

Client-rendered. Mock data only. No backend.

State is managed via React state and a small number of feature-scoped
stores (`lib/conversationStore.ts`, `lib/shareStore.ts`) — there is no
Zustand or Redux. Pure business logic lives in `lib/logic/` as plain
functions, so it remains backend-translatable when the API layer is
added.

---

## Getting started

**Prerequisites:** Node 18+, npm.

```sh
npm install
```

```sh
npm run dev        # http://localhost:3000 (also on your LAN — see below)
npm run build      # production bundle
npm start          # serve production bundle (LAN-accessible)
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run verify     # full verify suite — 1948 assertions
```

**Access from phone or another PC on the same Wi‑Fi:** after `npm run dev`,
open `http://<your-local-ip>:3000` (for example `http://192.168.1.42:3000`).
On Windows, run `ipconfig` and use the **IPv4 Address** of your active adapter.
The dev server binds to `0.0.0.0` so it accepts connections from the local network.
If it does not connect, allow Node through the Windows Firewall when prompted.

Routes are role-prefixed: `/agent/*`, `/broker/*`, `/realtor/*`. The
auth and signup flow lives at `/auth/*`. Notifications and Settings are
shared across roles.

---

## Project structure

```
app/                        # Next.js App Router routes (60 total)
  agent/                    # Agent surfaces (dashboard, leads, listings, …)
  broker/                   # Broker surfaces (command center, agents, …)
  realtor/                  # Realtor network surfaces
  auth/                     # Login, signup, document upload, pending
  integrations/             # Universal integrations surface
  notifications/            # Universal notifications surface
  settings/                 # Universal settings surface
  layout.tsx                # Root layout
  page.tsx                  # Landing / role selector

components/
  ui/                       # Primitives: Button, Card, StatusBadge,
                            #   DonutChart, BarChart, LineChart, …
  auth/                     # Registration form
  commissions/              # Commission Tracking page subcomponents
  conversation/             # Buyer conversation + AI Reply panel
  layout/                   # AppShell (sidebar + mobile nav + bell)
  leads/                    # Lead inbox cards, filter chips
  listings/                 # Listing cards, filters, share flow
  manager/                  # Parameterized broker/realtor components
                            #   (ManagerDashboard, Leaderboard,
                            #    AgentsModule, AgentProfile,
                            #    TeamUpdates, AwardsCampaigns,
                            #    ManagerAnalytics, ListingDistributionFlow)
  share/                    # Share Listing modal + Attach Files sheet

data/                       # Mock seed data (TypeScript modules)
  users.ts                  # Agents, brokers, realtors + hierarchy
  leads.ts                  # 21 leads with sources and scoring
  listings.ts               # Listings + developers + projects + units
  developers.ts             # Developer profiles
  deals.ts                  # 9-stage pipeline deals
  shareCampaigns.ts         # Smart-link shares + engagement events
  siteVisits.ts             # Site visit bookings
  conversationMessages.ts   # Buyer ↔ agent messages
  propertyFiles.ts          # Brochures, floor plans, computations
  teamAndAI.ts              # Team updates, bonus campaigns, AI activity
  integrationsAndNotifications.ts  # 18 integrations + notifications

lib/
  types.ts                  # All entity types (User, Lead, Listing, …)
  data.ts                   # Re-exports seed data + demo constants
                            #   (DEMO_AGENT_ID, DEMO_BROKER_ID,
                            #    DEMO_REALTOR_ID)
  format.ts                 # PHP currency formatters
  cn.ts                     # className utility
  useCurrentRole.ts         # Role hook (single source of truth)
  conversationStore.ts      # Per-conversation message store
  shareStore.ts             # Share campaign state
  registrationSchemas.ts    # Per-role registration validation
  logic/                    # Pure business logic (backend-translatable)
    aiReply/                # AI Reply suggester (tones, languages, suggester)
    aiShareTone.ts          # Outbound-share tone shaping
    aiShareMessage.ts       # Share message generation
    aiFileRecommendation.ts # File recommendation rule table
    aiListingSearch.ts      # Listing search rule table
    agentHealth.ts          # 6-component health scoring
    agentRecommendation.ts  # AGENT_RECOMMENDATION_RULES
    analyticsDerivations.ts # 6 analytics aggregations
    commissionAggregation.ts
    commissionSplit.ts      # Agent / broker / realty split math
    contentTemplates.ts     # CONTENT_TEMPLATES registry
    dashboardDerivations.ts
    dealStageDerivations.ts # STAGE_REQUIREMENTS + NEXT_ACTION_RULES
    engagementSimulator.ts  # SIMULATOR_TIMINGS
    leadInboxDerivations.ts
    leadScoring.ts
    listingsDerivations.ts
    managerDashboardDerivations.ts
    myListingsDerivations.ts
    roleAwareAmount.ts      # amountFor — concentration point
                            # for role-aware commission perspectives

verify/
  index.ts                  # 1948 assertions across 21 named sections
                            # + PRD Coverage report
  prdManifest.ts            # 46 PRD-listed routes with expected elements

CEBUANO_AUDIT_PACK.md       # Native-speaker review pack
LLM_INTEGRATION_NOTES.md    # Claude API integration paths + cost envelope
SESSION_LOG.md              # Per-session decisions (10 sessions)
SESSION_REPORT.md           # Closeout summary
```

---

## Key features

Organized by PRD coverage. All 46 PRD-listed surfaces are present.

### Authentication & onboarding (7 routes)

Splash + login, role selector, per-role registration (Agent / Broker /
Realtor) with role-specific required fields, document upload,
verification-pending state, forgot-password.

### Agent surfaces

- **Dashboard** with greeting, AI Briefing, Money on the Way card,
  recent listing engagement, recommended next action
- **Lead Inbox** with 16 source types, AI scoring, filter chips
  (Hot / New / Site Visit / Needs Reply / Financing / OFW / Investor)
- **Buyer Conversation** with AI Reply panel — 8 tones × 3 languages,
  reasoning rules surfaced
- **Buyer Profile** with AI scoring breakdown, interested listings,
  next best action

### Listings

- **Listings menu** + 7 transaction-type categories (For Sale, For Rent,
  Foreclosure, For Assume, Pre-Selling, RFO, Commercial)
- **Developer Listings** organized by developer →
  **Developer Project View** → **Unit Inventory View** (three distinct
  navigation levels)
- **Private Offerings** (Broker / Agent personal / Owner direct /
  Exclusive / Off-market)
- **My Listings** for agents
- **AI Listing Search** with natural-language queries

### Share + engagement

- **Share Listing** page matching the mockup, with AI-generated buyer-
  ready message, channel selector (Messenger / WhatsApp / Instagram DM /
  SMS / Email)
- **Attach Files** bottom sheet with category-organized files and
  AI-recommended attachments based on buyer question
- **Smart Link** tracking with engagement events (opened, brochure
  clicked, computation requested, site visit booked)

### Deals + commissions

- **Site Visit booking** with calendar + status tracking
- **Deals Pipeline** with 9 stages and AI Suggested Next Action driven
  by `NEXT_ACTION_RULES`
- **Closed Deal Logging** form
- **Commission Tracking** page matching the mockup — KPI strip, donut
  breakdown, upcoming payouts, transactions table, filters, export,
  insights, payout accounts
- **Commission Timeline** with 6-stage progression per deal
- **Money on the Way** motivational view

### Team management (broker + realtor)

- **Command Center / Network Dashboard** with KPI strip, leaderboard,
  team updates, May Closing Sprint
- **Agents Module** with search, filter, health-score badges
- **Agent Profile** with hero card, AI Coaching banner, 4 KPI tiles,
  full health breakdown, deals in flight, commissions by status, leads
  by temperature
- **Listing Distribution** with three modes (AI Recommended / Manual /
  All Agents)
- **Team Updates** compose + history with engagement counters
- **Awards & Bonuses** with active and past campaigns, per-agent
  progress, podium rewards
- **Leaderboard** (positive-framed) with deals, sales, response time,
  conversion rate

### Analytics + notifications

- **Manager Analytics** with 6-chart grid (Lead Volume / Response Time
  / Lead Source / Conversion by Stage / Lead Temperature / Commission
  Status)
- **Notifications** with 14 PRD categories, priority badges, filter
  chips, mark-as-read, tap-through routing

### Content + integrations + settings

- **Content Studio** with 12 content types × 8 tones × 3 languages,
  platform-flavored preview chrome
- **Integrations** with 18 providers, OAuth-style connect flow,
  per-provider manage sheets
- **Settings** with profile, notification preferences (3 delivery
  channels + 14 per-category toggles), language, payout accounts,
  team management (role-aware)

---

## Architectural patterns

The codebase establishes several patterns that future work should reach
for before inventing something new.

### Concentration points

Pure-function modules that own all logic for a single concern. Future
callers compose from these; nobody re-implements the math.

| Module | Owns |
|---|---|
| `lib/logic/roleAwareAmount.ts` | `amountFor(commission, viewer)` — role-aware perspective on commission amounts. Prevents the phantom-commission bug class at the engine layer. |
| `lib/logic/managerDashboardDerivations.ts` | Team-scope resolution, leaderboard, manager KPIs, closing-sprint progress |
| `lib/logic/analyticsDerivations.ts` | All 6 Manager Analytics aggregations + composite snapshot |
| `lib/logic/agentRecommendation.ts` | `AGENT_RECOMMENDATION_RULES` + scorer + ranked recommender |
| `lib/logic/contentTemplates.ts` | `CONTENT_TEMPLATES` registry + content generator |

### Declarative rule tables (Rule of Seven)

Seven rule tables in the codebase. Same shape across all seven: a
declared table mapping keys to weighted rules, a pure scoring function,
a sibling helper for ranked output, UI surfaces the fired-rule reasoning,
the verify suite locks every rule applies correctly.

| # | Rule table | Domain |
|---|---|---|
| 1 | `TONE_MARKERS` | AI Reply per-tone phrasing |
| 2 | `SEARCH_RULES` | AI Listing Search |
| 3 | `SHARE_RULES` | Share Message generation |
| 4 | `FILE_RECOMMENDATION_RULES` | Attach Files AI recommendations |
| 5 | `SIMULATOR_TIMINGS` | File engagement simulator |
| 6 | `STAGE_REQUIREMENTS` + `NEXT_ACTION_RULES` | Deal pipeline progression |
| 7 | `AGENT_RECOMMENDATION_RULES` | Listing Distribution AI Recommended |

### Registries (complementary discipline)

`CONTENT_TEMPLATES` is the first registry — distinct from a rule table:
rule tables score outputs, registries map types to deterministic
builders. Same declarative-data-over-imperative-logic principle, but
different shape. Future work asking "should this be a rule table?"
should first ask "do I want scoring or building?"

### Sibling-helper pattern

Four applications. When two callers need similar I/O but distinct
output shapes (inbound reply vs outbound share, single score vs ranked
set), build a sibling helper that reuses the markers and shaping but
returns the right shape.

| Sibling | Pair |
|---|---|
| `applyShareTone` | ↔ `applyTone` |
| `recommendFilesFor` | ↔ `generateShareMessage` |
| `recommendAgentsForListing` | ↔ `scoreAgentForListing` |
| `generateContentTemplate` | ↔ `generateShareMessage` |

### Single parameterized component

Eight applications across role-aware surfaces. When two routes share
80% of their structure and differ in 20% (broker vs realtor scope,
copy, KPI labels), parameterize via a `role` prop — do not duplicate.

`ManagerDashboard`, `Leaderboard`, `AgentsModule`, `AgentProfile`,
`TeamUpdates`, `AwardsCampaigns`, `ManagerAnalytics`,
`ListingDistributionFlow`.

### Cross-file invariants

Some disciplines transcend the Rule of Three. Wrapping Recharts is
justified at first use because the cross-file invariant
"no inline Recharts on analytics pages" applies. Platform color
literals are constrained to `PLATFORM_VISUALS` per the same logic.

### Pure-function modules

All business logic lives in `lib/logic/` as plain functions, separate
from page components. When the backend layer is added, these modules
move server-side without React dependencies. Page components consume
the results, render the UI, and own only ephemeral state.

---

## Verify suite

`npm run verify` runs all 1948 assertions across 21 named sections plus
a PRD Coverage report. Section breakdown:

| # | Section | Asserts |
|---|---|---|
| 1 | FK Integrity | 520 |
| 2 | Structural invariants | 72 |
| 3 | Demo beats | 20 |
| 4 | Role-aware aggregation lock | 5 |
| 5 | Commission Tracking mockup | 27 |
| 6 | Auth flow & schemas | 69 |
| 7 | Dashboard math | 29 |
| 8 | Inbox & contradiction | 22 |
| 9 | AI Reply | 80 |
| 10 | Listings spine | 75 |
| 12 | Listings 4B | 75 |
| 14 | Share Listing | 96 |
| 16 | Attach Files + Engagement | 147 |
| 17 | Deals Pipeline + Site Visits | 124 |
| 18 | Commission Tracking marquee | 43 |
| 19 | Manager Dashboards | 53 |
| 20 | Team & Distribution | 107 |
| 21 | Analytics & Notifications | 68 |
| 22 | Content Studio + Integrations + Settings | 131 |
| 23 | Session 9 Polish | 77 |
| 24 | PRD Coverage | 108 |
| **Total** | | **1948** |

### What the suite asserts

- **Data integrity** — no orphaned foreign keys, every referenced ID
  exists, every entity has all required fields.
- **Structural invariants** — commission splits sum to the total
  within ₱1; lead source counts sum to total leads; analytics bucket
  counts sum to total counted entities.
- **PRD coverage** — every PRD-listed screen exists as a route; every
  PRD-specified element is present on its surface.
- **Behavioral correctness** — four-pronged structural proofs on AI
  outputs (tone variation produces pairwise-distinct outputs; language
  variation produces structurally distinct outputs).
- **Cross-surface narrative chain** — Maria's lead, deal-012,
  comm-001, the leaderboard position, the bonus podium, and the
  notification feed all agree on the underlying facts.

### Bug classes structurally prevented

- **Role-aware commission perspective** prevented at 3 layers (engine
  via `amountFor`, Commission Tracking aggregation, Dashboard
  aggregation). The verify suite caught two cross-surface drifts
  during development.
- **No new entity types** invariant has held for 10 sessions; the
  entity model is validated by full-scope use without amendment.

### Reading a failing assertion

Verify output groups by section. A failed assertion prints the section
name, the assertion description, and any diagnostic message. Read the
section header to locate the source file (`verify/index.ts`); each
section's function name matches its title.

---

## Data model

20 entity interfaces in `lib/types.ts`. No new entity types were
introduced across the build's 10 surface-bearing sessions.

### Core entities

| Entity | Notes |
|---|---|
| `User` | Agent / Broker / Realtor, hierarchy via `parentId`, license fields, specializations, profile metadata |
| `BuyerProfile` | Buyers are contacts, not platform users — they don't sign in |
| `Lead` | Buyer + source + scoring + temperature; `firstContactedAt` tracks agent first response |
| `Listing` | `ownership` and `transactionType` discriminate ownership types and sale modes |
| `DeveloperProfile`, `Project`, `Unit` | Developer-listed inventory drill-down |
| `Deal` | 9-stage pipeline (Lead Generated → Commission Released) |
| `Commission` | 6-stage timeline; agent / broker / realty amounts split per the engine |
| `ShareCampaign` | The share primitive — used directly for buyer shares AND composed for broker → agent broadcasts. No `BroadcastCampaign` entity exists |
| `SiteVisit` | Booking with status (Proposed → Completed / No-show / Rescheduled / Converted) |
| `BonusCampaign` | Awards & bonuses; eligible / participating agents, podium rewards |
| `TeamUpdate` | Manager → agents broadcasts; 11 update types, 6 channels, 4 audience targets, engagement counters |
| `ConversationMessage` | Buyer ↔ agent chat history |
| `EngagementEvent` | Smart-link tracking (opened, clicked, downloaded, …) |
| `AIActivity` | AI agent activity feed |
| `Integration` | 18 provider types; connection status + error message + leads-captured-today |
| `NotificationItem` | 14 PRD categories × 3 priority levels |
| `PayoutAccount` | Bank account for commission payouts |

### Demo constants

Three reference users seed the demo narrative:

```ts
DEMO_AGENT_ID    = "agent-001"      // Alyssa Garcia
DEMO_BROKER_ID   = "broker-001"     // Maria Santos (the broker; not the buyer)
DEMO_REALTOR_ID  = "realtor-001"    // Alex Reyes
```

The seed has two people named Maria Santos — the buyer (lead-instagram-01)
and the broker (broker-001). Be explicit when introducing each during a
demo.

---

## AI features

All AI surfaces are currently rule-driven (deterministic mock outputs
presented as AI). Four major surfaces plus the Content Studio:

| Surface | Current implementation | Production path |
|---|---|---|
| AI Reply suggester | `TONE_MARKERS` + per-tone templated bodies + `applyLanguage` dispatcher | Claude API call with structured context |
| AI Listing Search | `SEARCH_RULES` natural-language matching | Optional LLM for very-loose queries |
| AI File Recommendation | `FILE_RECOMMENDATION_RULES` keyword routing | Rule-based is sufficient |
| AI Agent Recommendation | `AGENT_RECOMMENDATION_RULES` 8-rule scoring | Hybrid — keep rule scoring as primary signal, add LLM re-rank for soft fit |
| AI Coaching Banner | 6 templates keyed by weakest health component | Claude API call for synthesis |
| Content Studio | `CONTENT_TEMPLATES` registry × `applyShareTone` × `applyLanguage` | Claude API call per content type |

The architectural discipline ensures each AI surface is a swap-in
upgrade: the pure-function module has a stable signature, the UI calls
a thin wrapper, and the verify suite's structural assertions continue
to work as quality gates on LLM output.

See `LLM_INTEGRATION_NOTES.md` for the full integration path with
recommended Claude API shapes and a cost envelope (~$30-50/month for
100 active agents).

---

## Known limitations

Honest scope of the prototype:

- **No backend.** All state is in-memory. Mock seed data in `data/*.ts`.
  Page-level state via React; per-feature stores
  (`lib/conversationStore.ts`, `lib/shareStore.ts`) for cross-component
  state. The action signatures are designed to map cleanly to future
  API endpoints — sending a message, creating a share campaign,
  advancing a deal stage all look like reasonable REST or RPC
  operations.
- **No real authentication.** The role selector at `/auth/signup` and
  the demo user constants (`DEMO_AGENT_ID`, etc.) substitute. The
  registration form validates inputs but does not persist.
- **No real file uploads.** Attached files are seeded entries with
  metadata (name, size, type icon) — no actual binary content.
- **No real LLM calls.** AI surfaces are deterministic mock outputs.
  See `LLM_INTEGRATION_NOTES.md` for the swap-in path.
- **Cebuano content audit pending.** The Cebuano output uses
  programmatic framing ("Maayong adlaw" opener, "Salamat kaayo"
  closer) — the body is English. Full translation requires either an
  LLM hookup or a human pass. The structural correctness (presence of
  Cebuano markers, absence of Tagalog "po") is verify-locked. See
  `CEBUANO_AUDIT_PACK.md` for the native-speaker review pack.
- **No real notifications delivery.** Notifications are in-process
  seed data; in production they would arrive via webhook or push.
- **No real photography.** Listing imagery uses CSS gradient
  placeholders.
- **Demo seed sized for narrative coherence.** 9 agents under
  broker-001, 12 agents across realtor-001's network. The data model
  handles arbitrary team sizes; the seed is intentionally small to
  keep the demo focused.

---

## Deployment

The repo builds as a standard Next.js app. `npm run build` produces a
production bundle.

**Production:** [https://rehq.appssandbox.com](https://rehq.appssandbox.com)

Site metadata (title, description, Open Graph / Twitter preview, favicon,
and web manifest) is configured in `lib/site.ts` and `app/layout.tsx`.
Brand PNGs live in `app/` (Next metadata files) and `public/` (stable URLs
for manifest and social tags). Regenerate with
`pip install Pillow && python scripts/generate-brand-assets.py`.

### Vercel (recommended)

Repository: [github.com/nicox-nic/real-estate-hq-new](https://github.com/nicox-nic/real-estate-hq-new)

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account (`nicox-nic`).
2. **Add New… → Project** → import **real-estate-hq**.
3. Confirm defaults (Vercel auto-detects Next.js):
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** (leave empty — Next.js default)
4. Deploy. No environment variables are required for the mock-data prototype.

After the first deploy, Vercel assigns a `*.vercel.app` URL; you can add a custom domain under **Project → Settings → Domains**.

CLI alternative (after `npx vercel login`):

```sh
npx vercel link
npx vercel --prod
```

The build is also portable to Netlify or self-hosted Node when wired to a
backend.

---

## Contributing

### Coding conventions

- **TypeScript strict** — no `any` except at carefully-scoped
  boundaries.
- **No inline platform color literals** outside `PLATFORM_VISUALS`.
- **No inline Recharts on analytics pages** — use `BarChart`,
  `LineChart`, `DonutChart` wrappers.
- **Pure-function logic modules** in `lib/logic/` — page components
  consume results, don't compute them.
- **Role-aware components parameterized** — one component with a
  `role` prop, two routes that mount it.

### Adding a new feature

Before writing code, decide which patterns apply:

1. Does it need a single source of truth for some computation?
   → Concentration point in `lib/logic/`.
2. Is it scoring outputs (recommendation, search, classification)?
   → Declarative rule table; eighth rule table earns the next number
   in the sequence.
3. Is it mapping types to deterministic builders (templates,
   configurations)?
   → Registry, complementary to rule tables.
4. Does it have similar I/O to an existing helper but a distinct
   output shape?
   → Sibling helper.
5. Does it render two routes with role-driven differences?
   → Single parameterized component with a `role` prop.

### Adding seed data

Maintain the narrative chain invariants. The verify suite locks the
demo path empirically (Section 23) — adding leads, deals, or
commissions should not change Alyssa's leaderboard position, the May
Closing Sprint podium, or the Maria/Laurel chain unless intentionally
updating these landmarks. Run `npm run verify` before committing.

### Adding a new route

Update `verify/prdManifest.ts` with the new route entry. The PRD
Coverage section asserts every manifest entry exists and is marked
complete. If the route mirrors an existing one (broker / realtor
parity), prefer the parameterized component pattern over copy-paste.

### Before committing

```sh
npm run typecheck
npm run verify
npm run build
```

All three must pass.

---

## Documentation

| File | Purpose |
|---|---|
| `README.md` | This document |
| `SESSION_LOG.md` | Per-session architectural decisions across the 10 development sessions |
| `SESSION_REPORT.md` | Closeout summary at delivery |
| `CEBUANO_AUDIT_PACK.md` | Compiled English / Cebuano content pairs for native-speaker review, with reviewer checklist |
| `LLM_INTEGRATION_NOTES.md` | Claude API integration paths for the 4 AI surfaces, with recommended prompt shapes and a cost envelope |

---

## Methodology

Real Estate HQ was built using a session-by-session reviewer-loop
methodology. Each session focused on a specific scope, ended with a
structured report and a verify-suite expansion, and required reviewer
approval before the next session began.

| Session | Scope |
|---|---|
| 1 | Foundations — entity model, design tokens, AppShell, mock data infrastructure |
| 2 | Authentication and onboarding flows |
| 3A / 3B | Agent core — dashboard, lead inbox, buyer conversation, AI Reply |
| 4A / 4B | Listings spine — categories, developer drill-down, private offerings, search |
| 5A / 5B / 5C | Share Listing, Attach Files + engagement, Site Visits + Deals Pipeline + closed deal logging |
| 6 | Commission Tracking marquee (mockup-fidelity) |
| 7A / 7B | Broker / Realtor dashboards + Agents module + Listing Distribution + Team Updates + Awards |
| 8A / 8B | Manager Analytics + Notifications, then Content Studio + Integrations + Settings |
| 9 | Polish + demo dry-run + delivery |

Each session enforced strict closure: TypeScript clean, production
build passing, verify suite passing, session log written, session
report produced. Substantive deviations from the PRD or mockups were
flagged for reviewer approval rather than silently resolved.

The result is a codebase where the architectural decisions are
documented in `SESSION_LOG.md`, the constraints are locked by
`verify/index.ts`, and the next phase (backend wiring) can proceed
without rebuilding from scratch.
