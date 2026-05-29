/**
 * Site Visit derivations — pure helpers for status visuals + grouping.
 *
 * Concentration point for site-visit-related UI decisions. Same posture
 * as the other derivations modules: pure functions, typed I/O,
 * verify-locked.
 */

import type { SiteVisit, SiteVisitStatus } from "@/lib/types";

/**
 * Per-status badge variant. Single source of truth for site visit status
 * iconography across the app. The variants map to the existing
 * StatusBadge palette.
 */
export type SiteVisitBadgeVariant =
  | "paid"
  | "warm"
  | "nurture"
  | "neutral"
  | "hot";

export function statusVariantForSiteVisit(
  status: SiteVisitStatus,
): SiteVisitBadgeVariant {
  switch (status) {
    case "Confirmed":
    case "Reminder Sent":
    case "Converted":
      // Sage / success-ish — uses "paid" palette (sage-soft)
      return "paid";
    case "Proposed":
    case "Rescheduled":
      // Gold / pending
      return "warm";
    case "Completed":
      // Navy / info
      return "nurture";
    case "No-show":
      // Terracotta / danger
      return "hot";
  }
}

/** Returns true if this status counts as "upcoming" for list grouping. */
export function isUpcomingStatus(status: SiteVisitStatus): boolean {
  return (
    status === "Proposed" ||
    status === "Confirmed" ||
    status === "Reminder Sent" ||
    status === "Rescheduled"
  );
}

/** Partition site visits into upcoming + past. */
export function partitionSiteVisits(
  visits: SiteVisit[],
  nowIso: string,
): { upcoming: SiteVisit[]; past: SiteVisit[] } {
  const upcoming: SiteVisit[] = [];
  const past: SiteVisit[] = [];
  for (const v of visits) {
    if (v.scheduledAt >= nowIso && isUpcomingStatus(v.status)) {
      upcoming.push(v);
    } else {
      past.push(v);
    }
  }
  upcoming.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  past.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  return { upcoming, past };
}
