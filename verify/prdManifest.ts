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
      "Team-level KPIs",
      "Leaderboard summary",
      "Pending agent approvals",
      "AI insights",
    ],
    status: "pending",
  },
  {
    id: "realtor-dashboard",
    title: "Realtor Dashboard",
    route: "/realtor",
    expectedElements: [
      "Network KPIs",
      "Broker performance overview",
      "Network-wide AI insights",
    ],
    status: "pending",
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
      "Channel picker",
      "Buyer/lead picker",
      "Message composer",
      "Attach files entry",
    ],
    status: "pending",
  },
  {
    id: "attach-files",
    title: "Attach Files (Bottom Sheet)",
    route: "/agent/listings/[listingId]/share/attach",
    expectedElements: [
      "10 category filters",
      "File rows with size and download counts",
    ],
    status: "pending",
    notes: "Modal pattern; route exists for testability.",
  },
  {
    id: "preview-message",
    title: "Preview Message",
    route: "/agent/listings/[listingId]/share/preview",
    expectedElements: [
      "Channel-styled preview",
      "Smart link rendering",
      "Final send CTA",
    ],
    status: "pending",
  },
  {
    id: "site-visit-booking",
    title: "Site Visit Booking",
    route: "/agent/leads/[leadId]/site-visit",
    expectedElements: [
      "Date/time picker",
      "Listing selection",
      "Location note",
      "Reminder schedule",
    ],
    status: "pending",
  },
  {
    id: "deals-pipeline",
    title: "Deals Pipeline",
    route: "/agent/deals",
    expectedElements: [
      "Kanban or list by 9 deal stages",
      "Missing-document alerts",
      "Stage transition CTAs",
    ],
    status: "pending",
  },

  // ----- Commissions (Session 6) -----
  {
    id: "commission-tracking",
    title: "Commission Tracking",
    route: "/agent/commissions",
    expectedElements: [
      "4 KPI cards (Total, Paid, Pending, On Hold)",
      "Donut breakdown",
      "Transactions table (6 rows from mockup)",
    ],
    status: "pending",
  },
  {
    id: "commission-timeline",
    title: "Commission Timeline",
    route: "/agent/commissions/[commissionId]",
    expectedElements: [
      "6-stage progress strip",
      "Per-stage required documents",
      "Responsible party per stage",
    ],
    status: "pending",
  },
  {
    id: "money-on-the-way",
    title: "Money on the Way",
    route: "/agent/commissions/upcoming",
    expectedElements: [
      "Upcoming payouts list",
      "Expected dates",
      "Payout account masked numbers",
    ],
    status: "pending",
  },

  // ----- Broker Modules (Session 7) -----
  {
    id: "agents-dashboard",
    title: "Agents Dashboard (Team)",
    route: "/broker/agents",
    expectedElements: [
      "Agent cards with health label",
      "Performance metrics",
      "Status filter",
    ],
    status: "pending",
  },
  {
    id: "agent-profile",
    title: "Agent Profile (Broker view)",
    route: "/broker/agents/[agentId]",
    expectedElements: [
      "Agent details",
      "Performance history",
      "Active deals + leads",
      "Coaching prompts",
    ],
    status: "pending",
  },
  {
    id: "broker-distribute",
    title: "Listing Distribution",
    route: "/broker/distribute",
    expectedElements: [
      "Listing picker",
      "Agent selector with filters (specialization, location)",
      "Channel selector",
      "Send composer",
    ],
    status: "pending",
    notes: "Added per scope contract additions.",
  },
  {
    id: "team-updates",
    title: "Team Updates",
    route: "/broker/updates",
    expectedElements: [
      "Update list with type icons",
      "Channel reach metrics",
      "New update composer",
    ],
    status: "pending",
  },

  // ----- Awards / Analytics / Content / Integrations / Settings (Session 8) -----
  {
    id: "awards-bonuses",
    title: "Awards and Bonuses",
    route: "/broker/awards",
    expectedElements: [
      "Active campaigns list (May Closing Sprint)",
      "Podium standings",
      "Reward amounts",
    ],
    status: "pending",
  },
  {
    id: "manager-analytics",
    title: "Manager Analytics",
    route: "/broker/analytics",
    expectedElements: [
      "Team trend chart",
      "Top performers ranking",
      "Coaching insights",
    ],
    status: "pending",
  },
  {
    id: "content-studio",
    title: "AI Content Studio",
    route: "/agent/content-studio",
    expectedElements: [
      "Tone selector",
      "Content type picker (post, brochure, computation)",
      "Generate + edit canvas",
    ],
    status: "pending",
  },
  {
    id: "integrations",
    title: "Integrations",
    route: "/agent/integrations",
    expectedElements: [
      "18 provider cards",
      "Connection status",
      "Last sync timestamps",
    ],
    status: "pending",
  },
  {
    id: "settings",
    title: "Settings",
    route: "/agent/settings",
    expectedElements: [
      "Profile section",
      "Payout accounts",
      "Notification preferences",
      "Document re-upload",
    ],
    status: "pending",
  },

  // ----- Added routes -----
  {
    id: "notifications",
    title: "Notifications",
    route: "/notifications",
    expectedElements: [
      "Categorized list (14 categories)",
      "Read/unread state",
      "Filter by priority",
    ],
    status: "pending",
    notes: "Added per scope contract additions.",
  },
  {
    id: "leaderboard-full",
    title: "Leaderboard (Full View)",
    route: "/broker/leaderboard",
    expectedElements: [
      "Ranked agents with health labels",
      "Multi-dimensional metrics (deals, leads, listings, engagement)",
      "Time-range filter",
    ],
    status: "pending",
    notes: "Added per scope contract additions.",
  },
];

/** Stable count assertion target for verify. */
export const EXPECTED_ROUTE_COUNT = 46;
