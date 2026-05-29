"use client";

import * as React from "react";
import type {
  EngagementEvent,
  EngagementEventKind,
  ShareCampaign,
  PropertyFile,
} from "@/lib/types";

/**
 * Engagement Event Simulator
 *
 * Powers the "look — engagement is happening live" demo beat. After a
 * Share is sent, this module schedules a sequence of EngagementEvents
 * to fire over the next ~40 seconds, simulating a real buyer opening
 * the smart link, viewing attachments, downloading files, and
 * (probabilistically) requesting a site visit.
 *
 * Two layers:
 *
 *   buildEngagementSchedule(...)  — PURE function. Returns the schedule
 *   as an array of {delayMs, eventKind, fileId?}. Determinism locked by
 *   verify. The schedule includes events ONLY for attachment categories
 *   actually present in the share (no brochure_opened if no brochure
 *   was attached).
 *
 *   useEngagementSimulation(...)  — React hook. Consumes the schedule
 *   and dispatches setTimeouts that call appendEngagementEvent on the
 *   share store. Timer set tracked in a ref; cleaned up on unmount.
 *
 * Per the framing's timing budget: 5s / 10s / 15s / 25s / 40s defaults.
 * Probabilistic site-visit-request at ~40% probability over the 40s
 * window. Confirmed during 5B as the demo pacing.
 */

// ---------------------------------------------------------------------------
// Pure schedule generation
// ---------------------------------------------------------------------------

export interface ScheduledEvent {
  /** Milliseconds after share send. */
  delayMs: number;
  kind: EngagementEventKind;
  /** Required for file-specific events; undefined for link_opened etc. */
  fileId?: string;
}

export interface ScheduleInput {
  campaignId: string;
  attachedFileIds: string[];
  filesById: Map<string, PropertyFile>;
  /** Random seed for deterministic probabilistic events (verify uses this). */
  rngSeed?: number;
}

/** Default timing schedule per the framing's defaults. */
export const SIMULATOR_TIMINGS = {
  linkOpenedMs: 3_000,
  brochureMs: 6_000,
  computationMs: 12_000,
  floorPlanMs: 18_000,
  locationMapMs: 25_000,
  siteVisitRequestMs: 38_000,
  /** Probability that a site_visit_request event fires (Math.random < this). */
  siteVisitRequestProbability: 0.4,
} as const;

/**
 * Deterministic LCG for reproducible probabilistic events. Returns [0, 1).
 */
function seededRandom(seed: number): number {
  // Linear congruential generator (numerical recipes)
  let x = seed >>> 0;
  x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
  return x / 4294967296;
}

/**
 * Pure: build the engagement schedule for a share.
 * The schedule fires events ONLY for attachment categories actually present.
 */
export function buildEngagementSchedule(
  input: ScheduleInput,
): ScheduledEvent[] {
  const schedule: ScheduledEvent[] = [];

  // Always fires: link opened. The smart link itself was opened.
  schedule.push({
    delayMs: SIMULATOR_TIMINGS.linkOpenedMs,
    kind: "link_opened",
  });

  // Per-category file-aware events. We bucket attachments by category so
  // we only schedule a brochure_opened if there's an actual brochure file.
  const brochure = findFirstByCategory(input, "Brochures");
  if (brochure) {
    schedule.push({
      delayMs: SIMULATOR_TIMINGS.brochureMs,
      kind: "brochure_opened",
      fileId: brochure.id,
    });
  }
  const computation = findFirstByCategory(input, "Computations");
  if (computation) {
    schedule.push({
      delayMs: SIMULATOR_TIMINGS.computationMs,
      kind: "computation_downloaded",
      fileId: computation.id,
    });
  }
  const floorPlan = findFirstByCategory(input, "Floor Plans");
  if (floorPlan) {
    schedule.push({
      delayMs: SIMULATOR_TIMINGS.floorPlanMs,
      kind: "floor_plan_viewed",
      fileId: floorPlan.id,
    });
  }
  const locationMap = findFirstByCategory(input, "Location Map");
  if (locationMap) {
    schedule.push({
      delayMs: SIMULATOR_TIMINGS.locationMapMs,
      kind: "location_map_opened",
      fileId: locationMap.id,
    });
  }

  // Probabilistic site visit request — only if a brochure OR computation
  // was sent (the buyer has enough info to consider booking).
  const hasInfoFile = !!brochure || !!computation;
  if (hasInfoFile) {
    const rng = input.rngSeed !== undefined ? seededRandom(input.rngSeed) : Math.random();
    if (rng < SIMULATOR_TIMINGS.siteVisitRequestProbability) {
      schedule.push({
        delayMs: SIMULATOR_TIMINGS.siteVisitRequestMs,
        kind: "site_visit_requested",
      });
    }
  }

  // Sort by delayMs ascending (already in order by construction, but lock it)
  schedule.sort((a, b) => a.delayMs - b.delayMs);
  return schedule;
}

function findFirstByCategory(
  input: ScheduleInput,
  category: PropertyFile["category"],
): PropertyFile | undefined {
  for (const id of input.attachedFileIds) {
    const f = input.filesById.get(id);
    if (f && f.category === category) return f;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// React hook — effectful dispatch
// ---------------------------------------------------------------------------

/**
 * Runs the engagement simulation for a campaign. On mount, schedules events
 * per buildEngagementSchedule. On unmount, clears all pending timers.
 *
 * Caller is the page that just sent the share — typically the conversation
 * thread or the listing detail. The hook is fire-and-forget; callers pass
 * the appendEvent callback (typically `appendEngagementEvent` from the
 * shareStore).
 */
export function useEngagementSimulation(
  campaign: ShareCampaign | null,
  filesById: Map<string, PropertyFile>,
  appendEvent: (campaignId: string, event: ScheduledEvent) => void,
): void {
  React.useEffect(() => {
    if (!campaign) return;
    // Don't simulate for historical campaigns that already have events.
    if (campaign.engagementEvents.length > 0) return;

    const schedule = buildEngagementSchedule({
      campaignId: campaign.id,
      attachedFileIds: campaign.attachedFileIds,
      filesById,
    });

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const ev of schedule) {
      const t = setTimeout(() => {
        appendEvent(campaign.id, ev);
      }, ev.delayMs);
      timers.push(t);
    }

    return () => {
      for (const t of timers) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id]);
}
