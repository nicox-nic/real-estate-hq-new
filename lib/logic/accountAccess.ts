/**
 * Account access gating — single source of truth for status-based routing.
 *
 * Maps a user's account status to:
 *   - the route they should land on after login
 *   - whether they can access role-specific features
 *
 * The Pending Verification screen serves four sub-states (Pending / Verified /
 * Rejected / Needs More Documents). For Verified users, login routes them
 * to their role dashboard.
 *
 * This is pure logic — verify can call it directly without spinning up the
 * router.
 */

import type { AccountStatus, UserRole } from "@/lib/types";

export type LandingDestination =
  | { kind: "dashboard"; path: string }
  | { kind: "pending"; status: AccountStatus; reason: string };

const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  Agent: "/agent",
  Broker: "/broker",
  Realtor: "/realtor",
};

export function landingDestination(
  role: UserRole,
  status: AccountStatus,
): LandingDestination {
  if (status === "Verified") {
    return { kind: "dashboard", path: DASHBOARD_BY_ROLE[role] };
  }
  return {
    kind: "pending",
    status,
    reason: pendingReason(status),
  };
}

export function pendingReason(status: AccountStatus): string {
  switch (status) {
    case "Pending Verification":
      return "We're reviewing your application. This typically takes 1–2 business days.";
    case "Needs More Documents":
      return "We need additional documents to complete your verification. Please re-upload the items listed below.";
    case "Rejected":
      return "Your application could not be approved. Please review the notes below and contact support if you have questions.";
    case "Verified":
      return "Your account is verified.";
  }
}

/**
 * Returns true if a user with this status can access role-specific features
 * (lead assignment, commissions, broker listings, client communication).
 * Per the PRD, unverified users see only profile status / missing documents /
 * verification progress / contact support / resubmit documents.
 */
export function canAccessRoleFeatures(status: AccountStatus): boolean {
  return status === "Verified";
}
