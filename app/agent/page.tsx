import Link from "next/link";
import {
  Inbox,
  Calendar,
  Sparkles,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { KPI } from "@/components/ui/KPI";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AISuggestionCard } from "@/components/ui/AISuggestionCard";
import { Button } from "@/components/ui/Button";
import { DonutChart, DonutLegend } from "@/components/ui/DonutChart";
import {
  DEMO_AGENT_ID,
  seedLeads,
  seedListings,
  seedSiteVisits,
  seedDeals,
  seedCommissions,
  seedAIActivity,
  seedUsers,
} from "@/lib/data";
import {
  computeAgentDashboardKPIs,
  computeMoneyOnTheWay,
  selectActiveDeals,
  generateAgentAISuggestions,
  generateBriefingSentence,
  firstNameOf,
  sortAndLimitActivity,
  DEFAULT_MONTHLY_TARGET_PHP,
  type ActivityEntry,
} from "@/lib/logic/dashboardDerivations";
import { viewerFromUser } from "@/lib/logic/roleAwareAmount";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";

/**
 * Agent Dashboard (#8).
 *
 * Composition:
 *   - Greeting + AI briefing sentence
 *   - 4 KPI tiles (New leads today / Hot buyers / Site visits booked / Active deals)
 *   - Money on the Way feature card (donut + progress + target)
 *   - Two-column lower row on desktop:
 *       Left: Active deals compact panel + Recent activity feed
 *       Right: AI suggestions stack (up to 3)
 *
 * All numbers derived from /lib/logic/dashboardDerivations.ts — no parallel
 * arithmetic in JSX.
 */

const SEED_REFERENCE_ISO = "2025-05-29T08:00:00.000Z";

