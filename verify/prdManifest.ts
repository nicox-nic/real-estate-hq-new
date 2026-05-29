/**
 * PRD COVERAGE MANIFEST
 * ===========================================================================
 *
 * The full scope contract: 46 distinct routes/pages.
 *
 * Math: 36 PRD-listed screens + 6 additional listing-category pages
 *       + 1 distribution route + 1 notifications + 1 leaderboard
 *       + 1 forgot-password (added Session 2) = 46.
 *
 * The PRD's 36 screens, in order:
 *   1.  Splash / Login
 *   2.  Create Account
 *   3.  Agent Registration Form
 *   4.  Broker Registration Form
 *   5.  Realtor Registration Form
 *   6.  Upload Documents
 *   7.  Pending Verification
 *   8.  Agent Dashboard
 *   9.  Broker Dashboard
 *   10. Realtor Dashboard
 *   11. My Leads (Lead Inbox)
 *   12. Buyer Conversation (with AI Reply)
 *   13. Buyer Profile
 *   14. Listings Menu
 *   15. For Sale (Listings category — kept as the primary index for category 1)
 *   16. Developer Listings by Developer
 *   17. Developer Project View
 *   18. Unit Inventory
 *   19. Private Offerings
 *   20. My Listings
 *   21. Share Listing
 *   22. Attach Files Bottom Sheet (modal — represented as a route for testability)
 *   23. Preview Message
 *   24. Site Visit Booking
 *   25. Deals Pipeline
 *   26. Commission Tracking
 *   27. Commission Timeline
 *   28. Money on the Way
 *   29. Agents Dashboard (broker view of team)
 *   30. Agent Profile (broker viewing one agent)
 *   31. Team Updates
 *   32. Awards and Bonuses
 *   33. Manager Analytics
 *   34. AI Content Studio
 *   35. Integrations
 *   36. Settings
 *
 * Additions (4 items, expanded to 9 route entries):
 *   - 6 more listing-category pages: For Rent, Foreclosure, For Assume,
 *     Pre-Selling, RFO, Commercial (For Sale already counted as item 15)
 *   - 1 Broker/Realtor Listing Distribution flow
 *   - 1 Notifications full route
 *   - 1 Leaderboard full route
 *
 * = 36 + 6 + 1 + 1 + 1 = 45 routes.
 *
 * Each entry has:
 *   - id (stable across sessions)
 *   - title (human-readable)
 *   - route (Next.js path; some are modal routes denoted with the parent path)
 *   - expectedElements (assertion targets — what must be on screen for "complete")
 *   - status ('pending' | 'scaffolded' | 'complete')
 *   - completedInSession (set when status becomes 'complete')
 *
 * Verify reads this manifest and reports coverage progress.
 */

export type RouteStatus = "pending" | "scaffolded" | "complete";

export interface PRDRoute {
  id: string;
  title: string;
  route: string;
  expectedElements: string[];
  status: RouteStatus;
  completedInSession?: number;
  notes?: string;
}

