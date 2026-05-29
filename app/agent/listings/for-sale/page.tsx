"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, User, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
import { enrichDevelopers } from "@/lib/logic/listingsDerivations";
import { formatPHPCompact } from "@/lib/format";

/**
 * For Sale category page (#15).
 *
 * Per PRD: two tabs — Developer Listings + Private Offerings.
 * The Developer tab is the entry to the drill-down (Session 4A's depth);
 * the Private Offerings tab is a "see all private offerings" landing
 * (full surface ships in Session 4B as #19).
 */
export default function ForSaleCategoryPage() {
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const [tab, setTab] = React.useState<"developer" | "private">("developer");

  const developersEnriched = React.useMemo(
    () => enrichDevelopers(seedDevelopers, seedProjects, seedUnits),
    [],
  );

  // Private offerings filter: For Sale listings whose ownership isn't
  // "Developer Listing" — i.e. broker / agent personal / shared / exclusive.
  const privateOfferings = React.useMemo(
    () =>
      seedListings.filter(
        (l) =>
          l.transactionType === "For Sale" &&
          l.ownership !== "Developer Listing",
      ),
    [],
  );

  const roleSlug = role.toLowerCase();

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-5">
        {/* Back */}
        <Link
          href={`/${roleSlug}/listings`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>

        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            For Sale
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Developer projects and private offerings — browse, drill down, share.
          </p>
        </header>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="For Sale tabs"
          className="inline-flex rounded-full bg-canvas-sunken p-1 border border-line"
        >
          <TabButton
            id="developer"
            active={tab === "developer"}
            onClick={() => setTab("developer")}
            count={developersEnriched.length}
            label="Developer Listings"
          />
          <TabButton
            id="private"
            active={tab === "private"}
            onClick={() => setTab("private")}
            count={privateOfferings.length}
            label="Private Offerings"
          />
        </div>

        {tab === "developer" ? (
          <Card>
            <CardHeader>
              <CardTitle>Active developers</CardTitle>
              <Link
                href={`/${roleSlug}/listings/for-sale/developers`}
                className="text-xs font-medium text-gold-deep hover:text-ink shrink-0"
              >
                See all →
              </Link>
            </CardHeader>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {developersEnriched.slice(0, 6).map((d) => (
                <li key={d.developer.id}>
                  <Link
                    href={`/${roleSlug}/listings/for-sale/developers/${d.developer.id}`}
                    data-testid={`developer-card-preview-${d.developer.id}`}
                    className="block rounded-2xl border border-line hover:border-gold/40 hover:shadow-soft p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink truncate">
                          {d.developer.name}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {d.projects.length} project
                          {d.projects.length === 1 ? "" : "s"} ·{" "}
                          {d.availableUnits} available unit
                          {d.availableUnits === 1 ? "" : "s"}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Private offerings</CardTitle>
              <span className="text-xs text-ink-subtle">
                {privateOfferings.length} listings
              </span>
            </CardHeader>
            {privateOfferings.length === 0 ? (
              <p className="text-sm text-ink-muted py-6 text-center">
                No private offerings available.
              </p>
            ) : (
              <ul className="space-y-2">
                {privateOfferings.slice(0, 8).map((l) => (
                  <li
                    key={l.id}
                    data-testid={`private-offering-${l.id}`}
                    className="rounded-2xl border border-line p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-navy-soft text-navy flex items-center justify-center shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink truncate">
                          {l.title}
                        </div>
                        <div className="text-xs text-ink-muted truncate">
                          {l.location} · {formatPHPCompact(l.price)} ·{" "}
                          {l.ownership}
                        </div>
                      </div>
                      <StatusBadge variant="neutral">{l.ownership}</StatusBadge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-ink-subtle pt-3 italic">
              Private Offerings full surface (verification status, negotiability
              details, owner contact) ships in Session 4B.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  id,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  id: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      data-testid={`for-sale-tab-${id}`}
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 h-8 text-xs font-medium transition-colors inline-flex items-center gap-1.5",
        active
          ? "bg-canvas-raised text-ink shadow-soft"
          : "text-ink-muted hover:text-ink",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "text-[10px] tabular-nums",
          active ? "text-gold-deep" : "text-ink-subtle",
        )}
      >
        {count}
      </span>
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
