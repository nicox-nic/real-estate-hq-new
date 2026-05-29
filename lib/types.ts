/**
 * Real Estate HQ — Domain Types
 *
 * Designed for a future backend. All entities use string IDs (uuid-shaped) so
 * action signatures map cleanly to REST/GraphQL endpoints. Relationships use
 * id references rather than nested objects.
 *
 * Currency: all monetary amounts are in Philippine pesos (PHP), stored as
 * integers representing centavos would be ideal for production, but for the
 * prototype we use whole pesos as `number` to keep mock data readable. The
 * pure-logic modules treat amounts opaquely so a switch is mechanical.
 */

// ----------------------------------------------------------------------------
// Users & roles
// ----------------------------------------------------------------------------

export type UserRole = "Agent" | "Broker" | "Realtor";

export type AccountStatus =
  | "Pending Verification"
  | "Verified"
  | "Rejected"
  | "Needs More Documents";

export type AgentSpecialization =
  | "Condo"
  | "House and Lot"
  | "Luxury"
  | "Investment"
  | "Rental"
  | "Commercial"
  | "Foreclosure"
  | "Assume Balance"
  | "OFW Buyers"
  | "Cebu"
  | "Manila"
  | "BGC"
  | "Mactan"
  | "Resort Properties";

export type AgentStatusLabel =
  | "Top Performer"
  | "Active"
  | "Needs Coaching"
  | "Low Activity";

export interface User {
  id: string;
  role: UserRole;
  /** Parent user this person reports to. Agents → Broker|Realtor|Realty;
   *  Brokers can sit under a Realtor; Realtors are root. */
  parentId: string | null;
  status: AccountStatus;
  fullName: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  // Role-specific identifiers
  agentNumber?: string;
  brokerLicenseNumber?: string;
  prcLicenseNumber?: string;
  realtorMembershipNumber?: string;
  boardOrAssociation?: string;
  // Organization
  companyName?: string;
  officeLocation?: string;
  businessAddress?: string;
  numAgentsUnderBroker?: number;
  // Agent profile extras
  specializations?: AgentSpecialization[];
  yearsOfExperience?: number;
  joinedAt: string; // ISO date
  lastActiveAt: string; // ISO date
  // Documents uploaded (file IDs)
  documentIds?: string[];
  // Computed at seed time for demo stability — verify locks expected values
  derivedAgentStatus?: AgentStatusLabel;
}

// ----------------------------------------------------------------------------
// Leads & buyers
// ----------------------------------------------------------------------------

export type LeadSource =
  | "Facebook Lead Ads"
  | "Instagram Lead Ads"
  | "TikTok Lead Forms"
  | "Google Ads Lead Forms"
  | "Website Forms"
  | "Landing Pages"
  | "QR Codes"
  | "Open House Forms"
  | "Property Portals"
  | "Referrals"
  | "Manual Entry"
  | "Messenger"
  | "Instagram DM"
  | "WhatsApp"
  | "SMS"
  | "Email";

export type BuyerCategory =
  | "Hot Buyer"
  | "Warm Buyer"
  | "Cold Buyer"
  | "Investor Buyer"
  | "End-User Buyer"
  | "OFW Buyer"
  | "Luxury Buyer"
  | "Needs Financing"
  | "Ready for Site Visit";

export type LeadScoreCategory = "Hot" | "Warm" | "Nurture" | "Cold";

export type PaymentPreference =
  | "Cash"
  | "Bank Financing"
  | "In-House Financing"
  | "Pag-IBIG"
  | "Mixed";

export type PurposeOfPurchase =
  | "End-User"
  | "Investment"
  | "Rental"
  | "Vacation"
  | "OFW Family";

export type BuyerTimeline =
  | "Within 1 Month"
  | "Within 3 Months"
  | "Within 6 Months"
  | "Within 1 Year"
  | "Just Exploring";

export interface BuyerProfile {
  /** Buyers are CONTACTS, not platform users — they don't log in. */
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  isOFW?: boolean;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocations?: string[];
  propertyTypes?: string[]; // e.g. "Condo", "House and Lot"
  purposeOfPurchase?: PurposeOfPurchase;
  timeline?: BuyerTimeline;
  paymentPreference?: PaymentPreference;
  familySize?: number;
  isDecisionMaker?: boolean;
  preferredViewingSchedule?: string;
  // Engagement signals — drive the lead score engine
  hasAskedForComputation?: boolean;
  hasOpenedBrochure?: boolean;
  hasWatchedWalkthrough?: boolean;
  hasViewedFloorPlan?: boolean;
  hasOpenedLocationMap?: boolean;
  hasBookedSiteVisit?: boolean;
  repliedWithinMinutes?: number; // last reply latency
  aiSummary?: string;
  notes?: string;
}

