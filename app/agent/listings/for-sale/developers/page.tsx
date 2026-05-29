"use client";

import Link from "next/link";
import { ArrowLeft, Building2, ChevronRight, MapPin, Tag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  seedDevelopers,
  seedProjects,
  seedUnits,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import { enrichDevelopers } from "@/lib/logic/listingsDerivations";
import { formatPHPCompact, formatPercent } from "@/lib/format";

/**
 * Developer Listings by Developer (#16).
 *
 * Lists every developer in the system with live-derived counts (projects,
 * available units) and the static editorial framing (price range, locations,
 * commission rate).
 */
export default function DeveloperListingsPage() {
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const developers = enrichDevelopers(seedDevelopers, seedProjects, seedUnits);
  const roleSlug = role.toLowerCase();

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-5">
        <Link
          href={`/${roleSlug}/listings/for-sale`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to For Sale
        </Link>

        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            Developer Listings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {developers.length} active developers ·{" "}
            {developers.reduce((s, d) => s + d.availableUnits, 0)} units across
            all projects
          </p>
        </header>

        <ul
          data-testid="developer-list"
          data-count={developers.length}
          className="grid grid-cols-1 lg:grid-cols-2 gap-3"
        >
          {developers.map((d) => (
            <li key={d.developer.id}>
              <Link
                href={`/${roleSlug}/listings/for-sale/developers/${d.developer.id}`}
                data-testid={`developer-card-${d.developer.id}`}
                className="block"
              >
                <Card className="!p-5 hover:border-gold/40 hover:shadow-soft transition-colors cursor-pointer">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0 font-display font-semibold">
                      {initialsOf(d.developer.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-ink truncate">
                          {d.developer.name}
                        </h2>
                        {d.developer.hasNewInventory ? (
                          <StatusBadge variant="hot">New inventory</StatusBadge>
                        ) : null}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {d.developer.locationsCovered.join(" · ")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0 mt-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <Stat
                      label="Projects"
                      value={String(d.projects.length)}
                      icon={<Building2 className="h-3 w-3" />}
                    />
                    <Stat
                      label="Available units"
                      value={String(d.availableUnits)}
                    />
                    <Stat
                      label="Avg commission"
                      value={formatPercent(d.developer.averageCommissionRate)}
                      icon={<Tag className="h-3 w-3" />}
                    />
                  </div>

                  <div className="rounded-xl bg-canvas-sunken px-3 py-2 text-xs text-ink-muted">
                    Price range:{" "}
                    <span className="text-ink font-medium">
                      {formatPHPCompact(d.developer.priceRangeMin)} –{" "}
                      {formatPHPCompact(d.developer.priceRangeMax)}
                    </span>
                  </div>

                  {/* Featured projects preview */}
                  {d.projects.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {d.projects.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-canvas-sunken text-ink-muted border border-line"
                        >
                          {p.name}
                        </span>
                      ))}
                      {d.projects.length > 3 ? (
                        <span className="text-[10px] text-ink-subtle">
                          +{d.projects.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function Stat({
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
      <div className="text-sm font-semibold text-ink tabular-nums">{value}</div>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