export const prdRoutes: PRDRoute[] = [
  // ----- Auth / Onboarding (Session 2) -----
  {
    id: "splash",
    title: "Splash / Login",
    route: "/",
    expectedElements: [
      "Brand mark with Real Estate HQ wordmark",
      "Tagline",
      "Email and password fields",
      "Sign in button",
      "Face ID affordance (visual stub)",
      "Forgot password link",
      "Create account footer link",
    ],
    status: "complete",
    completedInSession: 2,
  },
  {
    id: "create-account",
    title: "Create Account",
    route: "/auth/signup",
    expectedElements: [
      "Role selector cards (Agent / Broker / Realtor)",
      "Per-role description and feature highlights",
      "Continue CTA (disabled until selection)",
    ],
    status: "complete",
    completedInSession: 2,
  },
  {
    id: "register-agent",
    title: "Agent Registration Form",
    route: "/auth/register/agent",
    expectedElements: [
      "Full name, email, mobile, password fields",
      "Agent / accreditation number",
      "Affiliation type selector (Broker / Realtor / Realty / Developer)",
      "Affiliation details (parent name, license, company, contact, email)",
      "Office location",
      "Terms and Privacy consent",
    ],
    status: "complete",
    completedInSession: 2,
  },
  {
    id: "register-broker",
    title: "Broker Registration Form",
    route: "/auth/register/broker",
    expectedElements: [
      "Full name, email, mobile, password fields",
      "Broker license number, PRC license number (optional)",
      "Realty / brokerage name, business address",
      "Office location, number of agents under broker",
      "Terms and Privacy consent",
    ],
    status: "complete",
    completedInSession: 2,
  },
  {
    id: "register-realtor",
    title: "Realtor Registration Form",
    route: "/auth/register/realtor",
    expectedElements: [
      "Full name, email, mobile, password fields",
      "Realtor membership number, board / association",
      "Broker license number (optional)",
      "Realty / brokerage name, business address, office location",
      "Terms and Privacy consent",
    ],
    status: "complete",
    completedInSession: 2,
  },
  {
    id: "upload-documents",
    title: "Upload Documents",
    route: "/auth/upload-documents",
    expectedElements: [
      "Role-aware document list",
      "File upload rows with picker, name, size, format icon, remove",
      "Required vs optional indicators",
      "Submit-for-verification CTA",
    ],
    status: "complete",
    completedInSession: 2,
    notes: "Prototype file picker; metadata-only, no real upload. Flagged in carry-forwards.",
  },
  {
    id: "pending-verification",
    title: "Pending Verification",
    route: "/auth/pending",
    expectedElements: [
      "Status indicator and badge",
      "Sub-state body (Pending / Verified / Needs More Documents / Rejected)",
      "Stepper at step 4 of 4",
      "Support contact link",
      "Re-upload affordance when status = Needs More Documents",
    ],
    status: "complete",
    completedInSession: 2,
    notes: "Handles all 4 AccountStatus sub-states via ?status= query param.",
  },
  {
    id: "forgot-password",
    title: "Forgot Password",
    route: "/auth/forgot-password",
    expectedElements: [
      "Email input field",
      "Send reset link CTA",
      "Confirmation state ('Reset link sent')",
      "Back to sign in link",
    ],
    status: "complete",
    completedInSession: 2,
    notes:
      "Added per Session 2 framing. Brings the manifest count from 45 to 46. Flagged in session report.",
  },

  // ----- Dashboards (Session 3 / 7) -----
  {
    id: "agent-dashboard",
    title: "Agent Dashboard",
    route: "/agent",
    expectedElements: [
      "Greeting + AI briefing sentence",
      "4 KPI tiles (New leads today / Hot buyers / Site visits booked / Active deals)",
      "Money on the Way feature card with progress donut and target",
      "Active deals compact panel",
      "Recent activity feed",
      "AI suggestions stack",
    ],
    status: "complete",
    completedInSession: 3,
    notes: "Session 3A. Money on the Way computed via commissionAggregation.",
  },
  {
    id: "broker-dashboard",
    title: "Broker Dashboard",
    route: "/broker",
    expectedElements: [
      "Greeting with broker name + subtitle 'Here's what's happening with your team'",
      "Date range selector + Broadcast Message CTA in header",
      "7-card KPI row (Active Agents · Agent Health with label badge · Site Visits Booked · For Closing · Deals Closed · Total Sales · Pending Commissions)",
      "Top Performers leaderboard (5 rows) with View Full Leaderboard link",
      "Team Updates compose card with 4 quick-action chips (Announcement / Event / Award / Bonus) + Send to All Agents CTA + recent update preview",
      "May Closing Sprint card with team progress donut + Team Progress amounts + Top Closer + Rewards podium (3 ranks)",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7. Uses parameterized ManagerDashboard component with role='Broker'. Engine-honest KPIs route through computeManagerKPIs / computeLeaderboard / computeClosingSprintProgress.",
  },
  {
    id: "realtor-dashboard",
    title: "Realtor Dashboard",
    route: "/realtor",
    expectedElements: [
      "Greeting with realtor name + subtitle 'Here's your network's overview today'",
      "Date range selector + Broadcast Message CTA in header",
      "Same 7-card KPI row as broker but values aggregated over the realtor's transitive network",
      "Top Performers leaderboard scoped to network",
      "Team Updates compose card with 'Send to All' (vs broker's 'Send to All Agents')",
      "May Closing Sprint card with network progress",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7. SAME ManagerDashboard component as broker dashboard; role='Realtor' prop drives transitive network resolution + framing copy. Network = direct agents + agents under child brokers.",
  },

  // ----- Leads & Conversation (Session 3) -----
  {
    id: "leads-inbox",
    title: "My Leads / Lead Inbox",
    route: "/agent/leads",
    expectedElements: [
      "8 filter chips: All / Hot / New / Site Visit / Needs Reply / Financing / OFW / Investor",
      "'Show qualified only' toggle (default ON)",
      "Search by name, category, or tag",
      "Lead cards with score chip + last message preview",
      "Low-weight rendering for cold inquiries (opacity + sparse layout)",
      "Subtle disagreement icon when engine and editorial diverge",
      "Bulk-select mode with Archive-to-Nurturing action",
    ],
    status: "complete",
    completedInSession: 3,
    notes:
      "Session 3A. Cold-noise hidden by default. Disagreement icon implemented for any lead where engine ≠ editorial.",
  },
  {
    id: "buyer-conversation",
    title: "Buyer Conversation (with AI Reply)",
    route: "/agent/leads/[leadId]",
    expectedElements: [
      "Channel ribbon (Messenger / WhatsApp / Instagram / SMS / Email / Direct)",
      "Message thread with buyer/agent/AI-draft bubbles, timestamps, attachment chips",
      "AI Suggested Reply panel — inline above composer, dismissable, with rule name visible",
      "Replacement 'AI Reply' pill when dismissed (resummons the panel)",
      "Suggested actions composable as chip toggles",
      "Tone selector row (8 PRD tones)",
      "Language toggle (English / Tagalog / Cebuano)",
      "Attach files bottom sheet grouped by FileCategory",
      "Refine bottom sheet (regenerate / tone / language)",
      "Send action persists into the client conversationStore",
      "Sensitive-topic agent note (financing/legal/tax/contract)",
    ],
    status: "complete",
    completedInSession: 3,
    notes:
      "Session 3B. Full inline AI Suggested Reply (Option dismissable). Rule-driven suggester (8 rules), 8 tones × 3 languages via dispatcher pattern. Sensitive-topic agent note fires automatically. Cherry-equivalent canonical noise inquiry routes to cold-qualifier rule with zero booking CTAs.",
  },
  {
    id: "buyer-profile",
    title: "Buyer Profile",
    route: "/agent/leads/[leadId]/profile",
    expectedElements: [
      "Hero with score chip, AI insight banner",
      "Recommended next action (AI suggestion card)",
      "Visible AI scoring breakdown panel — engine and editorial side-by-side",
      "Per-rule breakdown with applied/not-applied indicator and points",
      "Buyer profile grid (budget, locations, timeline, purpose, etc.)",
      "Interested listings",
      "Site visits and conversation summary in right column",
      "Engagement timeline (file opens, computation requests)",
    ],
    status: "complete",
    completedInSession: 3,
    notes:
      "Session 3A. Engine-vs-editorial breakdown is where the contradiction story fully lands.",
  },

  // ----- Listings (Session 4) -----
  {
    id: "listings-menu",
    title: "Listings Menu",
    route: "/agent/listings",
    expectedElements: [
      "Category tiles (For Sale, For Rent, Foreclosure, For Assume, Pre-Selling, RFO, Commercial)",
      "Per-category listing count",
      "Role-aware subtitle copy",
    ],
    status: "complete",
    completedInSession: 4,
    notes:
      "Session 4A. Mirrored under /broker/listings and /realtor/listings via re-export for role-aware action buttons.",
  },
  {
    id: "listings-for-sale",
    title: "Listings — For Sale",
    route: "/agent/listings/for-sale",
    expectedElements: [
      "Two tabs: Developer Listings / Private Offerings",
      "Developer preview list with chevron drill-down",
      "Private offerings preview list",
    ],
    status: "complete",
    completedInSession: 4,
    notes:
      "Session 4A. Private Offerings tab is preview-only; full surface in 4B (#19).",
  },
  {
    id: "listings-for-rent",
    title: "Listings — For Rent",
    route: "/agent/listings/for-rent",
    expectedElements: [
      "Listing cards with monthly rent",
      "Role-aware action row",
    ],
    status: "complete",
    completedInSession: 4,
    notes: "Session 4A. Shared CategoryListingsPage component.",
  },
  {
    id: "listings-foreclosure",
    title: "Listings — Foreclosure",
    route: "/agent/listings/foreclosure",
    expectedElements: [
      "Listing cards",
      "Role-aware action row",
    ],
    status: "complete",
    completedInSession: 4,
    notes: "Session 4A. Shared CategoryListingsPage component.",
  },
  {
    id: "listings-for-assume",
    title: "Listings — For Assume",
    route: "/agent/listings/for-assume",
    expectedElements: [
      "Listing cards",
      "Role-aware action row",
    ],
    status: "complete",
    completedInSession: 4,
    notes: "Session 4A. Shared CategoryListingsPage component.",
  },
  {
    id: "listings-pre-selling",
    title: "Listings — Pre-Selling",
    route: "/agent/listings/pre-selling",
    expectedElements: [
      "Listing cards",
      "Role-aware action row",
    ],
    status: "complete",
    completedInSession: 4,
    notes: "Session 4A. Shared CategoryListingsPage component.",
  },
  {
    id: "listings-rfo",
    title: "Listings — RFO",
    route: "/agent/listings/rfo",
    expectedElements: [
      "Listing cards",
      "Role-aware action row",
    ],
    status: "complete",
    completedInSession: 4,
    notes: "Session 4A. Shared CategoryListingsPage component.",
  },
  {
    id: "listings-commercial",
    title: "Listings — Commercial",
    route: "/agent/listings/commercial",
    expectedElements: [
      "Listing cards",
      "Role-aware action row",
    ],
    status: "complete",
    completedInSession: 4,
    notes: "Session 4A. Shared CategoryListingsPage component.",
  },
  {
    id: "developer-list-by-developer",
    title: "Developer Listings by Developer",
    route: "/agent/listings/for-sale/developers",
    expectedElements: [
      "Developer cards with project count + available units derived live",
      "Location coverage chips",
      "Average commission rate",
      "Featured projects preview",
    ],
    status: "complete",
    completedInSession: 4,
    notes:
      "Session 4A. Nested under For Sale per PRD (developer drill-down is For Sale's children).",
  },
  {
    id: "developer-project-view",
    title: "Developer Project View",
    route: "/agent/listings/for-sale/developers/[developerId]",
    expectedElements: [
      "Developer hero card",
      "Project cards with total/available units derived from seed",
      "Project status badges (RFO / Pre-Selling)",
      "Role-aware action row per project",
    ],
    status: "complete",
    completedInSession: 4,
  },
  {
    id: "unit-inventory",
    title: "Unit Inventory",
    route: "/agent/listings/for-sale/developers/[developerId]/[projectId]",
    expectedElements: [
      "Project hero with total + available counts",
      "Filter chips (All / Available / Reserved / Sold / Studio / 1BR / 2BR / 3BR+)",
      "Unit cards with bedrooms, floor area, view, price, commission",
      "Availability badges (Available / Sold Out Soon / Reserved / Sold)",
      "Role-aware action row per unit",
    ],
    status: "complete",
    completedInSession: 4,
    notes:
      "Session 4A. Each project seeded with ≥6 units for meaningful inventory density.",
  },
  {
    id: "private-offerings",
    title: "Private Offerings",
    route: "/agent/listings/for-sale/private",
    expectedElements: [
      "Verification status badges per card (Verified / Pending review / Unverified)",
      "Verification filter chips (All / Verified / Pending / Unverified)",
      "Owner-direct, exclusive, broker-listed ownership indicators",
      "Seller info (owner name)",
      "Engagement count",
      "Role-aware action row per card",
    ],
    status: "complete",
    completedInSession: 4,
    notes:
      "Session 4B. Read-side verification display ships now; verification workflow (broker approval flow for Unverified, document capture) ships in Session 9 polish. Mirrored under /broker/listings/for-sale/private and /realtor/listings/for-sale/private.",
  },
  {
    id: "my-listings",
    title: "My Listings",
    route: "/agent/my-listings",
    expectedElements: [
      "Per-role heading (Agent: My Listings; Broker: Listings I've distributed; Realtor: Listings across my network)",
      "All / Active / Archived filter chips",
      "Transaction-type filter chips (per category)",
      "AI search input at the top",
      "Listing cards with availability + verification badge + engagement",
      "Role-aware primary action per card",
    ],
    status: "complete",
    completedInSession: 4,
    notes:
      "Session 4B. Per-role semantics: Agent sees owned + assigned; Broker sees own + agents' listings; Realtor sees network-wide. Mirrored under /broker/my-listings and /realtor/my-listings.",
  },

  // ----- Share / Site Visit / Deals (Session 5) -----
  {
    id: "share-listing",
    title: "Share Listing",
    route: "/agent/listings/[listingId]/share",
    expectedElements: [
      "Property hero card (image, title, type/transaction badges, price, commission)",
      "AI Generated Message panel (editable textarea, regenerate, rule name visible)",
      "Tone + language pills",
      "Attach Files chips row (4 attachments visible) with Add More tile",
      "Share via channel row (Messenger / WhatsApp / Instagram DM / SMS / Email / More — 6 chips)",
      "Smart Link Created card (URL + Copy + QR placeholder)",
      "Recipient picker (active leads as chips)",
      "Primary CTA — Send to {Buyer Name}",
      "Refine sheet (tone selector + language + regenerate)",
    ],
    status: "complete",
    completedInSession: 5,
    notes:
      "Session 5A. Marquee mockup-matching page. Attach Files sheet implementation deferred to 5B; affordance present. Smart Link tracking deferred to 5B; smart-link URL generation is deterministic from listing+agent+buyer.",
  },
  {
    id: "attach-files",
    title: "Attach Files (Bottom Sheet)",
    route: "/agent/listings/[listingId]/share/attach",
    expectedElements: [
      "Categories list (9 categories: Photos / Brochures / Floor Plans / Computations / Price List / Payment Terms / Location Map / Requirements / Upload New)",
      "AI Recommendation banner at top of categories with rule transparency + Apply affordance",
      "Select Files sub-sheet (All / PDF / Images / Docs / Links format tabs + search + multi-select checkmarks + Add Files button)",
      "Selected Files sub-sheet (file rows with remove × + Tip card + Done button)",
      "AI badge on individually recommended files in the file picker",
    ],
    status: "complete",
    completedInSession: 5,
    notes:
      "Session 5B. Three-stage sheet: categories → select → selected. AI recommendation lives INSIDE the sheet per Session 5A's ratified routing decision (not as a Share Listing sidebar). recommendFilesFor() is a sibling helper to generateShareMessage, sharing the same 7-rule routing.",
  },
  {
    id: "preview-message",
    title: "Preview Message",
    route: "/agent/listings/[listingId]/share/preview",
    expectedElements: [
      "Phone-style chat bubble preview (sage-soft sender bubble)",
      "Inline listing card preview inside the bubble",
      "Attachments list (with file names, sizes, formats)",
      "Send Now primary CTA",
      "Edit Message secondary CTA back to Share Listing",
      "Timestamp + sent-checks on the bubble",
    ],
    status: "complete",
    completedInSession: 5,
    notes:
      "Session 5A. Buyer-side preview rendered as phone-style bubble matching mockup image 2.",
  },
  {
    id: "site-visit-booking",
    title: "Site Visit Booking",
    route: "/agent/site-visits",
    expectedElements: [
      "List view with upcoming + past sections",
      "Status filter chips (All / Proposed / Confirmed / Reminder Sent / Completed / No-show / Converted)",
      "Site visit detail with schedule + location + notes + linked entities",
      "Booking form (buyer, listing, date/time, location, notes)",
      "Convert-to-Deal action on Completed visits",
      "Reminder visual affordance",
    ],
    status: "complete",
    completedInSession: 5,
    notes:
      "Session 5C. List at /agent/site-visits; detail at /agent/site-visits/[id]; new form at /agent/site-visits/new. Calendar/week view deferred to Session 9 polish.",
  },
  {
    id: "deals-pipeline",
    title: "Deals Pipeline",
    route: "/agent/deals",
    expectedElements: [
      "9 stages of the PRD pipeline (Lead Generated → Commission Released)",
      "Mobile timeline view (vertical per-stage cards)",
      "Desktop kanban with collapsible phase groups (Discovery / Qualification / Closing)",
      "Stage distribution overview (9 cells, counts)",
      "Deal cards with buyer + listing + value + missing-docs badge",
      "Deal Detail with 9-stage progress strip",
      "AI Suggested Next Action panel with rule transparency",
      "Required-document checklist gate per stage transition",
      "Advance button (disabled when docs missing)",
      "Closed Deal Logging sheet (final price + closing date + notes)",
      "Linked Commission row with expected status per stage",
    ],
    status: "complete",
    completedInSession: 5,
    notes:
      "Session 5C. Desktop kanban uses collapsible phase groups (option C from framing) at 9-stage density. Closed Deal Logging is a sheet, not a route, per framing. Stage advancement gates on required documents per STAGE_REQUIREMENTS table.",
  },

  // ----- Commissions (Session 6) -----
  {
    id: "commission-tracking",
    title: "Commission Tracking",
    route: "/agent/commissions",
    expectedElements: [
      "Header: Commission Tracking title + subtitle + date range selector + Filter button",
      "4 KPI cards (Total Commission Earned with delta, Paid to Date with progress, Pending Payout with progress, On Hold with progress)",
      "Commission Breakdown card: donut chart with center total + 4-segment legend (Closed Deals / For Closing / For Approval / On Hold) + per-segment amounts and percentages + View Details link",
      "Monthly Target progress card embedded in Commission Breakdown",
      "Upcoming Payouts card: 3 commission entries with date chip + listing + buyer + amount + payout account + status badge + View All link",
      "Request Payout CTA (large sage button)",
      "Commission Transactions table: 6 status filter tabs (All / Closed Deals / For Closing / For Approval / Paid / On Hold) + Export button + columns Property/Buyer / Deal Value / Commission (with rate) / Status / Expected Payout / Date Updated",
      "Commission Insights row: 3 tiles (Total sales / Average commission rate / Deals closed) with deltas",
      "Payout Accounts list (BDO + BPI with masked account numbers and Default badge)",
      "Footer: 'All commissions are computed...' + Contact support link",
    ],
    status: "complete",
    completedInSession: 6,
    notes:
      "Session 6 marquee mockup-matching page. Engine-definitive math (Q1 decision implemented): all displayed numbers route through computeKPIs / computeBreakdown / amountFor with role-aware perspective. Mockup's example values (Total ₱523,750) flagged as internally inconsistent with mockup's own transactions table — engine produces ₱536,250 which reconciles correctly to the transactions. Standalone page (no bottom nav per PRD).",
  },
  {
    id: "commission-timeline",
    title: "Commission Timeline",
    route: "/agent/commissions/[commissionId]/timeline",
    expectedElements: [
      "6-stage vertical timeline (Reserved → Documents Submitted → Contract Signed → Commission Approved → Processing → Released)",
      "Per-stage state (completed with timestamp / current with expected date / pending) + visual variants",
      "Delay alert affordance when expected date past",
      "Commission split card showing agent / broker / realty shares with per-row progress bars",
      "Summary card with status badge + agent share amount + total deal value + expected payout date",
      "Linked references: originating deal + payout account",
    ],
    status: "complete",
    completedInSession: 6,
    notes:
      "Session 6. Vertical timeline shape distinct from 5C's horizontal pipeline strip; Rule of Three still holds — extraction deferred until a third timeline surface emerges.",
  },
  {
    id: "money-on-the-way",
    title: "Money on the Way",
    route: "/agent/commissions/money-on-the-way",
    expectedElements: [
      "Hero card with total in-flight commission (large sage number) + count + count description",
      "Monthly Target progress bar showing toward-target percentage",
      "In-flight commissions list — per-commission card with listing + buyer + deal value + amount + status badge + mini 6-segment timeline progress bar + expected payout date",
      "Request Payout CTA",
      "Footer summary line with paid-to-date and visible-count",
    ],
    status: "complete",
    completedInSession: 6,
    notes:
      "Session 6. Cross-surface invariant with Agent Dashboard's MotW feature card — same data via computeKPIs, two surfaces must agree.",
  },

  // ----- Broker Modules (Session 7) -----
  {
    id: "agents-dashboard",
    title: "Agents Module (Team)",
    route: "/broker/agents",
    expectedElements: [
      "Agent roster with team-size header (broker direct reports vs realtor transitive network)",
      "Search input + filter button + status filter chips with counts (All / Top Performer / Active / Needs Coaching / Low Activity)",
      "Per-agent card: avatar + name + status badge + health score + 4-cell activity grid (Deals / Visits / Leads / Sales) + specialization chips",
      "Tap into Agent Profile",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7B. Parameterized AgentsModule component used by /broker/agents and /realtor/agents. Engine-honest health labels.",
  },
  {
    id: "agent-profile",
    title: "Agent Profile",
    route: "/broker/agents/[agentId]",
    expectedElements: [
      "Hero card with avatar + name + role + status badge + health score + specialization chips + Message + Call CTAs",
      "AI Coaching banner driven by the agent's weakest health component (rule-driven, transparent — data-driven-by attribute exposes which component triggered)",
      "4 KPI tiles (Deals Closed / Site Visits / Active Leads / Total Sales)",
      "Full Health Score Breakdown: 6 components × raw% × weight% = +contribution rows, sum equals overall health score, weakest component highlighted in terracotta with AlertCircle",
      "Deals in Flight list",
      "Commissions by Status mini breakdown",
      "Leads by Temperature mini breakdown",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7B. Parameterized AgentProfile component used by /broker/agents/[agentId] and /realtor/agents/[agentId]. AI Coaching uses rule-driven templates keyed by weakest-component label. Engine-honest health breakdown — no seeded values; 6-component formula sums to overall score.",
  },
  {
    id: "broker-distribute",
    title: "Listing Distribution",
    route: "/broker/listings/[listingId]/distribute",
    expectedElements: [
      "Listing summary card (title + location + property type + price + transaction type badge)",
      "3-mode picker (AI Recommended / Manual / All Agents) with per-mode count hints",
      "AI Recommended mode: declarative-rule-driven recommendations with per-agent match% + reasoning chips",
      "Manual mode: agent picker with search + checkbox selection",
      "All Agents mode: full team grid confirmation",
      "Sticky Send footer with recipient count + mode-aware reasoning indicator + Send to N Agents CTA",
      "Sent confirmation: 'ShareCampaign records created for N agents' (composition with existing ShareCampaign entity, NOT new BroadcastCampaign)",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7B. AI agent-recommendation logic is the 7th declarative rule table (AGENT_RECOMMENDATION_RULES — Rule of Seven progression). Composes with existing ShareCampaign entity. Three modes produce structurally different broadcast outputs: All/Manual have no reasoning; AI mode includes per-recipient rule-driven reasoning.",
  },
  {
    id: "team-updates",
    title: "Team Updates",
    route: "/broker/team-updates",
    expectedElements: [
      "Compose card with 4 type chips (Announcement / Event / Award / Bonus) + body textarea + audience selector (All Agents / Selected / By Specialization / By Location) + Send Update CTA",
      "Recent Updates list with per-update card: type badge + audience + title + body + engagement row (Delivered / Opened / Acknowledged / Clicked) + channel chips + author",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7B. Parameterized TeamUpdates component for /broker/team-updates and /realtor/team-updates. Composes with EXISTING TeamUpdate entity (no new entity introduced) — already had 11 update types + 6 channels + 4 audiences + engagement counters from Session 1's type model.",
  },

  // ----- Awards / Analytics / Content / Integrations / Settings (Session 8) -----
  {
    id: "awards-bonuses",
    title: "Awards and Bonuses",
    route: "/broker/campaigns",
    expectedElements: [
      "Header with Create Campaign CTA",
      "Active Campaigns section: per-campaign card with name + Active badge + goal + reward + date range + eligible count + team progress bar + per-agent top-performers list + 3-rank podium",
      "Past Campaigns section: same card with Ended badge",
      "Create Campaign sheet (modal form): name + goal + reward + target + start/end dates",
      "May Closing Sprint composes with 7A's dashboard sprint card (same campaign, full detail page)",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7B. Parameterized AwardsCampaigns component. Composes with EXISTING BonusCampaign entity (no new entity). Cross-surface invariant with 7A's dashboard: bonus-001 May Closing Sprint renders here with same name + same eligible agents + matching progress.",
  },
  {
    id: "manager-analytics",
    title: "Manager Analytics",
    route: "/broker/insights",
    expectedElements: [
      "Header with role-aware title ('Team Analytics' vs 'Network Analytics') + subtitle + date range selector + Export button",
      "Summary stat strip (Total Leads / Closed Deals / Pending Commissions / Active Agents)",
      "6-chart grid: Lead Volume Over Time (LineChart filled) + Response Time Distribution (BarChart 4 buckets) + Lead Source Performance (DonutChart + legend) + Conversion by Stage (BarChart % per stage) + Lead Temperature (DonutChart Hot/Warm/Nurture/Cold) + Commission Status (DonutChart with manager-share amounts)",
      "Top Performers compact list with View Full Leaderboard link",
    ],
    status: "complete",
    completedInSession: 8,
    notes:
      "Session 8A. Parameterized ManagerAnalytics component used by /broker/insights and /realtor/insights (7th use of the single-parameterized-component pattern). All values derive from computeAnalyticsSnapshot — engine-honest. Two new chart wrappers (BarChart + LineChart) earn extraction immediately since 3+ callers exist on this surface (Rule of Three at point of construction).",
  },
  {
    id: "content-studio",
    title: "AI Content Studio",
    route: "/agent/content-studio",
    expectedElements: [
      "Header with title + Sparkles icon + subtitle",
      "Template picker grid: 12 PRD content types (Property Caption / Facebook Post / TikTok Script / Reels Script / Instagram Caption / Messenger Reply / WhatsApp Message / Email Follow-up / Open House Invite / Investment Pitch / OFW Buyer Message / Luxury Buyer Message), each with destination icon + description + estimated char count",
      "Tone picker: 8 tones via existing ALL_TONES (Friendly Agent / Professional Broker / Simple Explanation / Investor / OFW Buyer / Luxury Buyer / Short Reply / Detailed Reply)",
      "Language picker: 3 languages via existing ALL_LANGUAGES (English / Tagalog / Cebuano) with disabled state for templates that don't support translation (Email Follow-up, Investment Pitch, Luxury Buyer Message default to English)",
      "Listing context selector + listing summary",
      "Generate CTA with 600ms simulator timing + Wand2 animate-pulse loading state",
      "Platform preview chrome per destination (Facebook card / Instagram square / TikTok-Reels black bg script / Messenger blue bubble / WhatsApp green bubble / Email envelope / Generic card)",
      "Copy CTA with 1.5s 'Copied!' flash",
    ],
    status: "complete",
    completedInSession: 8,
    notes:
      "Session 8B. Composes with EXISTING applyShareTone (5A) + applyLanguage (3B) via generateContentTemplate sibling helper. CONTENT_TEMPLATES is a declarative REGISTRY (not a rule table) — keyed by ContentType with build/description/requiresListing/supportsLanguage/estimatedChars. Rule of Seven stands; CONTENT_TEMPLATES is a complementary discipline (registry, not rule-scoring). Zero new entity types — uses existing Tone + Language + Listing + BuyerProfile.",
  },
  {
    id: "integrations",
    title: "Integrations",
    route: "/integrations",
    expectedElements: [
      "Header with Plug icon + title + subtitle + Back to Settings link",
      "Summary strip (3 stats): Connected / Available / Issues — terracotta accent for Issues",
      "Filter chips: All / Connected / Available / Issues with per-chip counts",
      "18 integration cards (one per IntegrationProvider): icon + name + description + status row (Connected paid badge / Not connected neutral / Issue hot badge) + leadsCapturedToday counter when connected",
      "Per-card action: Connect (sage primary) / Manage (outline) / Reconnect (terracotta when errored) / Connecting spinner during OAuth sim",
      "OAuth-style connect flow: tap Connect → 800ms loading → flip to Connected",
      "Manage sheet (modal) for connected integrations: provider-specific manage rows with toggles + Disconnect CTA",
      "Pre-seeded connections: Facebook Lead Ads, Instagram Lead Ads, TikTok Lead Forms, Google Ads, WhatsApp Business, Messenger, Instagram DM, Email, Google Calendar, Website Forms (10 of 18)",
      "SMS Provider in errored state: 'Provider account inactive — renew Semaphore subscription'",
    ],
    status: "complete",
    completedInSession: 8,
    notes:
      "Session 8B. Composes with EXISTING Integration entity (Session 1 type model supported all 18 PRD providers + isConnected + lastSyncAt + leadsCapturedToday + errorMessage). Zero new entity types. PROVIDER_META table maps each IntegrationProvider to icon + colors + description + manage rows. OAuth simulator timing 800ms (same posture as 5B engagement sim).",
  },
  {
    id: "settings",
    title: "Settings",
    route: "/settings",
    expectedElements: [
      "Header with Settings title + subtitle",
      "Profile section: avatar + name + role + company + Verified badge + license + Email/Mobile/Reports-to field rows",
      "Notification Preferences section: 3 delivery channels (Push / Email / SMS) + 14 per-category toggles (NotificationCategory union)",
      "Language section: 3 chips (English / Tagalog / Cebuano)",
      "Integrations link card → /integrations with connected/available count",
      "Payout Accounts section → links to /agent/commissions",
      "Role-aware Team Management section for broker/realtor (Auto-assign / Broadcast defaults / Require approval toggles)",
      "Account section: Change password / Two-factor (Recommended badge) / Export my data",
      "Help Center + About + Sign Out (terracotta)",
      "v0.9 prototype footer",
    ],
    status: "complete",
    completedInSession: 8,
    notes:
      "Session 8B. Composes with EXISTING User + NotificationCategory + Integration + PayoutAccount entities. Zero new entity types. Role-aware Team Management section renders for Broker/Realtor only. ToggleRow + FieldRow + ActionRow subcomponents.",
  },

  // ----- Added routes -----
  {
    id: "notifications",
    title: "Notifications",
    route: "/notifications",
    expectedElements: [
      "Header with Notifications title + Bell icon + unread count + 'Mark All Read' affordance (when unread > 0)",
      "Filter chips: All / Unread / + present category chips (e.g., New Hot Lead, Buyer Replied, Deal Stage Changed, etc.) with per-chip counts",
      "Notification rows with category icon (14 PRD categories mapped) + title + body + priority badge (Urgent / Important / Normal) + unread dot + timestamp ('Xm ago' / 'Xh ago' / 'Xd ago') + per-row Mark Read affordance",
      "Read/unread visual distinction (font weight + border emphasis + shadow)",
      "Tap-through routing to related entity (lead/deal/commission/listing) when relatedEntityId is set",
    ],
    status: "complete",
    completedInSession: 8,
    notes:
      "Session 8A. Composes with EXISTING NotificationItem entity (no new entity introduced) — Session 1's entity model already supported the 14 PRD categories + 3 priority levels + read state + relatedEntityId tap-through. Maria/Laurel narrative chain extension via notif-001 ('New Hot Lead: Maria Santos · 92% match for Laurel Hills 12A').",
  },
  {
    id: "leaderboard-full",
    title: "Leaderboard (Full View)",
    route: "/broker/leaderboard",
    expectedElements: [
      "Period filter chips (This Month / This Quarter / Year to Date / All Time)",
      "3 highlight tiles (Top closer / Most sales / Healthiest score)",
      "Sortable full ranking table (Rank / Agent + status badge / Deals / Sales / Health / Recent activity)",
      "Positive copy throughout — celebrates wins, no shaming",
    ],
    status: "complete",
    completedInSession: 7,
    notes:
      "Session 7. Parameterized Leaderboard component used by both /broker/leaderboard and /realtor/leaderboard. Engine-derived sort from computeLeaderboard. All columns sortable.",
  },
];

/** Stable count assertion target for verify. */
export const EXPECTED_ROUTE_COUNT = 46;