export default function AgentDashboardPage() {
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  if (!user) {
    return <div>Demo agent not found.</div>;
  }
  const viewer = viewerFromUser(user);

  const kpis = computeAgentDashboardKPIs(
    DEMO_AGENT_ID,
    seedLeads,
    seedSiteVisits,
    seedDeals,
    SEED_REFERENCE_ISO,
    seedListings,
  );

  const motw = computeMoneyOnTheWay(seedCommissions, viewer);

  const activeDeals = selectActiveDeals(DEMO_AGENT_ID, seedDeals, 4);

  const suggestions = generateAgentAISuggestions(
    DEMO_AGENT_ID,
    seedLeads,
    seedSiteVisits,
    SEED_REFERENCE_ISO,
    3,
    seedListings,
  );

  const activity: ActivityEntry[] = [
    ...seedAIActivity
      .filter((a) => a.forUserId === DEMO_AGENT_ID)
      .map((a) => ({
        id: `ai-${a.id}`,
        occurredAt: a.occurredAt,
        kind: "ai" as const,
        summary: a.summary,
      })),
    ...seedLeads
      .filter((l) => l.assignedAgentId === DEMO_AGENT_ID)
      .map((l) => ({
        id: `lead-${l.id}`,
        occurredAt: l.createdAt,
        kind: "lead" as const,
        summary: `New ${l.seedScoreCategory.toLowerCase()} lead — ${l.buyer.name} (${l.source})`,
      })),
    ...seedSiteVisits
      .filter((sv) => sv.agentId === DEMO_AGENT_ID)
      .map((sv) => ({
        id: `sv-${sv.id}`,
        occurredAt: sv.scheduledAt,
        kind: "site-visit" as const,
        summary: `Site visit ${sv.status.toLowerCase()} — ${sv.buyerName} at ${sv.listingTitle}`,
      })),
  ];
  const recentActivity = sortAndLimitActivity(activity, 6);

  const briefing = generateBriefingSentence(firstNameOf(user.fullName), kpis);

  return (
    <AppShell
      role="Agent"
      userName={user.fullName}
      userSubtitle={user.companyName}
    >
      <div className="space-y-6">
        {/* Greeting + briefing */}
        <header>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink text-balance">
            Good morning, {firstNameOf(user.fullName)}
            <span aria-hidden> ☀</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted text-balance">{briefing}</p>
        </header>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI
            label="New leads today"
            value={String(kpis.newLeadsToday)}
            accent={kpis.newLeadsToday > 0 ? "gold" : "ink"}
            hint={
              kpis.newLeadsToday > 0
                ? "Reach out before they cool off"
                : "Quiet morning so far"
            }
          />
          <KPI
            label="Hot buyers"
            value={String(kpis.hotBuyers)}
            accent="terracotta"
            hint={
              kpis.hotBuyers > 0
                ? `${kpis.hotBuyers} ready for follow-through`
                : "No hot buyers right now"
            }
          />
          <KPI
            label="Site visits booked"
            value={String(kpis.siteVisitsBooked)}
            accent="sage"
            hint={
              kpis.siteVisitsBooked > 0
                ? "Upcoming this week"
                : "Slot one in soon"
            }
          />
          <KPI
            label="Active deals"
            value={String(kpis.activeDeals)}
            accent="navy"
            hint={
              kpis.activeDeals > 0
                ? "In your pipeline"
                : "Pipeline is empty"
            }
          />
        </div>

        {/* Money on the Way feature card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle display>Money on the way</CardTitle>
              <p className="text-xs text-ink-muted mt-0.5">
                Tracking toward your{" "}
                {formatPHPCompact(DEFAULT_MONTHLY_TARGET_PHP)} monthly target.
              </p>
            </div>
            <Link
              href="/agent/commissions/upcoming"
              className="text-xs font-medium text-gold-deep hover:text-ink shrink-0"
            >
              View details →
            </Link>
          </CardHeader>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="shrink-0">
              <DonutChart
                segments={motw.segments}
                centerValue={`${motw.progressPercent}%`}
                centerLabel="To target"
                size={180}
              />
            </div>

            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                <NumberRow
                  label="Paid this period"
                  value={formatPHPWhole(motw.paidThisPeriod)}
                  accent="sage"
                />
                <NumberRow
                  label="Pending payout"
                  value={formatPHPWhole(motw.pendingPayout)}
                  accent="gold"
                />
                <NumberRow
                  label="On hold"
                  value={formatPHPWhole(motw.onHold)}
                  accent="navy"
                />
                <NumberRow
                  label="Monthly target"
                  value={formatPHPWhole(motw.monthlyTargetPHP)}
                  accent="muted"
                />
              </div>

              <DonutLegend
                segments={motw.segments.filter((s) => s.label !== "To target")}
                formattedValues={motw.segments
                  .filter((s) => s.label !== "To target")
                  .map((s) => formatPHPCompact(s.value))}
                className="border-t border-line-soft pt-3"
              />
            </div>
          </div>
        </Card>

        {/* Lower row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Active deals</CardTitle>
                <Link
                  href="/agent/deals"
                  className="text-xs font-medium text-gold-deep hover:text-ink shrink-0"
                >
                  See pipeline →
                </Link>
              </CardHeader>

              {activeDeals.length === 0 ? (
                <p className="text-sm text-ink-muted py-6 text-center">
                  No active deals. Your next close starts in the inbox.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activeDeals.map((d) => (
                    <ActiveDealRow key={d.dealId} deal={d} />
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
              </CardHeader>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-ink-muted">No activity yet.</p>
              ) : (
                <ol className="space-y-3">
                  {recentActivity.map((e) => (
                    <ActivityRow key={e.id} entry={e} />
                  ))}
                </ol>
              )}
            </Card>
          </div>

          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-deep" />
                AI suggestions
              </h2>
              <span className="text-xs text-ink-subtle">
                {suggestions.length} for you
              </span>
            </div>
            {suggestions.length === 0 ? (
              <Card surface="sunken" className="!p-4">
                <p className="text-sm text-ink-muted">
                  No suggestions right now. Your pipeline looks healthy.
                </p>
              </Card>
            ) : (
              suggestions.map((s) => (
                <AISuggestionCard
                  key={s.id}
                  title={s.title}
                  body={s.body}
                  primaryAction={
                    s.ctaHref ? (
                      <Link href={s.ctaHref}>
                        <Button variant="gold" size="sm">
                          {s.ctaLabel}
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="gold" size="sm">
                        {s.ctaLabel}
                      </Button>
                    )
                  }
                />
              ))
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function NumberRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "ink" | "gold" | "sage" | "navy" | "muted";
}) {
  const accentClass =
    accent === "gold"
      ? "text-gold-deep"
      : accent === "sage"
        ? "text-sage-deep"
        : accent === "navy"
          ? "text-navy"
          : accent === "muted"
            ? "text-ink-subtle"
            : "text-ink";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
        {label}
      </div>
      <div className={`text-base font-semibold tabular-nums ${accentClass}`}>
        {value}
      </div>
    </div>
  );
}

function ActiveDealRow({
  deal,
}: {
  deal: ReturnType<typeof selectActiveDeals>[number];
}) {
  return (
    <li>
      <Link
        href={`/agent/deals/${deal.dealId}`}
        className="block rounded-xl border border-line hover:border-gold/40 hover:shadow-soft p-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink truncate">
              {deal.listingTitle}
            </div>
            <div className="text-xs text-ink-muted">
              {deal.buyerName} · {formatPHPCompact(deal.contractPrice)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge variant={badgeVariantForStage(deal.stage)}>
              {deal.stage}
            </StatusBadge>
            {deal.hasBlockingDocuments ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-terracotta-deep"
                title="Has blocking documents"
              >
                <AlertTriangle className="h-3 w-3" />
                Blocked
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}

function badgeVariantForStage(
  stage: ReturnType<typeof selectActiveDeals>[number]["stage"],
): "neutral" | "for-closing" | "for-payout" | "for-approval" | "on-hold" {
  switch (stage) {
    case "Contract Signed":
      return "for-closing";
    case "Commission Processing":
      return "for-payout";
    case "Reservation Paid":
    case "Site Visit Done":
      return "for-approval";
    case "Documents Submitted":
      return "on-hold";
    default:
      return "neutral";
  }
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const { icon, tint } = activityVisual(entry.kind);
  return (
    <li className="flex items-start gap-3 text-sm">
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${tint}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-ink-muted">{entry.summary}</div>
        <div className="text-[10px] text-ink-subtle uppercase tracking-wider mt-0.5">
          {new Date(entry.occurredAt).toLocaleString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </div>
    </li>
  );
}

function activityVisual(kind: ActivityEntry["kind"]): {
  icon: React.ReactNode;
  tint: string;
} {
  switch (kind) {
    case "ai":
      return {
        icon: <Sparkles className="h-4 w-4" />,
        tint: "bg-gold-soft text-gold-deep",
      };
    case "lead":
      return {
        icon: <Inbox className="h-4 w-4" />,
        tint: "bg-canvas-sunken text-ink-muted",
      };
    case "site-visit":
      return {
        icon: <Calendar className="h-4 w-4" />,
        tint: "bg-sage-soft text-sage-deep",
      };
    case "share":
      return {
        icon: <FileText className="h-4 w-4" />,
        tint: "bg-canvas-sunken text-ink-muted",
      };
    case "deal":
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        tint: "bg-navy-soft text-navy",
      };
  }
}
