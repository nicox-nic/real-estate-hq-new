/**
 * verificationVisualFor — concentrates verification-status visual treatment.
 *
 * Per Session 4B framing: "no inline color literals for verification states
 * outside a centralized helper." This module is the source of truth for
 * how Verified / Pending / Unverified status renders.
 *
 * Color mapping (per brand tokens):
 *   - Verified:   sage-deep + ShieldCheck — settled, trustworthy
 *   - Pending:    gold-deep + Clock       — in motion, attention earned
 *   - Unverified: terracotta-deep + ShieldAlert — needs verification before share
 *
 * Architecturally identical to primaryActionFor() from Session 4A: pure
 * mapping helper exported separately so verify can lock the contract
 * without invoking React. The component-level helper (badge component)
 * lives alongside.
 *
 * Rule of Three confirmed across the codebase:
 *   - applyTone (8 tones → text)
 *   - applyEngineRule (8 rules → suggestion)
 *   - splitCommission (party → amount)
 *   - primaryActionFor (3 roles → action label)
 *   - verificationVisualFor (3 states → badge visual)  ← this
 */

import {
  ShieldCheck,
  Clock,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type VerificationStatus = "Verified" | "Pending" | "Unverified";

export interface VerificationVisual {
  /** Display label for the badge. */
  label: string;
  /** Lucide icon for the badge. */
  Icon: LucideIcon;
  /** Tailwind classes: bg + text + border for the badge surface. */
  badgeClass: string;
  /** Tailwind classes for an icon-only accent (without bg). */
  iconAccentClass: string;
  /** Semantic identifier for verify suite and analytics. */
  semantic: "verified" | "pending" | "unverified";
}

/**
 * Pure mapping. Given a verification status, returns the canonical visual.
 * verify locks the label and semantic strings; the className strings are
 * editorial and can evolve without verify churn (but should never become
 * inline literals at call sites).
 */
export function verificationVisualFor(
  status: VerificationStatus,
): VerificationVisual {
  switch (status) {
    case "Verified":
      return {
        label: "Verified",
        Icon: ShieldCheck,
        badgeClass:
          "bg-sage-soft text-sage-deep border border-sage-deep/20",
        iconAccentClass: "text-sage-deep",
        semantic: "verified",
      };
    case "Pending":
      return {
        label: "Pending review",
        Icon: Clock,
        badgeClass: "bg-gold-soft text-gold-deep border border-gold-deep/20",
        iconAccentClass: "text-gold-deep",
        semantic: "pending",
      };
    case "Unverified":
      return {
        label: "Unverified",
        Icon: ShieldAlert,
        badgeClass:
          "bg-terracotta-soft text-terracotta-deep border border-terracotta-deep/20",
        iconAccentClass: "text-terracotta-deep",
        semantic: "unverified",
      };
  }
}

/**
 * All three states in PRD-listed display order, for filter-chip rendering.
 * Used by the Private Offerings filter chips.
 */
export const ALL_VERIFICATION_STATUSES: VerificationStatus[] = [
  "Verified",
  "Pending",
  "Unverified",
];