export interface Lead {
  id: string;
  buyer: BuyerProfile;
  source: LeadSource;
  assignedAgentId: string;
  selectedListingIds: string[];
  category: BuyerCategory;
  /** Editorial seed score — what the demo wants to show. May intentionally
   *  disagree with the engine-computed score for the contradiction-visibility
   *  demo beat. */
  seedScore: number;
  seedScoreCategory: LeadScoreCategory;
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  needsReply: boolean;
  urgency: "Urgent" | "Important" | "Normal";
  tags: string[];
}

// ----------------------------------------------------------------------------
// Listings
// ----------------------------------------------------------------------------

export type TransactionType =
  | "For Sale"
  | "For Rent"
  | "Foreclosure"
  | "For Assume"
  | "Pre-Selling"
  | "RFO"
  | "Commercial";

export type ListingOwnership =
  | "Personal Listing"
  | "Broker Listing"
  | "Developer Listing"
  | "Shared Realty Listing"
  | "Exclusive Listing";

export type ListingAvailability =
  | "Available"
  | "Reserved"
  | "Sold"
  | "Sold Out Soon";

export interface DeveloperProfile {
  id: string;
  name: string;
  logoUrl?: string;
  activeProjectsCount: number;
  availableUnitsCount: number;
  priceRangeMin: number;
  priceRangeMax: number;
  locationsCovered: string[];
  averageCommissionRate: number; // e.g. 0.03 for 3%
  hasNewInventory: boolean;
}

export interface Project {
  id: string;
  developerId: string;
  name: string;
  location: string;
  propertyType: string;
  priceRangeMin: number;
  priceRangeMax: number;
  availableUnitsCount: number;
  commissionRate: number;
  status: "Pre-Selling" | "RFO" | "Sold Out Soon";
  heroImageUrl?: string;
  description?: string;
}

export interface Unit {
  id: string;
  projectId: string;
  unitType: string; // "1BR", "2BR", "Studio", "Penthouse"
  floorArea: number; // sqm
  bedrooms: number;
  floorLevel?: number;
  viewOrientation?: string;
  price: number;
  reservationFee: number;
  monthlyEquity?: number;
  financingOptions: string[];
  availability: ListingAvailability;
  commissionEstimate: number;
}

