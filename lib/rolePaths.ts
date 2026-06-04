import type { UserRole } from "@/lib/types";
import {
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  seedUsers,
} from "@/lib/data";

export function roleBasePath(role: UserRole): string {
  if (role === "Broker") return "/broker";
  if (role === "Realtor") return "/realtor";
  return "/agent";
}

export function settingsPathForRole(role: UserRole): string {
  return `${roleBasePath(role)}/settings`;
}

export function integrationsPathForRole(role: UserRole): string {
  return `${roleBasePath(role)}/integrations`;
}

export function demoUserIdForRole(role: UserRole): string {
  if (role === "Broker") return DEMO_BROKER_ID;
  if (role === "Realtor") return DEMO_REALTOR_ID;
  return DEMO_AGENT_ID;
}

export function demoUserForRole(role: UserRole) {
  const id = demoUserIdForRole(role);
  return seedUsers.find((u) => u.id === id);
}
