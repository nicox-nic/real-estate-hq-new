"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Tag, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActionRow } from "@/components/listings/ListingActionRow";
import {
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  seedListings,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import {
  CATEGORY_SLUGS,
} from "@/lib/logic/listingsDerivations";
import { formatPHPCompact, formatPercent } from "@/lib/format";
import type { TransactionType } from "@/lib/types";

/**
 * Shared category landing component.
 *
 * Used by all six non-"For Sale" categories (For Rent / Foreclosure /
 * For Assume / Pre-Selling / RFO / Commercial). Renders:
 *   - back link
 *   - header with category title + count
 *   - listing cards filtered by transactionType
 *   - role-aware action row on each card
 *
 * For Sale has its own dedicated landing (#15) with the Developer/Private
 * tab structure; this shared component covers the other six.
 */
export function CategoryListingsPage({
  category,
}: {
  category: TransactionType;
}) {
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const roleSlug = role.toLowerCase();

  const listings = React.useMemo(
    () => seedListings.filter((l) => l.transactionType === category),
    [category],
  );

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
        <Link
          href={`/${roleSlug}/listings`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>

        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            {category}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {blurbFor(category)}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Listings</CardTitle>
            <span className="text-xs text-ink-subtle">
              {listings.length} {listings.length === 1 ? "listing" : "listings"}
            </span>
          </CardHeader>

          {listings.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">
              No listings in this category yet.
            </p>
          ) : (
            <ul
              data-testid={`category-listings-${CATEGORY_SLUGS[category]}`}
              data-count={listings.length}
              className="space-y-3"
            >
              {listings.map((l) => (
                <li
                  key={l.id}
                  data-testid={`category-listing-card-${l.id}`}
                  className="rounded-2xl border border-line hover:border-gold/40 hover:shadow-soft p-4 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-11 w-11 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${roleSlug}/listings/${l.id}`}
                        className="text-sm font-medium text-ink hover:text-gold-deep transition-colors truncate block"
                      >
                        {l.title}
                      </Link>
                      <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {l.location} · {l.ownership}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-base font-semibold text-ink tabular-nums">
                        {l.transactionType === "For Rent" && l.rentalRate
                          ? `${formatPHPCompact(l.rentalRate)}/mo`
                          : formatPHPCompact(l.price)}
                      </div>
                      <div className="text-[10px] text-ink-subtle uppercase tracking-wider font-medium inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {formatPercent(l.commissionRate)} comm
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-line-soft">
                    <div>
                      <StatusBadge variant="neutral">
                        {l.transactionType}
                      </StatusBadge>
                    </div>
                    <ListingActionRow
                      role={role}
                      agentsUnderCount={agentsUnderBroker}
                      hideDetails
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function blurbFor(category: TransactionType): string {
  switch (category) {
    case "For Sale":
      return "Developer projects and private offerings.";
    case "For Rent":
      return "Rental units and lease opportunities.";
    case "Foreclosure":
      return "Bank-acquired and distressed properties.";
    case "For Assume":
      return "Assumed-balance unit takeovers.";
    case "Pre-Selling":
      return "Early bird pricing on upcoming developments.";
    case "RFO":
      return "Ready for occupancy — move-in ready units.";
    case "Commercial":
      return "Office spaces, retail, and commercial lots.";
  }
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