export interface Listing {
  id: string;
  title: string;
  location: string;
  propertyType: string;
  price: number; // for-rent uses monthly rate in this same field; rentalRate kept for clarity
  rentalRate?: number;
  ownership: ListingOwnership;
  transactionType: TransactionType;
  availability: ListingAvailability;
  commissionRate: number; // decimal
  // Relationships
  developerId?: string;
  projectId?: string;
  unitId?: string;
  ownerAgentId?: string; // for Personal Listings
  ownerBrokerId?: string; // for Broker Listings
  // Media
  heroImageUrl?: string;
  imageUrls?: string[];
  // Engagement (counters; live tracking would be a separate event store)
  engagementCount: number;
  /**
   * Agents this listing has been distributed to. For Developer listings,
   * this is the broker's assignment to specific agents. For Personal/Broker
   * listings, this is who the owning broker shared the listing with.
   * Drives the "My Listings" surface: agents see listings they've been
   * assigned plus ones they own personally.
   *
   * Empty/undefined means "not distributed to anyone yet" (Developer
   * listings only appear in My Listings via this mechanism; an agent
   * owning a Personal listing always sees it via ownerAgentId).
   */
  assignedAgentIds?: string[];
  // Verification (for Private Offerings)
  verificationStatus?: "Verified" | "Pending" | "Unverified";
  // Tags useful for AI search
  tags?: string[];
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Deals & commissions
// ----------------------------------------------------------------------------

export type DealStage =
  | "Lead Generated"
  | "Buyer Qualified"
  | "Site Visit Done"
  | "Reservation Paid"
  | "Documents Submitted"
  | "Financing Approved"
  | "Contract Signed"
  | "Commission Processing"
  | "Commission Released";

export const DEAL_STAGES: DealStage[] = [
  "Lead Generated",
  "Buyer Qualified",
  "Site Visit Done",
  "Reservation Paid",
  "Documents Submitted",
  "Financing Approved",
  "Contract Signed",
  "Commission Processing",
  "Commission Released",
];

export interface Deal {
  id: string;
  buyerProfileId: string;
  buyerName: string; // denormalized for list views
  listingId: string;
  listingTitle: string; // denormalized
  stage: DealStage;
  contractPrice: number;
  reservationDate?: string;
  closingDate?: string;
  commissionRate: number;
  // Split percentages — must sum to 1.0 ± epsilon
  realtyShare: number;
  brokerShare: number;
  agentShare: number;
  // Participants
  realtorId?: string;
  brokerId?: string;
  agentId: string;
  // Documents
  missingDocuments?: string[];
  notes?: string;
  // Linkage to commission row(s)
  commissionId: string;
  createdAt: string;
  updatedAt: string;
}

export type CommissionStatus =
  | "For Approval"
  | "For Closing"
  | "For Payout"
  | "Paid"
  | "On Hold";

export type CommissionTimelineStage =
  | "Reserved"
  | "Documents Submitted"
  | "Contract Signed"
  | "Commission Approved"
  | "Processing"
  | "Released";

export const COMMISSION_TIMELINE_STAGES: CommissionTimelineStage[] = [
  "Reserved",
  "Documents Submitted",
  "Contract Signed",
  "Commission Approved",
  "Processing",
  "Released",
];

export interface CommissionTimelineEvent {
  stage: CommissionTimelineStage;
  completedAt?: string;
  responsibleUserId?: string;
  requiredDocuments?: string[];
  remarks?: string;
  isDelayed?: boolean;
  expectedAt?: string;
}

export interface Commission {
  id: string;
  dealId: string;
  /** Total commission pool for this deal (contract price × rate). */
  totalAmount: number;
  // Pre-split amounts (sum to totalAmount ± ₱1, locked by verify)
  realtyAmount: number;
  brokerAmount: number;
  agentAmount: number;
  status: CommissionStatus;
  expectedPayoutDate?: string;
  actualPayoutDate?: string;
  payoutAccountId?: string;
  timeline: CommissionTimelineEvent[];
  // Participants — duplicated from Deal for query convenience
  realtorId?: string;
  brokerId?: string;
  agentId: string;
  // For aggregations: which user views this through which lens?
  // Resolved at read time by lib/logic/roleAwareAmount.ts
}

export interface PayoutAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNameMasked: string;
  accountNumberMasked: string; // "**** 5678"
  isDefault: boolean;
}

// ----------------------------------------------------------------------------
// Site visits, share campaigns, conversations
// ----------------------------------------------------------------------------

export type SiteVisitStatus =
  | "Proposed"
  | "Confirmed"
  | "Reminder Sent"
  | "Completed"
  | "No-show"
  | "Rescheduled"
  | "Converted";

export interface SiteVisit {
  id: string;
  leadId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  agentId: string;
  scheduledAt: string;
  status: SiteVisitStatus;
  locationNote?: string;
  notes?: string;
}

export type ShareChannel =
  | "Messenger"
  | "WhatsApp"
  | "Instagram DM"
  | "SMS"
  | "Email"
  | "Smart Link"
  | "QR Code";

export interface ShareCampaign {
  id: string;
  listingId: string;
  agentId: string;
  buyerProfileId?: string;
  channel: ShareChannel;
  smartLinkUrl: string;
  message: string;
  attachedFileIds: string[];
  sharedAt: string;
  // Engagement
  opens: number;
  brochureClicks: number;
  computationRequests: number;
  siteVisitBookings: number;
  replies: number;
  reshares: number;
}

export type MessageSender = "buyer" | "agent" | "ai";
export type MessageTone =
  | "Friendly Agent"
  | "Professional Broker"
  | "Simple Explanation"
  | "Investor"
  | "OFW Buyer"
  | "Luxury Buyer"
  | "Short Reply"
  | "Detailed Reply";

export interface ConversationMessage {
  id: string;
  leadId: string;
  sender: MessageSender;
  body: string;
  attachmentIds?: string[];
  tone?: MessageTone;
  language?: "English" | "Tagalog" | "Cebuano";
  sentAt: string;
  // For AI-suggested replies that haven't been sent yet
  isDraft?: boolean;
  /**
   * Set when this message was originated by a Share Listing send. Links the
   * conversation thread back to the ShareCampaign for engagement tracking.
   * Field, not entity — pragmatic prototype representation; backend wiring
   * later swaps to a relation table.
   */
  shareCampaignId?: string;
}

// ----------------------------------------------------------------------------
// Files
// ----------------------------------------------------------------------------

