import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Calendar,
  ArrowRight,
  ArrowLeft,
  FileText,
  Eye,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AISuggestionCard } from "@/components/ui/AISuggestionCard";
import { Button } from "@/components/ui/Button";
import {
  DEMO_AGENT_ID,
  seedLeads,
  seedListings,
  seedSiteVisits,
  seedConversationMessages,
  seedPropertyFiles,
  seedShareCampaigns,
  seedUsers,
} from "@/lib/data";
import {
  hasEngineEditorialDisagreement,
  badgeVariantForLead,
  buildListingPriceMap,
  scoreLeadWithContext,
} from "@/lib/logic/leadInboxDerivations";
import { LEAD_SCORE_MAX } from "@/lib/logic/leadScoring";
import { formatPHPCompact } from "@/lib/format";

interface PageProps {
  params: { leadId: string };
}

export default function BuyerProfilePage({ params }: PageProps) {
  const lead = seedLeads.find((l) => l.id === params.leadId);
  if (!lead) notFound();

  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  const listingPriceById = buildListingPriceMap(seedListings);
  const engine = scoreLeadWithContext(lead, listingPriceById);
  const disagrees = hasEngineEditorialDisagreement(lead, listingPriceById);
  const editorialVariant = badgeVariantForLead(lead);

  // Interested listings
  const interestedListings = seedListings.filter((l) =>
    lead.selectedListingIds.includes(l.id),
  );

  // Site visits for this lead
  const visitsForLead = seedSiteVisits.filter((sv) => sv.leadId === lead.id);

  // Messages — last 3 for summary
  const messagesForLead = seedConversationMessages
    .filter((m) => m.leadId === lead.id)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  // Engagement timeline — synthetic from share campaigns and file engagement
  // associated with this buyer's interested listings.
  const sharesForBuyer = seedShareCampaigns.filter(
    (s) => s.buyerProfileId === lead.buyer.id,
  );
  const filesForListings = seedPropertyFiles.filter((f) =>
    lead.selectedListingIds.some((lid) => f.listingId === lid),
  );

  // Recommended next action — derived from engine score and buyer signals.
  const recommendation = recommendNextAction(lead, engine.total);

  // Compute the per-rule breakdown rows (Option Z full disclosure).
  const breakdownRows = engine.breakdown.map((b) => ({
    label: b.label,
    triggered: b.triggered,
    earned: b.earned,
    weight: b.weight,
    detail: detailFor(lead, b.label),
  }));

  return (
    <AppShell
      role="Agent"
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-5">
        {/* Back link */}
        <Link
          href="/agent/leads"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Link>

        {/* Hero */}
        <Card surface="raised" className="!p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center font-semibold text-lg shrink-0">
              {initialsOf(lead.buyer.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {lead.buyer.name}
                </h1>
                <StatusBadge variant={editorialVariant}>
                  {lead.seedScoreCategory} · editorial
                </StatusBadge>
                {disagrees ? (
                  <span
                    title="Engine and editorial disagree — see breakdown below"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-soft text-gold-deep text-[11px] font-medium border border-gold/30"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Engine disagrees
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                {lead.source} ·{" "}
                {lead.buyer.mobile ?? lead.buyer.email ?? "no contact on file"}
              </div>
            </div>
          </div>

          {lead.buyer.aiSummary ? (
            <div className="mt-5 rounded-2xl bg-canvas-sunken px-4 py-3 text-sm text-ink-muted leading-relaxed">
              <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mb-1">
                AI insight
              </div>
              {lead.buyer.aiSummary}
            </div>
          ) : null}
        </Card>

        {/* Recommended next action */}
        <AISuggestionCard
          title={recommendation.title}
          body={recommendation.body}
          primaryAction={
            <Button variant="gold" size="sm">
              {recommendation.ctaLabel}
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left col (spans 2): scoring breakdown + profile grid */}
          <div className="lg:col-span-2 space-y-5">
            {/* Scoring breakdown panel — the place where the contradiction story lives */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Scoring breakdown</CardTitle>
                  <p className="text-xs text-ink-muted mt-0.5">
                    AI engine vs your editorial assessment.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                      Engine
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {engine.total} / {LEAD_SCORE_MAX}
                    </div>
                    <div className="text-[10px] text-ink-muted">
                      {engine.category}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-line" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                      Editorial
                    </div>
                    <div className="text-sm font-semibold text-ink">
                      {lead.seedScore} / {LEAD_SCORE_MAX}
                    </div>
                    <div className="text-[10px] text-ink-muted">
                      {lead.seedScoreCategory}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {disagrees ? (
                <div className="mb-4 rounded-xl border border-gold/30 bg-gold-soft/30 px-3 py-2 text-xs text-ink-muted flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-gold-deep mt-0.5 shrink-0" />
                  <span>
                    <span className="font-medium text-ink">
                      Engine and editorial disagree.
                    </span>{" "}
                    The engine sees{" "}
                    <span className="font-medium text-ink">
                      {engine.category}
                    </span>{" "}
                    based on the signals below; the editorial assessment is{" "}
                    <span className="font-medium text-ink">
                      {lead.seedScoreCategory}
                    </span>
                    . Both views are preserved — use your judgment.
                  </span>
                </div>
              ) : null}

              <ul className="divide-y divide-line-soft">
                {breakdownRows.map((row) => (
                  <li
                    key={row.label}
                    data-testid={`breakdown-row-${slugify(row.label)}`}
                    data-triggered={row.triggered ? "true" : "false"}
                    className="flex items-center gap-3 py-2.5"
                  >
                    {row.triggered ? (
                      <CheckCircle2 className="h-4 w-4 text-sage-deep shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-ink-subtle shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          row.triggered
                            ? "text-sm font-medium text-ink"
                            : "text-sm text-ink-muted"
                        }
                      >
                        {row.label}
                      </div>
                      {row.detail ? (
                        <div className="text-xs text-ink-subtle">
                          {row.detail}
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={
                        row.triggered
                          ? "text-sm font-semibold text-sage-deep tabular-nums shrink-0"
                          : "text-sm text-ink-subtle tabular-nums shrink-0"
                      }
                    >
                      {row.triggered ? `+${row.earned}` : `0 / ${row.weight}`}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Buyer profile grid */}
            <Card>
              <CardHeader>
                <CardTitle>Buyer profile</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <ProfileField
                  label="Budget"
                  value={
                    lead.buyer.budgetMin && lead.buyer.budgetMax
                      ? `${formatPHPCompact(lead.buyer.budgetMin)} – ${formatPHPCompact(lead.buyer.budgetMax)}`
                      : undefined
                  }
                />
                <ProfileField
                  label="Preferred locations"
                  value={lead.buyer.preferredLocations?.join(", ")}
                />
                <ProfileField
                  label="Timeline"
                  value={lead.buyer.timeline}
                />
                <ProfileField
                  label="Purpose"
                  value={lead.buyer.purposeOfPurchase}
                />
                <ProfileField
                  label="Property type"
                  value={lead.buyer.propertyTypes?.join(", ")}
                />
                <ProfileField
                  label="Payment preference"
                  value={lead.buyer.paymentPreference}
                />
                <ProfileField
                  label="Family size"
                  value={
                    lead.buyer.familySize
                      ? `${lead.buyer.familySize}`
                      : undefined
                  }
                />
                <ProfileField
                  label="OFW status"
                  value={
                    lead.buyer.isOFW === true
                      ? "OFW buyer"
                      : lead.buyer.isOFW === false
                        ? "Local buyer"
                        : undefined
                  }
                />
              </div>
            </Card>

            {/* Interested listings */}
            <Card>
              <CardHeader>
                <CardTitle>Interested listings</CardTitle>
              </CardHeader>
              {interestedListings.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No listings linked yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {interestedListings.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/agent/listings/${l.id}`}
                        className="block rounded-xl border border-line hover:border-gold/40 hover:shadow-soft p-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-ink truncate">
                              {l.title}
                            </div>
                            <div className="text-xs text-ink-muted">
                              {l.location} ·{" "}
                              {l.transactionType === "For Rent"
                                ? `${formatPHPCompact(l.rentalRate ?? 0)}/mo`
                                : formatPHPCompact(l.price)}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-ink-subtle shrink-0" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Engagement timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement timeline</CardTitle>
              </CardHeader>
              {sharesForBuyer.length === 0 && filesForListings.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No engagement tracked yet. Shares and opens will appear here.
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {sharesForBuyer.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="h-7 w-7 rounded-lg bg-canvas-sunken text-ink-muted flex items-center justify-center shrink-0">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink">
                          Listing shared via {s.channel}
                          {s.opens > 0
                            ? ` — opened ${s.opens} time${s.opens === 1 ? "" : "s"}`
                            : ""}
                        </div>
                        <div className="text-xs text-ink-subtle">
                          {new Date(s.sharedAt).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          · {s.brochureClicks} brochure click
                          {s.brochureClicks === 1 ? "" : "s"},{" "}
                          {s.computationRequests} computation request
                          {s.computationRequests === 1 ? "" : "s"}
                        </div>
                      </div>
                    </li>
                  ))}
                  {filesForListings.slice(0, 3).map((f) => (
                    <li
                      key={f.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="h-7 w-7 rounded-lg bg-canvas-sunken text-ink-muted flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink">{f.name}</div>
                        <div className="text-xs text-ink-subtle">
                          {f.openCount} open{f.openCount === 1 ? "" : "s"},{" "}
                          {f.downloadCount} download
                          {f.downloadCount === 1 ? "" : "s"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          {/* Right col */}
          <aside className="space-y-5">
            {/* Site visits */}
            <Card>
              <CardHeader>
                <CardTitle>Site visits</CardTitle>
              </CardHeader>
              {visitsForLead.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No site visits scheduled.
                </p>
              ) : (
                <ul className="space-y-3">
                  {visitsForLead.map((sv) => (
                    <li
                      key={sv.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="h-9 w-9 rounded-lg bg-gold-soft text-gold-deep flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink font-medium truncate">
                          {sv.listingTitle}
                        </div>
                        <div className="text-xs text-ink-muted">
                          {new Date(sv.scheduledAt).toLocaleDateString(
                            "en-PH",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            },
                          )}{" "}
                          ·{" "}
                          {new Date(sv.scheduledAt).toLocaleTimeString("en-PH", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="mt-1">
                          <StatusBadge
                            variant={
                              sv.status === "Confirmed" ||
                              sv.status === "Reminder Sent"
                                ? "for-closing"
                                : sv.status === "Completed" ||
                                    sv.status === "Converted"
                                  ? "paid"
                                  : "neutral"
                            }
                          >
                            {sv.status}
                          </StatusBadge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Conversation summary */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              {messagesForLead.length === 0 ? (
                <p className="text-sm text-ink-muted">No messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {messagesForLead.slice(-3).map((m) => (
                    <div
                      key={m.id}
                      className="text-sm rounded-xl px-3 py-2 bg-canvas-sunken"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                        {m.sender === "ai"
                          ? "AI draft"
                          : m.sender === "agent"
                            ? "You"
                            : lead.buyer.name}
                      </div>
                      <div className="text-ink-muted line-clamp-2">
                        {m.body}
                      </div>
                    </div>
                  ))}
                  <Link
                    href={`/agent/leads/${lead.id}`}
                    className="block text-center text-xs font-medium text-gold-deep hover:text-ink pt-1"
                  >
                    Open full conversation →
                  </Link>
                </div>
              )}
            </Card>

            {/* Quick stats */}
            <Card surface="sunken" className="!p-4">
              <div className="space-y-2 text-sm">
                <Stat
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Last reply"
                  value={
                    lead.buyer.repliedWithinMinutes !== undefined
                      ? `${lead.buyer.repliedWithinMinutes}m ago`
                      : "—"
                  }
                />
                <Stat
                  icon={<MessageSquare className="h-3.5 w-3.5" />}
                  label="Messages"
                  value={`${messagesForLead.length}`}
                />
                <Stat
                  icon={<Eye className="h-3.5 w-3.5" />}
                  label="Total opens"
                  value={`${sharesForBuyer.reduce((s, x) => s + x.opens, 0)}`}
                />
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

// --- Helpers ---

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
        {label}
      </div>
      <div
        className={
          value
            ? "text-sm text-ink"
            : "text-sm text-ink-subtle italic"
        }
      >
        {value ?? "Not provided"}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-ink-muted">
      <span className="text-ink-subtle">{icon}</span>
      <span className="text-xs">{label}</span>
      <span className="ml-auto text-sm font-medium text-ink">{value}</span>
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function detailFor(
  lead: (typeof seedLeads)[number],
  label: string,
): string | undefined {
  const b = lead.buyer;
  if (label.startsWith("Budget matches")) {
    if (b.budgetMin && b.budgetMax) {
      return `Buyer budget ${formatPHPCompact(b.budgetMin)} – ${formatPHPCompact(b.budgetMax)}`;
    }
    return "No budget provided yet.";
  }
  if (label.startsWith("Buying within 3 months")) {
    return b.timeline ? `Timeline: ${b.timeline}` : "No timeline provided.";
  }
  if (label === "Asked for computation") {
    return b.hasAskedForComputation ? "Yes" : "No request yet.";
  }
  if (label === "Booked site visit") {
    return b.hasBookedSiteVisit ? "Booked" : "Not yet booked.";
  }
  if (label === "Opened brochure") {
    return b.hasOpenedBrochure ? "Opened" : "Not yet opened.";
  }
  if (label === "Watched walkthrough video") {
    return b.hasWatchedWalkthrough ? "Watched" : "Not watched yet.";
  }
  if (label.startsWith("Replied quickly")) {
    return b.repliedWithinMinutes !== undefined
      ? `Last reply: ${b.repliedWithinMinutes}m`
      : "No recent reply.";
  }
  return undefined;
}

function recommendNextAction(
  lead: (typeof seedLeads)[number],
  engineScore: number,
): { title: string; body: string; ctaLabel: string } {
  const b = lead.buyer;
  if (lead.seedScoreCategory === "Hot" && engineScore < 30) {
    return {
      title: "Verify before warm follow-up",
      body: "Editorial flags this lead Hot, but the engine sees no qualifying signals. A short call to confirm budget and timeline would resolve the gap.",
      ctaLabel: "Open conversation",
    };
  }
  if (b.hasBookedSiteVisit) {
    return {
      title: "Prep for the upcoming site visit",
      body: "Make sure they have the location pin, brochure, and a printed computation in hand on the day.",
      ctaLabel: "View site visit",
    };
  }
  if (engineScore >= 70) {
    return {
      title: "Ready to book a site visit",
      body: "Strong intent across budget, timeline, and engagement. Propose two viewing slots in the next 5 days.",
      ctaLabel: "Book site visit",
    };
  }
  if (b.hasAskedForComputation && !b.hasBookedSiteVisit) {
    return {
      title: "Send the computation, then propose a viewing",
      body: "Buyer asked for numbers. Pair the computation share with a soft viewing ask to keep momentum.",
      ctaLabel: "Share computation",
    };
  }
  if (b.hasOpenedBrochure && engineScore < 30) {
    return {
      title: "Warm them with a computation",
      body: "Brochure opens are a signal. A sample computation tailored to their budget could push the score into Nurture.",
      ctaLabel: "Share computation",
    };
  }
  return {
    title: "Qualify the buyer",
    body: "Ask about budget, timeline, and purpose. AI can draft a friendly opener if you'd like.",
    ctaLabel: "Open conversation",
  };
}
