"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Sparkles, Tag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActionRow } from "@/components/listings/ListingActionRow";
import { VerificationBadge } from "@/components/listings/VerificationBadge";
import { DEMO_BROKER_ID, seedDevelopers, seedUsers } from "@/lib/data";
import { resolveInventoryByRouteId } from "@/lib/logic/inventoryResolve";
import { demoUserForRole } from "@/lib/rolePaths";
import { formatPHPCompact, formatPercent, formatPHPWhole } from "@/lib/format";
import { useCurrentRole } from "@/lib/useCurrentRole";

/**
 * Listing / unit detail — /agent|broker|realtor/listings/[listingId].
 * [listingId] may be a listing id or a developer unit id from inventory.
 */
export function ListingDetailPage() {
  const params = useParams<{ listingId: string }>();
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();
  const user = demoUserForRole(role);

  const resolved = resolveInventoryByRouteId(params.listingId);
  if (!resolved) notFound();

  const { routeId, listing, unit, project } = resolved;

  const agentsUnderCount = React.useMemo(
    () =>
      seedUsers.filter(
        (u) => u.parentId === DEMO_BROKER_ID && u.role === "Agent",
      ).length,
    [],
  );

  const primaryHref =
    role === "Agent"
      ? `/${roleSlug}/listings/${routeId}/share`
      : `/${roleSlug}/listings/${routeId}/distribute`;

  const backHref = project
    ? `/${roleSlug}/listings/for-sale/developers/${project.developerId}/${project.id}`
    : `/${roleSlug}/listings`;

  const ownerLabel = React.useMemo(() => {
    if (listing.ownerAgentId) {
      const agent = seedUsers.find((u) => u.id === listing.ownerAgentId);
      return agent ? `Agent · ${agent.fullName}` : "Personal listing";
    }
    if (listing.ownerBrokerId) {
      const broker = seedUsers.find((u) => u.id === listing.ownerBrokerId);
      return broker ? `Broker · ${broker.fullName}` : "Broker listing";
    }
    if (listing.developerId) {
      const dev = seedDevelopers.find((d) => d.id === listing.developerId);
      return dev ? `Developer · ${dev.name}` : "Developer listing";
    }
    return listing.ownership;
  }, [listing]);

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-5 pb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {project ? `Back to ${project.name}` : "Back to Listings"}
        </Link>

        <header
          data-testid="listing-detail-header"
          data-listing-id={listing.id}
          data-route-id={routeId}
          data-unit-id={unit?.id}
          className="space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-balance">
                {listing.title}
              </h1>
              <p className="text-sm text-ink-muted mt-1 flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0" />
                {listing.location} · {listing.propertyType}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="font-display text-xl font-semibold text-ink tabular-nums">
                {listing.transactionType === "For Rent" && listing.rentalRate
                  ? `${formatPHPCompact(listing.rentalRate)}/mo`
                  : formatPHPWhole(listing.price)}
              </div>
              <div className="text-xs text-ink-subtle mt-0.5 inline-flex items-center gap-1 justify-end">
                <Tag className="h-3 w-3" />
                {unit
                  ? formatPHPWhole(unit.commissionEstimate)
                  : formatPercent(listing.commissionRate)}{" "}
                {unit ? "est. commission" : "commission"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="neutral">{listing.transactionType}</StatusBadge>
            <StatusBadge variant="neutral">{listing.ownership}</StatusBadge>
            <StatusBadge
              variant={
                listing.availability === "Available"
                  ? "paid"
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
            {listing.engagementCount > 0 ? (
              <span className="text-xs text-ink-subtle inline-flex items-center gap-1 ml-auto">
                <Sparkles className="h-3.5 w-3.5 text-gold-deep" />
                {listing.engagementCount} engagements
              </span>
            ) : null}
          </div>
        </header>

        <Card data-testid="listing-detail-facts" className="!p-5">
          <CardHeader>
            <CardTitle>{unit ? "Unit details" : "Property details"}</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Fact label="Ownership" value={listing.ownership} />
            <Fact label="Listed by" value={ownerLabel} />
            <Fact label="Availability" value={listing.availability} />
            {unit ? (
              <>
                <Fact label="Floor area" value={`${unit.floorArea} sqm`} />
                <Fact
                  label="Bedrooms"
                  value={unit.bedrooms > 0 ? String(unit.bedrooms) : "Studio"}
                />
                {unit.floorLevel != null ? (
                  <Fact label="Floor level" value={String(unit.floorLevel)} />
                ) : null}
                {unit.viewOrientation ? (
                  <Fact label="View" value={unit.viewOrientation} />
                ) : null}
                <Fact
                  label="Reservation fee"
                  value={formatPHPWhole(unit.reservationFee)}
                />
                {unit.monthlyEquity ? (
                  <Fact
                    label="Monthly equity"
                    value={formatPHPWhole(unit.monthlyEquity)}
                  />
                ) : null}
                <Fact
                  label="Financing"
                  value={unit.financingOptions.join(", ")}
                />
              </>
            ) : (
              <Fact
                label="Gross commission"
                value={formatPercent(listing.commissionRate)}
              />
            )}
            {listing.assignedAgentIds?.length ? (
              <Fact
                label="Assigned agents"
                value={String(listing.assignedAgentIds.length)}
              />
            ) : null}
            {listing.tags?.length ? (
              <div className="col-span-2">
                <dt className="text-xs text-ink-subtle mb-1">Tags</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-canvas-sunken px-2 py-0.5 text-[11px] text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="!p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-ink-muted">
            {role === "Agent"
              ? "Share this listing with buyers in your pipeline."
              : role === "Broker"
                ? "Distribute this listing to agents on your team."
                : "Send this listing across your broker network."}
          </p>
          <ListingActionRow
            role={role}
            agentsUnderCount={agentsUnderCount}
            hideDetails
            primaryHref={primaryHref}
          />
        </Card>
      </div>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-subtle">{label}</dt>
      <dd className="text-ink font-medium mt-0.5">{value}</dd>
    </div>
  );
}
