"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Tag,
  User,
  Building2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActionRow } from "@/components/listings/ListingActionRow";
import { VerificationBadge } from "@/components/listings/VerificationBadge";
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
  ALL_VERIFICATION_STATUSES,
  type VerificationStatus,
} from "@/lib/logic/verificationVisual";
import { formatPHPCompact, formatPercent } from "@/lib/format";
import type { Listing } from "@/lib/types";

/**
 * Private Offerings (#19) — full surface.
 *
 * Per PRD: "Private Offerings should be organized by Broker Listings / Agent
 * Personal Listings / Owner Direct / Exclusive Listings / Off-Market Deals."
 * Plus verification status badges per card.
 *
 * Implementation: lists every For-Sale listing whose ownership is NOT
 * "Developer Listing." Filter chips for verification status + ownership.
 * Each card shows verification badge, ownership badge, location, price,
 * commission, seller info, and role-aware primary action.
 */
export default function PrivateOfferingsPage() {
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const roleSlug = role.toLowerCase();

  const [verificationFilter, setVerificationFilter] =
    React.useState<VerificationStatus | "All">("All");

  const allPrivate = React.useMemo(
    () =>
      seedListings.filter(
        (l) =>
          l.transactionType === "For Sale" &&
          l.ownership !== "Developer Listing",
      ),
    [],
  );

  const filtered = React.useMemo(() => {
    if (verificationFilter === "All") return allPrivate;
    return allPrivate.filter(
      (l) => l.verificationStatus === verificationFilter,
    );
  }, [allPrivate, verificationFilter]);

  const agentsUnderBroker = React.useMemo(
    () =>
      seedUsers.filter(
        (u) => u.parentId === DEMO_BROKER_ID && u.role === "Agent",
      ).length,
    [],
  );

  const filters: Array<{ key: VerificationStatus | "All"; label: string; count: number }> = [
    { key: "All", label: "All", count: allPrivate.length },
    ...ALL_VERIFICATION_STATUSES.map((s) => ({
      key: s,
      label: s,
      count: allPrivate.filter((l) => l.verificationStatus === s).length,
    })),
  ];

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-5">
        <Link
          href={
            role === "Agent"
              ? `/${roleSlug}/listings/for-sale`
              : `/${roleSlug}/listings`
          }
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {role === "Agent" ? "Back to For Sale" : "Back to Listings"}
        </Link>

        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            Private Offerings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Broker listings, agent personal listings, exclusive offerings.
          </p>
        </header>

        {/* Verification filter chips */}
        <div
          data-testid="verification-filter-chips"
          className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
        >
          {filters.map((f) => {
            const active = verificationFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setVerificationFilter(f.key)}
                data-testid={`verification-filter-${f.key.toLowerCase()}`}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 h-8 text-xs font-medium border transition-colors shrink-0 inline-flex items-center gap-1.5",
                  active
                    ? "bg-ink text-ink-inverse border-ink"
                    : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                )}
              >
                <span>{f.label}</span>
                {f.count > 0 ? (
                  <span
                    className={cn(
                      "text-[10px] tabular-nums",
                      active ? "text-ink-inverse/70" : "text-ink-subtle",
                    )}
                  >
                    {f.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {verificationFilter === "All"
                ? "All private offerings"
                : `${verificationFilter} offerings`}
            </CardTitle>
            <span className="text-xs text-ink-subtle">
              {filtered.length} of {allPrivate.length}
            </span>
          </CardHeader>

          {filtered.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">
              No private offerings in this filter.
            </p>
          ) : (
            <ul
              data-testid="private-offerings-list"
              data-count={filtered.length}
              className="space-y-3"
            >
              {filtered.map((l) => (
                <PrivateOfferingCard
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
          Verification workflow (broker approval flow for Unverified offerings,
          document capture, signatures) ships in Session 9. Read-side display
          live in 4B.
        </p>
      </div>
    </AppShell>
  );
}

function PrivateOfferingCard({
  listing,
  role,
  agentsUnderCount,
}: {
  listing: Listing;
  role: ReturnType<typeof useCurrentRole>;
  agentsUnderCount: number;
}) {
  const owner = ownerOf(listing);

  return (
    <li
      data-testid={`private-offering-card-${listing.id}`}
      data-verification-status={listing.verificationStatus}
      className="rounded-2xl border border-line hover:border-gold/40 hover:shadow-soft p-4 transition-colors"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-xl bg-navy-soft text-navy flex items-center justify-center shrink-0">
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
          {listing.tags && listing.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {listing.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-canvas-sunken text-ink-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-lg font-semibold text-ink tabular-nums">
            {formatPHPCompact(listing.price)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium inline-flex items-center gap-1 justify-end">
            <Tag className="h-3 w-3" />
            {formatPercent(listing.commissionRate)} comm
          </div>
        </div>
      </div>

      {/* Status row: verification + ownership */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {listing.verificationStatus ? (
          <VerificationBadge status={listing.verificationStatus} />
        ) : null}
        <StatusBadge variant="neutral">{listing.ownership}</StatusBadge>
        {owner ? (
          <span className="text-[11px] text-ink-subtle inline-flex items-center gap-1 ml-1">
            <User className="h-3 w-3" />
            {owner.fullName}
          </span>
        ) : null}
      </div>

      {/* Action row */}
      <div className="pt-3 border-t border-line-soft flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-subtle inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-gold-deep" />
          {listing.engagementCount} engagement{listing.engagementCount === 1 ? "" : "s"}
        </span>
        <ListingActionRow
          role={role}
          agentsUnderCount={agentsUnderCount}
          hideDetails
        />
      </div>
    </li>
  );
}

function ownerOf(l: Listing) {
  if (l.ownerAgentId) return seedUsers.find((u) => u.id === l.ownerAgentId);
  if (l.ownerBrokerId) return seedUsers.find((u) => u.id === l.ownerBrokerId);
  return undefined;
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
