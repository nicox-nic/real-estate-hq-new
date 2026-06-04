"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  ArrowLeft,
  Bed,
  Maximize,
  MapPin,
  Eye,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActionRow } from "@/components/listings/ListingActionRow";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  seedDevelopers,
  seedListings,
  seedProjects,
  seedUnits,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import {
  findDeveloper,
  findProject,
  unitsForProject,
  applyUnitFilter,
  UNIT_FILTERS,
  type UnitFilter,
} from "@/lib/logic/listingsDerivations";
import { formatPHPCompact, formatPHPWhole, formatPercent } from "@/lib/format";
import type { ListingAvailability, Unit } from "@/lib/types";

/**
 * Unit Inventory View (#18).
 *
 * Lists the units of a project with availability/bedroom filters. Each
 * unit card carries the role-aware action button (Share / Send to N agents
 * / Send to network). Tapping the card itself routes to listing detail
 * which is intentionally 404 in Session 4A (Session 5 work).
 */
export default function UnitInventoryViewPage() {
  const params = useParams<{ developerId: string; projectId: string }>();
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const roleSlug = role.toLowerCase();

  const developer = findDeveloper(params.developerId, seedDevelopers);
  const project = findProject(params.projectId, seedProjects);
  if (!developer || !project) {
    notFound();
  }

  const [filter, setFilter] = React.useState<UnitFilter>("All");
  const allUnits = unitsForProject(project.id, seedUnits);
  const units = applyUnitFilter(allUnits, filter);

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
          href={`/${roleSlug}/listings/for-sale/developers/${developer.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {developer.name}
        </Link>

        {/* Project header */}
        <Card surface="raised" className="!p-5">
          <div className="flex items-start gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-subtle uppercase tracking-wider font-medium">
                {developer.name}
              </p>
              <h1 className="font-display text-2xl font-semibold text-ink mt-0.5">
                {project.name}
              </h1>
              <p className="text-sm text-ink-muted mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {project.location} · {project.propertyType}
              </p>
              {project.description ? (
                <p className="text-sm text-ink-muted mt-2">
                  {project.description}
                </p>
              ) : null}
            </div>
            <StatusBadge
              variant={
                project.status === "RFO"
                  ? "paid"
                  : project.status === "Pre-Selling"
                    ? "for-approval"
                    : "neutral"
              }
            >
              {project.status}
            </StatusBadge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-line-soft">
            <Stat
              label="Total units"
              value={String(allUnits.length)}
            />
            <Stat
              label="Available"
              value={String(
                allUnits.filter(
                  (u) =>
                    u.availability === "Available" ||
                    u.availability === "Sold Out Soon",
                ).length,
              )}
            />
            <Stat
              label="Commission"
              value={formatPercent(project.commissionRate)}
            />
          </div>
        </Card>

        {/* Filter chips */}
        <div
          data-testid="unit-filter-chips"
          className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
        >
          {UNIT_FILTERS.map((f) => {
            const active = filter === f;
            const count = applyUnitFilter(allUnits, f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                data-testid={`unit-filter-${slugify(f)}`}
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

        {/* Unit list */}
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <span className="text-xs text-ink-subtle">
              {units.length} of {allUnits.length} units
            </span>
          </CardHeader>

          {units.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">
              No units match this filter.
            </p>
          ) : (
            <ul
              data-testid="unit-list"
              data-count={units.length}
              className="space-y-3"
            >
              {units.map((u) => (
                <UnitCard
                  key={u.id}
                  unit={u}
                  role={role}
                  agentsUnderCount={agentsUnderBroker}
                />
              ))}
            </ul>
          )}
        </Card>

      </div>
    </AppShell>
  );
}

function UnitCard({
  unit,
  role,
  agentsUnderCount,
}: {
  unit: Unit;
  role: ReturnType<typeof useCurrentRole>;
  agentsUnderCount: number;
}) {
  const shareHref =
    role === "Agent"
      ? `/${role.toLowerCase()}/listings/${unit.id}/share`
      : undefined;

  return (
    <li
      data-testid={`unit-card-${unit.id}`}
      data-availability={unit.availability}
      className="rounded-2xl border border-line p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <Link
          href={`/${role.toLowerCase()}/listings/${unit.id}`}
          className="min-w-0 flex-1 group"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-ink group-hover:text-gold-deep transition-colors truncate">
              {unit.unitType}
            </h3>
            <AvailabilityBadge availability={unit.availability} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted flex-wrap">
            {unit.bedrooms > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {unit.bedrooms}BR
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Bed className="h-3 w-3" />
                Studio
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Maximize className="h-3 w-3" />
              {unit.floorArea} sqm
            </span>
            {unit.floorLevel !== undefined ? (
              <span>Floor {unit.floorLevel}</span>
            ) : null}
            {unit.viewOrientation ? (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {unit.viewOrientation}
              </span>
            ) : null}
          </div>
        </Link>
        <div className="text-right shrink-0">
          <div className="font-display text-lg font-semibold text-ink tabular-nums">
            {formatPHPCompact(unit.price)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
            {formatPHPWhole(unit.price)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3 pt-2 border-t border-line-soft">
        <SmallStat
          label="Reservation"
          value={formatPHPCompact(unit.reservationFee)}
        />
        {unit.monthlyEquity ? (
          <SmallStat
            label="Equity / mo"
            value={formatPHPCompact(unit.monthlyEquity)}
          />
        ) : (
          <SmallStat label="Equity / mo" value="—" />
        )}
        <SmallStat
          label="Commission"
          value={formatPHPCompact(unit.commissionEstimate)}
          icon={<Tag className="h-3 w-3" />}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {unit.financingOptions.slice(0, 3).map((f) => (
            <span
              key={f}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-canvas-sunken text-ink-muted"
            >
              {f}
            </span>
          ))}
        </div>
        <ListingActionRow
          role={role}
          agentsUnderCount={agentsUnderCount}
          hideDetails
          primaryHref={shareHref}
        />
      </div>
    </li>
  );
}

function AvailabilityBadge({ availability }: { availability: ListingAvailability }) {
  switch (availability) {
    case "Available":
      return <StatusBadge variant="paid">Available</StatusBadge>;
    case "Sold Out Soon":
      return <StatusBadge variant="for-approval">Sold Out Soon</StatusBadge>;
    case "Reserved":
      return <StatusBadge variant="on-hold">Reserved</StatusBadge>;
    case "Sold":
      return <StatusBadge variant="neutral">Sold</StatusBadge>;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
        {label}
      </div>
      <div className="text-base font-semibold text-ink tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium flex items-center gap-1">
        {icon ? <span className="text-ink-subtle">{icon}</span> : null}
        {label}
      </div>
      <div className="text-xs font-semibold text-ink tabular-nums">{value}</div>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
