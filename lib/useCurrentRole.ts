"use client";

import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/types";

/**
 * useCurrentRole — single source of truth for role-conditional rendering.
 *
 * Reads the URL prefix and returns the active user role. Used by listings
 * action rows, AppShell nav switches, and any other component that needs
 * to render differently per role.
 *
 * The convention is that all role-scoped routes live under /agent/...,
 * /broker/..., or /realtor/.... Routes outside those prefixes (auth, splash)
 * return "Agent" as a safe default; verify locks the default.
 *
 * Architecturally identical to useCurrentUser from the foundation phase:
 * concentrate role decisions in one place. Cross-file invariant: no inline
 * role string comparisons (role === "Broker") outside this helper and the
 * components that explicitly consume the role it returns.
 */
export function useCurrentRole(): UserRole {
  const pathname = usePathname() ?? "";
  return roleFromPathname(pathname);
}

/**
 * Pure helper extracted so verify can lock URL → role mapping without
 * needing to invoke React hooks.
 */
export function roleFromPathname(pathname: string): UserRole {
  if (pathname.startsWith("/broker")) return "Broker";
  if (pathname.startsWith("/realtor")) return "Realtor";
  if (pathname.startsWith("/agent")) return "Agent";
  // Auth pages, splash, anything else: default Agent. The default is also
  // what new accounts land on, so this is the safe choice.
  return "Agent";
}
