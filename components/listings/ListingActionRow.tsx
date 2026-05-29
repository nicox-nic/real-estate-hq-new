"use client";

import { Share2, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/lib/types";

/**
 * ListingActionRow — concentrates all role-aware action button decisions.
 *
 * Per Session 4A framing: "Action buttons on listing cards differ by role:
 * Agent sees 'Share to my pipeline,' Broker sees 'Send to N agents,'
 * Realtor sees 'Send to network.'"
 *
 * This component is the SINGLE place where that mapping is decided. Pages
 * pass in the role (via useCurrentRole()) and a context (sometimes a count
 * of agents under the broker, etc.); the component renders the appropriate
 * primary CTA + an optional secondary "Details" affordance.
 *
 * Verify locks the mapping: given a role, the rendered primary label is
 * deterministic. Cross-file invariant: no inline role string comparisons
 * outside this component for action-button choice.
 */
export interface ListingActionRowProps {
  role: UserRole;
  /** Count of agents under the current broker (for "Send to N agents"). */
  agentsUnderCount?: number;
  /** Compact: button only, no secondary affordance. */
  compact?: boolean;
  /** Hide the secondary "Details" button. */
  hideDetails?: boolean;
  onPrimary?: () => void;
  onDetails?: () => void;
}

export function ListingActionRow({
  role,
  agentsUnderCount,
  compact,
  hideDetails,
  onPrimary,
  onDetails,
}: ListingActionRowProps) {
  const { label, Icon } = primaryActionFor(role, agentsUnderCount);

  return (
    <div
      data-testid="listing-action-row"
      data-role={role}
      data-primary-label={label}
      className="flex items-center gap-2"
    >
      <Button
        variant="primary"
        size="sm"
        onClick={onPrimary}
        data-testid="listing-primary-action"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
      {!compact && !hideDetails ? (
        <Button variant="ghost" size="sm" onClick={onDetails}>
          Details
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Pure helper — exported so verify can lock the role → label mapping
 * without rendering React.
 */
export function primaryActionFor(
  role: UserRole,
  agentsUnderCount?: number,
): { label: string; Icon: typeof Share2 } {
  switch (role) {
    case "Agent":
      return { label: "Share to my pipeline", Icon: Share2 };
    case "Broker": {
      const count = agentsUnderCount ?? 0;
      return {
        label: count > 0 ? `Send to ${count} agents` : "Send to agents",
        Icon: Send,
      };
    }
    case "Realtor":
      return { label: "Send to network", Icon: Users };
  }
}
