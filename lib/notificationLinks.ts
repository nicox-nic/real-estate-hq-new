import { roleBasePath } from "@/lib/rolePaths";
import type { NotificationItem, UserRole } from "@/lib/types";

/**
 * Resolve tap-through URL for a notification based on relatedEntityId prefix.
 * Paths are role-scoped where matching routes exist.
 */
export function entityHrefForRole(
  role: UserRole,
  n: NotificationItem,
): string | undefined {
  if (!n.relatedEntityId) return undefined;
  const id = n.relatedEntityId;
  const base = roleBasePath(role);

  if (id.startsWith("lead-")) return `${base}/leads/${id}`;
  if (id.startsWith("listing-")) return `${base}/listings/${id}`;
  if (id.startsWith("sv-") || id.startsWith("visit-")) {
    return `${base}/site-visits/${id}`;
  }
  if (id.startsWith("agent-")) {
    if (role === "Agent") return `${base}/leads`;
    return `${base}/agents/${id}`;
  }
  if (id.startsWith("deal-")) {
    if (role === "Agent") return `${base}/deals/${id}`;
    return `${base}/insights`;
  }
  if (id.startsWith("comm-")) {
    if (role === "Agent") return `${base}/commissions/${id}/timeline`;
    return `${base}/insights`;
  }
  if (id.startsWith("update-") || id.startsWith("bonus-")) return undefined;
  return undefined;
}
