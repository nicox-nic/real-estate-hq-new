"use client";

import {
  verificationVisualFor,
  type VerificationStatus,
} from "@/lib/logic/verificationVisual";
import { cn } from "@/lib/cn";

/**
 * VerificationBadge — small badge for Private Offering cards.
 * All visual decisions delegated to verificationVisualFor.
 */
export function VerificationBadge({
  status,
  size = "sm",
  className,
}: {
  status: VerificationStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const visual = verificationVisualFor(status);
  const sizeClass =
    size === "md"
      ? "h-7 px-2.5 text-xs"
      : "h-6 px-2 text-[11px]";
  return (
    <span
      data-testid={`verification-badge-${visual.semantic}`}
      data-verification-status={status}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium tabular-nums",
        sizeClass,
        visual.badgeClass,
        className,
      )}
    >
      <visual.Icon className="h-3.5 w-3.5" />
      <span>{visual.label}</span>
    </span>
  );
}
