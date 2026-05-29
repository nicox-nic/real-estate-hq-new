/**
 * Data barrel — single import point for all seed data.
 *
 * Usage: `import { seedUsers, seedListings, DEMO_AGENT_ID } from "@/lib/data";`
 *
 * Future swap to a backend should only require changes inside this file
 * (turn each export into an async fetch and the call sites unchanged).
 */

export {
  seedUsers,
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  NURTURE_BEAT_AGENT_ID,
} from "@/data/users";

export { seedDevelopers, seedProjects } from "@/data/developers";

export { seedUnits, seedListings } from "@/data/listings";

export {
  seedLeads,
  COLD_NOISE_LEAD_ID,
  CONTRADICTION_LEAD_ID,
  NURTURE_BEAT_LEAD_ID,
} from "@/data/leads";

export { seedDeals, seedCommissions, seedPayoutAccounts } from "@/data/deals";

export { seedSiteVisits } from "@/data/siteVisits";

export { seedShareCampaigns } from "@/data/shareCampaigns";

export { seedConversationMessages } from "@/data/conversationMessages";

export { seedPropertyFiles } from "@/data/propertyFiles";

export {
  seedTeamUpdates,
  seedBonusCampaigns,
  seedAIActivity,
} from "@/data/teamAndAI";

export {
  seedIntegrations,
  seedNotifications,
} from "@/data/integrationsAndNotifications";
