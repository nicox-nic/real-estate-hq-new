"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ListingActionRow } from "@/components/listings/ListingActionRow";
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
import {
  findDeveloper,
  projectsForDeveloper,
} from "@/lib/logic/listingsDerivations";
import { formatPHPCompact } from "@/lib/format";

/**
 * Developer Project View (#17).
 *
 * Shows the projects of a specific developer, drilled into from the
 * Developer Listings page.
 */
export default function DeveloperProjectViewPage() {
  const params = useParams<{ developerId: string }>();
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const roleSlug = role.toLowerCase();

  const developer = findDeveloper(params.developerId, seedDevelopers);
  if (!developer) {
    notFound();
  }

  const projects = projectsForDeveloper(
    developer.id,
    seedProjects,
    seedUnits,
  );

  // Count of agents under the demo broker — used for the "Send to N agents" CTA.
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
          href={`/${roleSlug}/listings/for-sale/developers`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Developers
        </Link>

        {/* Developer hero card */}
        <Card surface="raised" className="!p-5">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0 font-display font-semibold text-lg">
              {initialsOf(developer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {developer.name}
                </h1>
                {developer.hasNewInventory ? (
                  <StatusBadge variant="hot">New inventory</StatusBadge>
                ) : null}
              </div>
              <p className="text-sm text-ink-muted mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {developer.locationsCovered.join(" · ")}
              </p>
              <p className="text-xs text-ink-subtle mt-1">
                {projects.length} project{projects.length === 1 ? "" : "s"} ·{" "}
                Price range {formatPHPCompact(developer.priceRangeMin)} –{" "}
                {formatPHPCompact(developer.priceRangeMax)}
              </p>
            </div>
          </div>
        </Card>

        {/* Project list */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <span className="text-xs text-ink-subtle">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </span>
          </CardHeader>

          <ul
            data-testid="project-list"
            data-count={projects.length}
            className="space-y-3"
          >
            {projects.map(({ project, totalUnits, availableUnits }) => (
              <li
                key={project.id}
                data-testid={`project-card-${project.id}`}
                className="rounded-2xl border border-line hover:border-gold/40 hover:shadow-soft p-4 transition-colors"
              >
                <Link
                  href={`/${roleSlug}/listings/for-sale/developers/${developer.id}/${project.id}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-11 w-11 rounded-xl bg-navy-soft text-navy flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-ink truncate">
                          {project.name}
                        </h3>
                        <StatusBadge
                          variant={
                            project.status === "RFO"
                              ? "paid"
                              : project.status === "Pre-Selling"
                                ? "for-approval"
                                : project.status === "Sold Out Soon"
                                  ? "on-hold"
                                  : "neutral"
                          }
                        >
                          {project.status}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.location} · {project.propertyType}
                      </p>
                      {project.description ? (
                        <p className="text-xs text-ink-muted mt-1.5 line-clamp-2">
                          {project.description}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0 mt-3" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-line-soft">
                    <SmallStat
                      label="Total units"
                      value={String(totalUnits)}
                    />
                    <SmallStat
                      label="Available"
                      value={String(availableUnits)}
                    />
                    <SmallStat
                      label="From"
                      value={formatPHPCompact(project.priceRangeMin)}
                    />
                  </div>
                </Link>
                <div className="mt-3 pt-3 border-t border-line-soft flex items-center justify-end">
                  <ListingActionRow
                    role={role}
                    agentsUnderCount={agentsUnderBroker}
                    hideDetails
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
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
