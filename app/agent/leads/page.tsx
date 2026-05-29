"use client";

import * as React from "react";
import { Search, X, Archive, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { LeadCard, InboxEmptyState } from "@/components/leads/LeadCard";
import { cn } from "@/lib/cn";
import { DEMO_AGENT_ID, seedLeads, seedListings, seedUsers } from "@/lib/data";
import {
  INBOX_FILTERS,
  type InboxFilter,
  buildListingPriceMap,
  chipCounts,
  filterInbox,
} from "@/lib/logic/leadInboxDerivations";

export default function LeadInboxPage() {
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  // Filter / search state
  const [chip, setChip] = React.useState<InboxFilter>("All");
  const [qualifiedOnly, setQualifiedOnly] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Bulk-select state — held in client memory only.
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Archived state — leads moved to nurturing this session.
  // Stored as a Set of lead IDs we've "archived" so the UI can suppress them
  // and the action confirmation shows the right count.
  const [archivedIds, setArchivedIds] = React.useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = React.useState<string | null>(null);

  // Listing prices for engine scoring context (budget-match signal needs them).
  const listingPriceById = React.useMemo(
    () => buildListingPriceMap(seedListings),
    [],
  );

  // Filter leads first by archive state, then by chip/search/qualified.
  const visibleLeads = React.useMemo(() => {
    const remaining = seedLeads.filter((l) => !archivedIds.has(l.id));
    return filterInbox(remaining, {
      chip,
      qualifiedOnly,
      search,
      listingPriceById,
    });
  }, [chip, qualifiedOnly, search, archivedIds, listingPriceById]);

  const counts = React.useMemo(
    () =>
      chipCounts(
        seedLeads.filter((l) => !archivedIds.has(l.id)),
        qualifiedOnly,
        listingPriceById,
      ),
    [qualifiedOnly, archivedIds, listingPriceById],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleBulkArchive = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setArchivedIds((prev) => {
      const next = new Set(prev);
      for (const id of selectedIds) next.add(id);
      return next;
    });
    setConfirmation(
      `Moved ${count} lead${count === 1 ? "" : "s"} to Nurturing.`,
    );
    exitSelectionMode();
    // Auto-clear the confirmation after a few seconds.
    setTimeout(() => setConfirmation(null), 3500);
  };

  // The cold-noise demo lead — empirically locked. Used to drive the
  // "default view hides this row" assertion.
  // (verify checks the engine score; the UI just renders what filterInbox returns.)

  return (
    <AppShell
      role="Agent"
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-5">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
              My Leads
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Triage your inbox by intent. AI keeps the noise down.
            </p>
          </div>
          <Button
            variant={isSelecting ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              if (isSelecting) exitSelectionMode();
              else setIsSelecting(true);
            }}
          >
            {isSelecting ? "Cancel" : "Select"}
          </Button>
        </header>

        {/* Search + qualified toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, or tag…"
              className={cn(
                "w-full h-10 pl-9 pr-9 rounded-xl border border-line bg-canvas-raised text-sm text-ink placeholder:text-ink-subtle",
                "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30",
              )}
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={qualifiedOnly}
              onChange={(e) => setQualifiedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-line text-gold-deep focus:ring-gold/30"
            />
            <span>Show qualified only</span>
          </label>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
          {INBOX_FILTERS.map((f) => {
            const active = chip === f;
            const c = counts[f];
            return (
              <button
                key={f}
                onClick={() => setChip(f)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 h-8 text-xs font-medium border transition-colors shrink-0 inline-flex items-center gap-1.5",
                  active
                    ? "bg-ink text-ink-inverse border-ink"
                    : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                )}
              >
                <span>{f}</span>
                {c > 0 ? (
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      active ? "text-ink-inverse/70" : "text-ink-subtle",
                    )}
                  >
                    {c}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Confirmation toast */}
        {confirmation ? (
          <div className="rounded-2xl border border-sage/30 bg-sage-soft/50 px-4 py-2.5 text-sm text-sage-deep flex items-center gap-2">
            <CheckCheck className="h-4 w-4" />
            {confirmation}
          </div>
        ) : null}

        {/* List */}
        {visibleLeads.length === 0 ? (
          <InboxEmptyState
            title="Inbox zero"
            body={
              qualifiedOnly && search === "" && chip === "All"
                ? "No qualified leads here. Switch off 'Show qualified only' to see unqualified inquiries."
                : "No leads match these filters."
            }
          />
        ) : (
          <div className="space-y-2">
            {visibleLeads.map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                isSelecting={isSelecting}
                isSelected={selectedIds.has(l.id)}
                onToggleSelect={toggleSelect}
                listingPriceById={listingPriceById}
              />
            ))}
          </div>
        )}

        {/* Tail summary — explains the qualified-only filter */}
        {qualifiedOnly && !isSelecting ? (
          <div className="text-xs text-ink-subtle pt-2">
            Cold inquiries (engine score &lt; 20) are hidden. AI estimates them
            unlikely to convert without qualification — toggle{" "}
            <em className="text-ink">Show qualified only</em> off to view them.
          </div>
        ) : null}

        {/* Bulk-action footer bar */}
        {isSelecting ? (
          <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 z-40 px-4 py-3 bg-canvas-raised border-t border-line shadow-lift">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
              <div className="text-sm text-ink-muted">
                <span className="font-semibold text-ink">
                  {selectedIds.size}
                </span>{" "}
                selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSelectionMode}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkArchive}
                  disabled={selectedIds.size === 0}
                >
                  <Archive className="h-4 w-4" />
                  Archive to Nurturing
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
