"use client";

import * as React from "react";
import { Eye, FileText, Camera, Layout, MapPin, ListChecks, CreditCard, Folder, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  EngagementEvent,
  EngagementEventKind,
  PropertyFile,
} from "@/lib/types";

/**
 * FileEngagementStrip — per-attachment engagement status row.
 *
 * Matches the mockup's bottom strip (Real_Estate_HQ_Organizer_mockup.png
 * bottom row):
 *   "File Engagement Tracking · See when Maria interacts with your shared
 *    files."
 *   [Brochure Opened 10:24 AM]  [Computation Downloaded 10:26 AM]
 *   [Floor Plan Viewed 10:27 AM] [Location Map Opened 10:28 AM]  →
 *
 * Each card shows: file icon + file label + engagement status + timestamp.
 * The most recently engaged file gets a sage-deep live pulse on the eye icon.
 *
 * Pure rendering: derives state from props (events + files). No hooks,
 * no fetching. The parent passes events from the share store.
 */

export interface FileEngagementStripProps {
  /** Buyer first name — used in the subtitle. */
  buyerFirstName?: string;
  /** Attached files for this campaign. */
  files: PropertyFile[];
  /** All engagement events for this campaign (file-tagged + global). */
  events: EngagementEvent[];
  /** Inline / standalone surface variant. Inline keeps a smaller header. */
  variant?: "inline" | "standalone";
}

interface FileStatus {
  /** Display label for the engagement status, e.g. "Opened", "Downloaded". */
  label: string;
  /** ISO timestamp of the most recent event on this file, undefined if none. */
  at?: string;
  /** Is this the most recently engaged file in the strip? */
  isMostRecent: boolean;
}

const FILE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Brochures: FileText,
  Computations: FileText,
  "Floor Plans": Layout,
  "Location Map": MapPin,
  Photos: Camera,
  "Price List": ListChecks,
  "Payment Terms": CreditCard,
  Requirements: Folder,
};

export function FileEngagementStrip({
  buyerFirstName,
  files,
  events,
  variant = "inline",
}: FileEngagementStripProps) {
  // Index events by fileId, oldest-first within each file
  const eventsByFile = React.useMemo(() => {
    const map = new Map<string, EngagementEvent[]>();
    for (const e of events) {
      if (!e.fileId) continue;
      const prev = map.get(e.fileId) ?? [];
      map.set(e.fileId, [...prev, e]);
    }
    // Sort each bucket ascending
    for (const [k, v] of map) {
      map.set(
        k,
        [...v].sort((a, b) => a.at.localeCompare(b.at)),
      );
    }
    return map;
  }, [events]);

  // Find the most recent file event (across all files)
  const mostRecentFileId = React.useMemo(() => {
    let bestId: string | undefined;
    let bestAt = "";
    for (const [fileId, evs] of eventsByFile) {
      const last = evs[evs.length - 1];
      if (!last) continue;
      if (last.at > bestAt) {
        bestAt = last.at;
        bestId = fileId;
      }
    }
    return bestId;
  }, [eventsByFile]);

  // Derive status per file
  const statusFor = (fileId: string): FileStatus => {
    const evs = eventsByFile.get(fileId) ?? [];
    if (evs.length === 0) {
      return { label: "Not opened", isMostRecent: false };
    }
    const last = evs[evs.length - 1]!;
    return {
      label: labelFor(last.kind),
      at: last.at,
      isMostRecent: fileId === mostRecentFileId,
    };
  };

  if (files.length === 0) return null;

  return (
    <section
      data-testid="file-engagement-strip"
      data-file-count={files.length}
      data-event-count={events.length}
      className={cn(
        "rounded-2xl bg-canvas-raised border border-line",
        variant === "standalone" ? "p-4" : "p-3",
      )}
    >
      <header
        className={cn(
          "mb-2.5",
          variant === "standalone" ? "" : "flex items-baseline gap-2",
        )}
      >
        <h3
          className={cn(
            "font-medium text-ink",
            variant === "standalone" ? "text-sm" : "text-xs",
          )}
        >
          File Engagement Tracking
        </h3>
        <p
          className={cn(
            "text-ink-subtle",
            variant === "standalone" ? "text-xs mt-0.5" : "text-[10px]",
          )}
        >
          See when {buyerFirstName ?? "the buyer"} interacts with your shared
          files.
        </p>
      </header>
      <ul
        data-testid="file-engagement-list"
        className="flex items-stretch gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none"
      >
        {files.map((f) => {
          const s = statusFor(f.id);
          const Icon = FILE_CATEGORY_ICONS[f.category] ?? FileText;
          const opened = !!s.at;
          return (
            <li
              key={f.id}
              data-testid={`engagement-card-${f.id}`}
              data-status={s.label}
              data-most-recent={s.isMostRecent}
              className="shrink-0 w-40 rounded-xl border border-line bg-canvas-sunken/30 p-2.5"
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    f.format === "PDF"
                      ? "bg-terracotta-soft text-terracotta-deep"
                      : "bg-navy-soft text-navy",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "relative inline-flex h-5 w-5 rounded-full items-center justify-center",
                    opened
                      ? "bg-sage-soft text-sage-deep"
                      : "bg-canvas-sunken text-ink-subtle",
                  )}
                  aria-label={opened ? "Opened" : "Not opened"}
                >
                  <Eye className="h-3 w-3" />
                  {s.isMostRecent ? (
                    <span
                      data-testid="engagement-live-pulse"
                      className="absolute inset-0 rounded-full bg-sage-deep/40 animate-ping"
                      aria-hidden
                    />
                  ) : null}
                </span>
              </div>
              <p className="text-[11px] font-medium text-ink mt-2 truncate">
                {categoryShortLabel(f.category)}
              </p>
              <p
                className={cn(
                  "text-[10px] font-medium mt-0.5",
                  opened ? "text-sage-deep" : "text-ink-subtle",
                )}
              >
                {s.label}
              </p>
              <p className="text-[10px] text-ink-subtle">
                {s.at ? formatTime(s.at) : "—"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Pure helpers — exported for verify. */

export function labelFor(kind: EngagementEventKind): string {
  switch (kind) {
    case "link_opened":
      return "Link opened";
    case "brochure_opened":
      return "Opened";
    case "brochure_downloaded":
      return "Downloaded";
    case "computation_opened":
      return "Opened";
    case "computation_downloaded":
      return "Downloaded";
    case "computation_requested":
      return "Requested";
    case "floor_plan_viewed":
      return "Viewed";
    case "location_map_opened":
      return "Opened";
    case "price_list_opened":
      return "Opened";
    case "payment_terms_opened":
      return "Opened";
    case "photo_viewed":
      return "Viewed";
    case "video_watched":
      return "Watched";
    case "site_visit_requested":
      return "Visit requested";
    case "reply_received":
      return "Replied";
    case "reshared":
      return "Reshared";
  }
}

export function categoryShortLabel(category: PropertyFile["category"]): string {
  // Keep labels short enough for the card width
  switch (category) {
    case "Floor Plans":
      return "Floor Plan";
    case "Location Map":
      return "Location Map";
    case "Price List":
      return "Price List";
    case "Payment Terms":
      return "Payment Terms";
    default:
      // Strip trailing 's' so "Brochures" → "Brochure", "Computations" → "Computation"
      return category.replace(/s$/, "");
  }
}

function formatTime(iso: string): string {
  // Render in en-PH locale with hour:minute AM/PM. Deterministic enough
  // for verify when given Z-suffixed timestamps in PHT-aligned UTC.
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });
  } catch {
    return "";
  }
}
