// Re-export the agent listings menu under the broker prefix so the
// useCurrentRole() hook picks up "Broker" from the URL and renders the
// role-aware actions accordingly.
//
// The drill-down routes (/broker/listings/for-sale/...) are not yet
// mirrored — when a broker drills in from this menu they land in the
// agent subtree and useCurrentRole() returns "Agent" again. Session 7
// adds the broker-specific drill-down with the distribution flow.
//
// For Session 4A the verification target is: from the broker menu, the
// listing-action button on tiles reads "Send to 9 agents" (broker-001 has
// 9 agents under). This holds via useCurrentRole reading the URL prefix.

export { default } from "@/app/agent/listings/page";
