"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Search, X, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  searchListings,
  type ExtractedQuery,
  type SearchResult,
} from "@/lib/logic/aiListingSearch";
import { formatPHPCompact, formatPercent } from "@/lib/format";
import type { Listing, UserRole } from "@/lib/types";

/**
 * AISearchInput — natural-language listing search with transparency chips.
 *
 * Mirrors the AI Reply panel's transparency discipline from Session 3B:
 * the search interpretation is visible to the user (chips below the input
 * show "2BR · Condo · BGC · ≤₱20M"), not a hidden black box.
 *
 * Behavior is fully deterministic — same input → same result. See
 * lib/logic/aiListingSearch.ts.
 */
export interface AISearchInputProps {
  listings: Listing[];
  role: UserRole;
  /** Suggested query phrases for the empty state. */
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "2BR condo in BGC under 20M",
  "House and lot in Cebu with at least 3% commission",
  "Pre-Selling in Makati",
  "Foreclosure properties in Cebu",
];

export function AISearchInput({
  listings,
  role,
  suggestions = DEFAULT_SUGGESTIONS,
}: AISearchInputProps) {
  const [input, setInput] = React.useState("");
  const [active, setActive] = React.useState(false);

  const result: SearchResult | null = React.useMemo(() => {
    const trimmed = input.trim();
    if (trimmed.length < 2) return null;
    return searchListings(trimmed, listings);
  }, [input, listings]);

  const roleSlug = role.toLowerCase();

  return (
    <div className="space-y-2">
      {/* Input row */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-2 rounded-2xl border bg-canvas-raised px-3 h-12 transition-colors",
            active ? "border-gold/60 shadow-soft" : "border-line",
          )}
        >
          <Sparkles className="h-4 w-4 text-gold-deep shrink-0" />
          <input
            data-testid="ai-search-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            placeholder='Try "2BR condo in BGC under 20M"'
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          {input ? (
            <button
              onClick={() => setInput("")}
              className="text-ink-subtle hover:text-ink"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-ink-subtle shrink-0" />
          )}
        </div>
      </div>

      {/* Transparency chips */}
      {result && result.chips.length > 0 ? (
        <TransparencyChipsRow query={result.query} chipCount={result.chips.length} chips={result.chips} />
      ) : null}

      {/* Results dropdown */}
      {result ? (
        <Card className="!p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-ink-muted">
              {result.matches.length === 0
                ? "No listings match your search."
                : `${result.matches.length} ${result.matches.length === 1 ? "match" : "matches"}`}
            </p>
          </div>

          {result.matches.length === 0 ? (
            <div data-testid="ai-search-empty-state" className="py-3 space-y-2">
              <p className="text-sm text-ink-muted">
                Try one of these instead:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    data-testid="ai-search-suggestion"
                    onClick={() => setInput(s)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-canvas-sunken text-ink-muted hover:bg-gold-soft hover:text-gold-deep border border-line transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul
              data-testid="ai-search-results"
              data-result-count={result.matches.length}
              className="space-y-1.5"
            >
              {result.matches.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/${roleSlug}/listings/${l.id}`}
                    data-testid={`ai-search-result-${l.id}`}
                    className="block rounded-xl p-2.5 hover:bg-canvas-sunken transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink truncate">
                          {l.title}
                        </div>
                        <div className="text-[11px] text-ink-muted flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {l.location} · {formatPercent(l.commissionRate)} comm
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-ink tabular-nums">
                          {l.transactionType === "For Rent" && l.rentalRate
                            ? `${formatPHPCompact(l.rentalRate)}/mo`
                            : formatPHPCompact(l.price)}
                        </div>
                        <div className="text-[10px] text-ink-subtle">
                          {l.transactionType}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {result.matches.length > 6 ? (
                <li className="text-[11px] text-ink-subtle pt-1 text-center">
                  +{result.matches.length - 6} more — refine the search
                </li>
              ) : null}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function TransparencyChipsRow({
  chipCount,
  chips,
}: {
  query: ExtractedQuery;
  chipCount: number;
  chips: SearchResult["chips"];
}) {
  return (
    <div
      data-testid="ai-search-chips"
      data-chip-count={chipCount}
      className="flex items-center gap-2 flex-wrap"
    >
      <span className="text-[11px] text-ink-subtle uppercase tracking-wider font-medium">
        Filtering by:
      </span>
      {chips.map((c, i) => (
        <span
          key={`${c.kind}-${i}`}
          data-testid={`ai-search-chip-${c.kind}`}
          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gold-soft text-gold-deep border border-gold-deep/20"
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}
