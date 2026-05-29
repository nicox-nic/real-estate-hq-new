/**
 * Commission Aggregations — all routed through roleAwareAmount.
 *
 * The four KPIs from the Commission Tracking mockup:
 *   - Total Commission Earned (everything)
 *   - Paid to Date          (status = Paid)
 *   - Pending Payout         (status in For Closing | For Payout | For Approval)
 *   - On Hold                (status = On Hold)
 *
 * Plus the breakdown donut categories:
 *   - Closed Deals        (status = Paid)
 *   - For Closing         (status = For Closing)
 *   - For Approval        (status = For Approval)
 *   - On Hold             (status = On Hold)
 *
 * Note the mockup's donut conflates "For Payout" and "For Closing" visually
 * but the PRD's transactions table distinguishes them. We expose both
 * granularities.
 */

import type { Commission, CommissionStatus } from "@/lib/types";
import {
  amountFor,
  filterVisibleToViewer,
  type ViewerContext,
} from "./roleAwareAmount";

export interface CommissionKPIs {
  totalEarned: number;
  paidToDate: number;
  pendingPayout: number;
  onHold: number;
  // For comparisons across periods
  visibleCount: number;
}

export interface CommissionBreakdown {
  closedDealsAmount: number;
  forClosingAmount: number;
  forApprovalAmount: number;
  onHoldAmount: number;
  forPayoutAmount: number; // exposed separately, NOT included in forClosing
  total: number;
}

const PENDING_STATUSES: CommissionStatus[] = [
  "For Approval",
  "For Closing",
  "For Payout",
];

export function computeKPIs(
  commissions: Commission[],
  viewer: ViewerContext,
): CommissionKPIs {
  const visible = filterVisibleToViewer(commissions, viewer);
  let totalEarned = 0;
  let paidToDate = 0;
  let pendingPayout = 0;
  let onHold = 0;
  for (const c of visible) {
    const amt = amountFor(c, viewer);
    totalEarned += amt;
    if (c.status === "Paid") paidToDate += amt;
    else if (c.status === "On Hold") onHold += amt;
    else if (PENDING_STATUSES.includes(c.status)) pendingPayout += amt;
  }
  return {
    totalEarned,
    paidToDate,
    pendingPayout,
    onHold,
    visibleCount: visible.length,
  };
}

export function computeBreakdown(
  commissions: Commission[],
  viewer: ViewerContext,
): CommissionBreakdown {
  const visible = filterVisibleToViewer(commissions, viewer);
  let closedDealsAmount = 0;
  let forClosingAmount = 0;
  let forApprovalAmount = 0;
  let onHoldAmount = 0;
  let forPayoutAmount = 0;
  let total = 0;
  for (const c of visible) {
    const amt = amountFor(c, viewer);
    total += amt;
    switch (c.status) {
      case "Paid":
        closedDealsAmount += amt;
        break;
      case "For Closing":
        forClosingAmount += amt;
        break;
      case "For Approval":
        forApprovalAmount += amt;
        break;
      case "On Hold":
        onHoldAmount += amt;
        break;
      case "For Payout":
        forPayoutAmount += amt;
        break;
    }
  }
  return {
    closedDealsAmount,
    forClosingAmount,
    forApprovalAmount,
    onHoldAmount,
    forPayoutAmount,
    total,
  };
}

/**
 * Pending → Paid trajectory percentage. Used by the "monthly target" hint.
 */
export function progressPct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}
