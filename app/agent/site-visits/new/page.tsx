"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Save } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  DEMO_AGENT_ID,
  seedLeads,
  seedListings,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";

/**
 * Site Visit Booking form (#24).
 *
 * Steps: select lead → select listing → date/time → location → notes.
 * For the prototype this is a flat form (not multi-step) — the PRD's
 * stop-signal is "form working." A wizard version is a polish-session
 * call if it helps demo pacing.
 */
export default function NewSiteVisitPage() {
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();
  const router = useRouter();
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  const leads = React.useMemo(
    () => seedLeads.filter((l) => l.assignedAgentId === DEMO_AGENT_ID),
    [],
  );

  const [leadId, setLeadId] = React.useState<string>(leads[0]?.id ?? "");
  const [listingId, setListingId] = React.useState<string>("");
  const [scheduledAt, setScheduledAt] = React.useState<string>("");
  const [locationNote, setLocationNote] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  const selectedLead = leads.find((l) => l.id === leadId);
  const candidateListings = selectedLead
    ? seedListings.filter((l) =>
        selectedLead.selectedListingIds.includes(l.id),
      )
    : [];
  // Fall back to a broader pool if the lead has no selected listings yet
  const listings =
    candidateListings.length > 0
      ? candidateListings
      : seedListings.slice(0, 8);

  const handleSubmit = () => {
    // Prototype: no backend write. Just route back to the list.
    router.push(`/${roleSlug}/site-visits?booked=1`);
  };

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={`/${roleSlug}/site-visits`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <header>
          <h1
            data-testid="new-site-visit-title"
            className="font-display text-2xl font-semibold text-ink"
          >
            Book a Site Visit
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Schedule a property viewing with a buyer.
          </p>
        </header>

        {/* Buyer */}
        <Card>
          <CardHeader>
            <CardTitle>Buyer</CardTitle>
          </CardHeader>
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            data-testid="buyer-select"
            className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink focus:outline-none focus:border-gold/60"
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.buyer.name} · {l.seedScoreCategory}
              </option>
            ))}
          </select>
        </Card>

        {/* Listing */}
        <Card>
          <CardHeader>
            <CardTitle>Listing</CardTitle>
            {candidateListings.length === 0 ? (
              <span className="text-[10px] text-ink-subtle">
                no buyer interest set — showing all
              </span>
            ) : null}
          </CardHeader>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            data-testid="listing-select"
            className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink focus:outline-none focus:border-gold/60"
          >
            <option value="">— select a listing —</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </Card>

        {/* When */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Calendar className="inline-block h-4 w-4 mr-1 -mt-0.5" />
              When
            </CardTitle>
          </CardHeader>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            data-testid="datetime-input"
            className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
          <p className="text-[11px] text-ink-subtle mt-1.5">
            Manila local time. The buyer receives a reminder 24h and 2h
            beforehand.
          </p>
        </Card>

        {/* Where */}
        <Card>
          <CardHeader>
            <CardTitle>
              <MapPin className="inline-block h-4 w-4 mr-1 -mt-0.5" />
              Where
            </CardTitle>
          </CardHeader>
          <input
            type="text"
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            data-testid="location-input"
            placeholder="Meeting point — e.g., 'Show unit at Laurel Hills sales pavilion'"
            className="w-full rounded-xl bg-canvas-raised border border-line px-3 h-10 text-sm text-ink focus:outline-none focus:border-gold/60"
          />
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything the buyer mentioned (companions, accessibility, special interest)"
            rows={3}
            data-testid="notes-input"
            className="w-full rounded-xl bg-canvas-raised border border-line p-3 text-sm text-ink leading-relaxed resize-none focus:outline-none focus:border-gold/60"
          />
        </Card>

        {/* CTA */}
        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-gradient-to-t from-canvas via-canvas to-transparent">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!leadId || !listingId || !scheduledAt}
            data-testid="book-site-visit-cta"
          >
            <Save className="h-4 w-4" />
            Book Site Visit
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
