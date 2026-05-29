"use client";

import Link from "next/link";
import {
  Home,
  Key,
  Gavel,
  RotateCw,
  Hammer,
  Building,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  DEMO_AGENT_ID,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
  seedListings,
  seedUsers,
} from "@/lib/data";
import {
  TRANSACTION_CATEGORIES,
  CATEGORY_SLUGS,
  listingsByCategory,
} from "@/lib/logic/listingsDerivations";
import type { TransactionType } from "@/lib/types";
import { useCurrentRole } from "@/lib/useCurrentRole";

/**
 * Listings Menu (#14) — the entry point to the 7 PRD transaction categories.
 *
 * Each category is its own route. For Sale is the fully-built drill-down in
 * Session 4A; the other six are placeholder category landings in 4A and
 * flesh out in 4B (or stay as parallel patterns to For Sale's landing).
 *
 * Role-aware: the page header changes copy slightly per role
 * (Agent: "Browse inventory and share with your buyers"; Broker: "Browse
 * inventory and distribute to your team"; Realtor: "Browse inventory and
 * distribute across your network"). Underlying data scope is identical.
 */
export default function ListingsMenuPage() {
  const role = useCurrentRole();
  const user = currentUserFor(role);
  const counts = listingsByCategory(seedListings);

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            Listings
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {subtitleFor(role)}
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Browse by category</CardTitle>
            <span className="text-xs text-ink-subtle">
              {seedListings.length} active listings
            </span>
          </CardHeader>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {counts.map((c) => (
              <li key={c.category}>
                <CategoryTile category={c.category} count={c.count} role={role} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function CategoryTile({
  category,
  count,
  role,
}: {
  category: TransactionType;
  count: number;
  role: ReturnType<typeof useCurrentRole>;
}) {
  const { Icon, tint, blurb } = categoryVisual(category);
  const slug = CATEGORY_SLUGS[category];
  // For Sale routes to the full drill-down; others to their category landing.
  const href = `/${role.toLowerCase()}/listings/${slug}`;

  return (
    <Link
      href={href}
      data-testid={`category-tile-${slug}`}
      className="block rounded-2xl border border-line hover:border-gold/40 hover:shadow-soft p-3.5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tint}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-ink">{category}</div>
            <span className="text-[10px] uppercase tracking-wider text-ink-subtle tabular-nums">
              {count} {count === 1 ? "listing" : "listings"}
            </span>
          </div>
          <div className="text-xs text-ink-muted truncate">{blurb}</div>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0" />
      </div>
    </Link>
  );
}

function categoryVisual(category: TransactionType): {
  Icon: typeof Home;
  tint: string;
  blurb: string;
} {
  switch (category) {
    case "For Sale":
      return {
        Icon: Home,
        tint: "bg-gold-soft text-gold-deep",
        blurb: "Developer projects and private offerings",
      };
    case "For Rent":
      return {
        Icon: Key,
        tint: "bg-sage-soft text-sage-deep",
        blurb: "Rental units and lease opportunities",
      };
    case "Foreclosure":
      return {
        Icon: Gavel,
        tint: "bg-terracotta-soft text-terracotta-deep",
        blurb: "Bank-acquired and distressed properties",
      };
    case "For Assume":
      return {
        Icon: RotateCw,
        tint: "bg-canvas-sunken text-ink-muted",
        blurb: "Assumed-balance unit takeovers",
      };
    case "Pre-Selling":
      return {
        Icon: Hammer,
        tint: "bg-navy-soft text-navy",
        blurb: "Early bird pricing on upcoming developments",
      };
    case "RFO":
      return {
        Icon: Building,
        tint: "bg-gold-soft text-gold-deep",
        blurb: "Ready for occupancy — move-in ready units",
      };
    case "Commercial":
      return {
        Icon: Briefcase,
        tint: "bg-canvas-sunken text-ink-muted",
        blurb: "Office spaces, retail, and commercial lots",
      };
  }
}

function subtitleFor(role: ReturnType<typeof useCurrentRole>): string {
  switch (role) {
    case "Agent":
      return "Browse inventory and share with your buyers.";
    case "Broker":
      return "Browse inventory and distribute to your team.";
    case "Realtor":
      return "Browse inventory and distribute across your network.";
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
