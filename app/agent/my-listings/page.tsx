"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Tag, Sparkles, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActionRow } from "@/components/listings/ListingActionRow";
import { VerificationBadge } from "@/components/listings/VerificationBadge";
import { AISearchInput } from "@/components/listings/AISearchInput";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  seedListings,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import {
  listingsForUser,
  applyActiveFilter,
  applyTransactionTypeFilter,
  myListingsHeadingFor,
  ACTIVE_FILTERS,
  type MyListingsActiveFilter,
  type MyListingsTxnFilter,
} from "@/lib/logic/myListingsDerivations";
import { TRANSACTION_CATEGORIES } from "@/lib/logic/listingsDerivations";
import { formatPHPCompact, formatPercent } from "@/lib/format";
import type { Listing } from "@/lib/types";

/**
 * My Listings (#20).
 *
 * For Agent: listings they own or have been assigned. Header: "My Listings".
 * For Broker: listings they own + listings their agents own. Header: "Listings
 *   I've distributed".
 * For Realtor: listings across their network. Header: "Listings across my
 *   network".
 *
 * All three roles get the same filter shape (All/Active/Archived × transaction
 * type). The semantics of what's "mine" differs per role; everything else is
 * the same.
 */
export default function MyListingsPage() {
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const heading = myListingsHeadingFor(role);

  const myListings = React.useMemo(() => {
    if (!user) return [];
    return listingsForUser(user, seedListings, seedUsers);
  }, [user]);

  const [activeFilter, setActiveFilter] =
    React.useState<MyListingsActiveFilter>("All");
  const [txnFilter, setTxnFilter] = React.useState<MyListingsTxnFilter>("All");

  const afterActive = applyActiveFilter(myListings, activeFilter);
  const filtered = applyTransactionTypeFilter(afterActive, txnFilter);

  const agentsUnderBroker = React.useMemo(
    () =>
      seedUsers.filter(
        (u) => u.parentId === DEMO_BROKER_ID && u.role === "Agent",
      ).length,
    [],
  );

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            {heading.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{heading.subtitle}</p>
        </header>

        <AISearchInput listings={myListings} role={role} />

        {/* Active filter chips */}
        <div className="space-y-2">
          <div
            data-testid="my-listings-active-filters"
            className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
          >
            {ACTIVE_FILTERS.map((f) => {
              const active = activeFilter === f;
              const count = applyActiveFilter(myListings, f).length;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  data-testid={`active-filter-${f.toLowerCase()}`}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 h-8 text-xs font-medium border transition-colors shrink-0 inline-flex items-center gap-1.5",
                    active
                      ? "bg-ink text-ink-inverse border-ink"
                      : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                  )}
                >
                  <span>{f}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        active ? "text-ink-inverse/70" : "text-ink-subtle",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Transaction type filter chips */}
          <div
            data-testid="my-listings-txn-filters"
            className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
          >
            <FilterChip
              label="All types"
              count={afterActive.length}
              active={txnFilter === "All"}
              onClick={() => setTxnFilter("All")}
              testId="txn-filter-all"
            />
            {TRANSACTION_CATEGORIES.map((c) => {
              const count = applyTransactionTypeFilter(afterActive, c).length;
              if (count === 0) return null;
              return (
                <FilterChip
                  key={c}
                  label={c}
                  count={count}
                  active={txnFilter === c}
                  onClick={() => setTxnFilter(c)}
                  testId={`txn-filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
                />
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listings</CardTitle>
            <span className="text-xs text-ink-subtle">
              {filtered.length} of {myListings.length}
            </span>
          </CardHeader>

          {filtered.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">
              {myListings.length === 0
                ? "No listings yet. Listings you own or have been assigned will appear here."
                : "No listings match these filters."}
            </p>
          ) : (
            <ul
              data-testid="my-listings-list"
              data-count={filtered.length}
              className="space-y-3"
            >
              {filtered.map((l) => (
                <MyListingCard
                  key={l.id}
                  listing={l}
                  role={role}
                  agentsUnderCount={agentsUnderBroker}
                />
              ))}
            </ul>
          )}
        </Card>

        <p className="text-[11px] text-ink-subtle italic">
          Tapping a listing opens the listing detail page (Session 5 work).
          "Share with buyer" routes through the Share Listing flow (also
          Session 5).
        </p>
      </div>
    </AppShell>
  );
}

function MyListingCard({
  listing,
  role,
  agentsUnderCount,
}: {
  listing: Listing;
  role: ReturnType<typeof useCurrentRole>;
  agentsUnderCount: number;
}) {
  return (
    <li
      data-testid={`my-listing-card-${listing.id}`}
      data-transaction-type={listing.transactionType}
      data-availability={listing.availability}
      className="rounded-2xl border border-line hover:border-gold/40 hover:shadow-soft p-4 transition-colors"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="h-11 w-11 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${role.toLowerCase()}/listings/${listing.id}`}
            className="font-medium text-ink hover:text-gold-deep transition-colors truncate block"
          >
            {listing.title}
          </Link>
          <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.location} · {listing.propertyType}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-base font-semibold text-ink tabular-nums">
            {listing.transactionType === "For Rent" && listing.rentalRate
              ? `${formatPHPCompact(listing.rentalRate)}/mo`
              : formatPHPCompact(listing.price)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium inline-flex items-center gap-1 justify-end">
            <Tag className="h-3 w-3" />
            {formatPercent(listing.commissionRate)} comm
          </div>
        </div>
      </div>

      {/* Status + engagement */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <StatusBadge variant="neutral">{listing.transactionType}</StatusBadge>
        <StatusBadge
          variant={
            listing.availability === "Available"
              ? "paid"
              : listing.availability === "Sold Out Soon"
                ? "for-approval"
                : listing.availability === "Reserved"
                  ? "on-hold"
                  : "neutral"
          }
        >
          {listing.availability}
        </StatusBadge>
        {listing.verificationStatus &&
        listing.ownership !== "Developer Listing" ? (
          <VerificationBadge status={listing.verificationStatus} />
        ) : null}
        <span className="text-[11px] text-ink-subtle inline-flex items-center gap-1 ml-auto">
          <Sparkles className="h-3 w-3 text-gold-deep" />
          {listing.engagementCount} engagement
          {listing.engagementCount === 1 ? "" : "s"}
        </span>
      </div>

      {/* Action row */}
      <div className="pt-3 border-t border-line-soft flex items-center justify-end">
        <ListingActionRow
          role={role}
          agentsUnderCount={agentsUnderCount}
          hideDetails
        />
      </div>
    </li>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  testId,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "whitespace-nowrap rounded-full px-3 h-8 text-xs font-medium border transition-colors shrink-0 inline-flex items-center gap-1.5",
        active
          ? "bg-ink text-ink-inverse border-ink"
          : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
      )}
    >
      <span>{label}</span>
      {count > 0 ? (
        <span
          className={cn(
            "text-[10px] tabular-nums",
            active ? "text-ink-inverse/70" : "text-ink-subtle",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function currentUserFor(role: ReturnType<typeof useCurrentRole>) {
  const id =
    role === "Broker"
      ? DEMO_BROKER_ID
      : role === "Realtor"
        ? DEMO_REALTOR_ID
        : DEMO_AGENT_ID;
  return seedUsers.find((u) => u.id === id);
}
