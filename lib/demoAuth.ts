/**
 * Prototype sign-in helpers — no real authentication.
 *
 * Passwords are not checked. Any value (or empty) works. Use `demo` by convention.
 */

import { seedUsers } from "@/lib/data";
import { landingDestination } from "@/lib/logic/accountAccess";
import type { AccountStatus, UserRole } from "@/lib/types";

/** Suggested password for demos; not validated server-side. */
export const DEMO_PASSWORD = "demo";

export type QuickDemoAccount = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  blurb: string;
};

/** Primary walkthrough personas — one tap from the login screen. */
export const QUICK_DEMO_ACCOUNTS: QuickDemoAccount[] = [
  {
    id: "agent-001",
    fullName: "Alyssa Garcia",
    email: "alyssa.garcia@realestate-hq.ph",
    role: "Agent",
    status: "Verified",
    blurb: "Agent · commissions, leads, Laurel Hills demo",
  },
  {
    id: "broker-001",
    fullName: "Maria Santos",
    email: "maria.santos@realestate-hq.ph",
    role: "Broker",
    status: "Verified",
    blurb: "Broker · team, distribution, leaderboard",
  },
  {
    id: "realtor-001",
    fullName: "Alex Reyes",
    email: "alex.reyes@realestate-hq.ph",
    role: "Realtor",
    status: "Verified",
    blurb: "Realtor · network-wide analytics",
  },
  {
    id: "agent-012",
    fullName: "Miguel Reyes",
    email: "miguel.reyes@realestate-hq.ph",
    role: "Agent",
    status: "Pending Verification",
    blurb: "Pending · verification flow",
  },
];

export type SignInResult =
  | { kind: "dashboard"; path: string }
  | { kind: "pending"; path: string }
  | { kind: "fallback"; path: "/agent" };

/**
 * Resolve where an email should land after sign-in.
 * Unknown emails fall through to the agent dashboard so the prototype stays walkable.
 */
export function resolveSignIn(email: string): SignInResult {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { kind: "fallback", path: "/agent" };
  }
  const match = seedUsers.find((u) => u.email.toLowerCase() === trimmed);
  if (!match) {
    return { kind: "fallback", path: "/agent" };
  }
  const dest = landingDestination(match.role, match.status);
  if (dest.kind === "dashboard") {
    return { kind: "dashboard", path: dest.path };
  }
  return {
    kind: "pending",
    path: `/auth/pending?status=${encodeURIComponent(match.status)}`,
  };
}

export function signInPathForEmail(email: string): string {
  return resolveSignIn(email).path;
}