export type FileCategory =
  | "Photos"
  | "Brochures"
  | "Floor Plans"
  | "Computations"
  | "Price List"
  | "Payment Terms"
  | "Location Map"
  | "Requirements"
  | "Video Walkthrough"
  | "Legal"
  | "Other";

export type FileFormat =
  | "JPG"
  | "PNG"
  | "PDF"
  | "DOC"
  | "DOCX"
  | "XLS"
  | "XLSX"
  | "MP4"
  | "Link";

export interface PropertyFile {
  id: string;
  listingId?: string;
  projectId?: string;
  developerId?: string;
  uploaderId: string;
  name: string;
  category: FileCategory;
  format: FileFormat;
  sizeBytes: number;
  url: string;
  isOfficialDeveloperFile?: boolean;
  uploadedAt: string;
  // Buyer engagement
  openCount: number;
  downloadCount: number;
}

// ----------------------------------------------------------------------------
// Team updates, campaigns, AI activity, integrations, notifications
// ----------------------------------------------------------------------------

export type TeamUpdateType =
  | "General Update"
  | "New Listing Alert"
  | "Event Announcement"
  | "Open House Schedule"
  | "Sales Meeting Reminder"
  | "Awards Announcement"
  | "Bonus Announcement"
  | "Promo Deadline"
  | "Document Requirement"
  | "Training Material"
  | "Motivational Message";

export type BroadcastChannel =
  | "In-App Notification"
  | "Push Notification"
  | "Email"
  | "SMS"
  | "WhatsApp"
  | "Messenger Group";

export interface TeamUpdate {
  id: string;
  authorId: string; // broker or realtor
  type: TeamUpdateType;
  title: string;
  body: string;
  channels: BroadcastChannel[];
  audience: "All Agents" | "Selected" | "By Specialization" | "By Location";
  sentAt: string;
  delivered: number;
  opened: number;
  acknowledged: number;
  clicked: number;
}

export interface BonusCampaign {
  id: string;
  authorId: string;
  name: string;
  goal: string;
  rewardAmount: number;
  rewardDescription?: string;
  startDate: string;
  endDate: string;
  eligibleAgentIds: string[];
  participatingAgentIds: string[];
  /** Rewards by placement. */
  podium?: { first: number; second: number; third: number };
  progressPercent: number;
  targetAmount?: number;
  currentAmount?: number;
}

export type AIAgentType =
  | "Lead Capture"
  | "Qualification"
  | "Voice Call"
  | "Follow-Up"
  | "Brochure"
  | "Computation"
  | "Booking"
  | "CRM"
  | "Assignment"
  | "Content"
  | "Analytics"
  | "Reminder"
  | "Manager Insight"
  | "Reactivation"
  | "Objection Handling"
  | "Commission Reminder"
  | "Listing Share"
  | "Technical Reply";

export interface AIActivity {
  id: string;
  agentType: AIAgentType;
  forUserId: string;
  summary: string;
  occurredAt: string;
  relatedEntityId?: string;
  relatedEntityType?: "Lead" | "Listing" | "Deal" | "SiteVisit" | "Commission";
}

export type IntegrationProvider =
  | "Facebook Lead Ads"
  | "Instagram Lead Ads"
  | "TikTok Lead Forms"
  | "Google Ads Lead Forms"
  | "WhatsApp Business"
  | "Messenger"
  | "Instagram DM"
  | "SMS Provider"
  | "Email"
  | "Google Calendar"
  | "Google Sheets"
  | "CRM Systems"
  | "n8n"
  | "Make"
  | "Zapier"
  | "Website Forms"
  | "Landing Pages"
  | "Property Inventory Database";

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  isConnected: boolean;
  lastSyncAt?: string;
  leadsCapturedToday?: number;
  errorMessage?: string;
}

export type NotificationCategory =
  | "New Hot Lead"
  | "Buyer Replied"
  | "Buyer Opened Listing"
  | "Computation Requested"
  | "Site Visit Confirmed"
  | "Site Visit Reminder"
  | "Deal Stage Changed"
  | "Commission Approved"
  | "Commission Released"
  | "Missing Document"
  | "Cold Lead Reactivation"
  | "Broker Sent Listing"
  | "Team Announcement"
  | "Bonus Campaign";

export interface NotificationItem {
  id: string;
  userId: string;
  category: NotificationCategory;
  priority: "Urgent" | "Important" | "Normal";
  title: string;
  body: string;
  occurredAt: string;
  read: boolean;
  relatedEntityId?: string;
}
