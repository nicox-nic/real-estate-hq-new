"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  badgeVariantForLead,
  hasEngineEditorialDisagreement,
  isLowWeightCard,
} from "@/lib/logic/leadInboxDerivations";
import type { Lead } from "@/lib/types";

/**
 * Lead row card with two visual weights:
 *   - Full (hot/warm/nurture/qualified leads): full avatar, two-line preview,
 *     tags row, badge, optional disagreement icon.
 *   - Low (cold inquiries with engine score < QUALIFIED_THRESHOLD): smaller
 *     avatar, single-line preview, no tags, muted badge, opacity-60.
 *
 * The disagreement icon (Option Z) sits next to the score chip — present
 * only when the engine and editorial categories diverge. A tooltip via
 * `title` gives the full story; the Buyer Profile is the full disclosure
 * surface.
 */
export interface LeadCardProps {
  lead: Lead;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  /**
   * Listing price map for engine scoring context. When provided, the engine's
   * budget-match signal can fire; without it the disagreement detection
   * works on the engine's no-listing-context view of the lead.
   */
  listingPriceById?: Map<string, number>;
}

export function LeadCard({
  lead,
  isSelecting,
  isSelected,
  onToggleSelect,
  listingPriceById,
}: LeadCardProps) {
  const lowWeight = isLowWeightCard(lead, listingPriceById);
  const disagrees = hasEngineEditorialDisagreement(lead, listingPriceById);
  const variant = badgeVariantForLead(lead);

  const initials = lead.buyer.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const inner = (
    <div
      data-testid={`lead-card-${lead.id}`}
      data-weight={lowWeight ? "low" : "full"}
      data-badge-variant={variant}
      className={cn(
        "rounded-2xl border bg-canvas-raised p-4 transition-colors",
        lowWeight
          ? "border-line opacity-60 hover:opacity-100 hover:border-line"
          : "border-line hover:border-gold/40 hover:shadow-soft",
        isSelected && "ring-2 ring-gold/40 border-gold",
      )}
    >
      <div className="flex items-start gap-3">
        {isSelecting ? (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.(lead.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "mt-1 h-4 w-4 rounded border-line text-gold-deep focus:ring-gold/30 shrink-0",
            )}
            aria-label={`Select ${lead.buyer.name}`}
          />
        ) : null}

        {/* Avatar */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold shrink-0",
            lowWeight
              ? "h-8 w-8 bg-canvas-sunken text-ink-subtle text-xs"
              : "h-10 w-10 bg-gold-soft text-gold-deep text-sm",
          )}
        >
          {initials}
        </div>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Top row: name + badge + disagreement icon + time */}
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={cn(
                "font-medium truncate",
                lowWeight ? "text-sm text-ink-muted" : "text-sm text-ink",
              )}
            >
              {lead.buyer.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <StatusBadge variant={variant}>
                {lead.seedScoreCategory}
              </StatusBadge>
              {disagrees && !lowWeight ? (
                <span
                  data-testid={`disagreement-icon-${lead.id}`}
                  title="The AI engine and editorial assessment disagree on this lead. Tap to see the full breakdown."
                  className="inline-flex items-center justify-center"
                  aria-label="Scoring disagreement"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-gold-deep" />
                </span>
              ) : null}
            </div>
            <span className="text-xs text-ink-subtle ml-auto shrink-0 hidden sm:inline">
              {formatRelativeTime(lead.lastMessageAt)}
            </span>
          </div>

          {/* Preview line(s) */}
          <p
            className={cn(
              "text-sm text-ink-muted",
              lowWeight ? "truncate" : "line-clamp-2",
            )}
          >
            {lead.lastMessagePreview}
          </p>

          {/* Tags row — full weight only */}
          {!lowWeight && lead.tags && lead.tags.length > 0 ? (
            <div
              data-testid={`tags-row-${lead.id}`}
              className="mt-2 flex flex-wrap gap-1"
            >
              {lead.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-canvas-sunken text-ink-muted"
                >
                  {t}
                </span>
              ))}
              {lead.needsReply ? (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-terracotta-soft text-terracotta-deep">
                  Needs reply
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Source tag — single line for low weight */}
          {lowWeight ? (
            <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-subtle">
              {lead.source}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (isSelecting) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(lead.id)}
        className="w-full text-left"
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={`/agent/leads/${lead.id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-gold/40 rounded-2xl"
    >
      {inner}
    </Link>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = new Date("2025-05-29T08:00:00.000Z").getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

/** A small empty-state component reused across inbox views. */
export function InboxEmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-canvas-raised p-10 text-center">
      <div className="h-10 w-10 rounded-full bg-gold-soft/50 text-gold-deep mx-auto mb-4 flex items-center justify-center">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="font-medium text-ink">{title}</div>
      <div className="mt-1 text-sm text-ink-muted">{body}</div>
    </div>
  );
}
