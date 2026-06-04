"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Pencil,
  Eye,
  Building2,
  CheckCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedLeads,
  seedPropertyFiles,
  seedUsers,
} from "@/lib/data";
import { resolveInventoryByRouteId } from "@/lib/logic/inventoryResolve";
import { useCurrentRole } from "@/lib/useCurrentRole";
import { shareListing } from "@/lib/shareStore";
import { formatPHPWhole } from "@/lib/format";
import type { ShareChannel } from "@/lib/types";

/**
 * Preview Message page (#23).
 *
 * Renders the buyer-side phone-style preview of the message that will be
 * sent. Matches the mockup (image 2, right panel):
 *   - Sage-soft chat bubble at top with the message body, inline listing
 *     card preview, and timestamp + sent-checks
 *   - Attachments list below
 *   - "Send Now" primary CTA
 *   - "Edit Message" secondary CTA back to the Share Listing page
 *
 * State is passed in via URL search params from the Share Listing page so
 * the preview reflects exactly what will be sent.
 */
export default function PreviewMessagePage() {
  const params = useParams<{ listingId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();

  const resolved = resolveInventoryByRouteId(params.listingId);
  if (!resolved) notFound();
  const { routeId, listing } = resolved;

  const leadId = searchParams.get("lead") ?? "";
  const message = searchParams.get("message") ?? "";
  const fileIdsParam = searchParams.get("files") ?? "";
  const fileIds = fileIdsParam.split(",").filter(Boolean);
  const tone = searchParams.get("tone") ?? "Friendly Agent";
  const language = (searchParams.get("language") ?? "English") as
    | "English"
    | "Tagalog"
    | "Cebuano";
  const channel = (searchParams.get("channel") ?? "Messenger") as ShareChannel;

  const lead = seedLeads.find((l) => l.id === leadId);
  const buyerName = lead?.buyer.name ?? "Buyer";
  const attachments = seedPropertyFiles.filter((f) => fileIds.includes(f.id));
  const currentUser = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  // Split message at the FIRST blank-line so the bubble can:
  //   - render the first paragraph above the inline listing card
  //   - render the inline listing card
  //   - render the remaining paragraphs below
  // The AI message generator emits "[para1]\n\n[para2 — title mention]\n\n[para3]".
  const paragraphs = message.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const intro = paragraphs[0] ?? message;
  const trailing = paragraphs.slice(2).join("\n\n");
  // Time string for the bubble timestamp
  const timeStr = nowTimeStr();

  const handleSendNow = () => {
    if (!lead || !message.trim()) return;
    const result = shareListing({
      listingId: listing.id,
      agentId: DEMO_AGENT_ID,
      buyerLeadId: lead.id,
      buyerProfileId: lead.buyer.id,
      channel,
      message,
      attachedFileIds: fileIds,
      language,
    });
    router.push(`/${roleSlug}/leads/${lead.id}?shared=${result.campaign.id}`);
  };

  return (
    <AppShell
      role={role}
      userName={currentUser?.fullName ?? "Agent"}
      userSubtitle={currentUser?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${roleSlug}/listings/${routeId}/share?lead=${leadId}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Link>
          <h1 className="font-display text-lg font-semibold text-ink">
            Preview Message
          </h1>
          <span
            className="text-xs text-ink-subtle inline-flex items-center gap-1"
            data-testid="preview-channel"
          >
            <Eye className="h-3.5 w-3.5" />
            via {channel}
          </span>
        </div>

        {/* The phone-style preview area */}
        <div
          data-testid="preview-bubble-container"
          className="rounded-3xl bg-canvas-sunken p-3 sm:p-4"
        >
          {/* Faux header strip: the buyer would see this as a sender row */}
          <div className="flex items-center gap-2 px-1 pb-3">
            <div className="h-7 w-7 rounded-full bg-sage-deep text-canvas-raised flex items-center justify-center text-[11px] font-semibold">
              {initialsOf(currentUser?.fullName ?? "A")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink truncate">
                {currentUser?.fullName ?? "Agent"}
              </p>
              <p className="text-[10px] text-ink-subtle">
                {channel} · to {buyerName}
              </p>
            </div>
          </div>

          {/* The bubble */}
          <div
            data-testid="preview-bubble"
            data-tone={tone}
            data-language={language}
            className="relative bg-sage-soft text-ink rounded-2xl rounded-tl-md p-4 max-w-[92%]"
          >
            {/* Intro paragraph */}
            <p
              data-testid="preview-message-intro"
              className="text-sm leading-relaxed whitespace-pre-line"
            >
              {intro}
            </p>

            {/* Inline listing card */}
            <div
              data-testid="preview-inline-listing-card"
              className="mt-3 rounded-xl bg-canvas-raised border border-line p-2.5 flex gap-2.5 items-start"
            >
              <div
                aria-hidden
                className="h-16 w-16 rounded-lg shrink-0 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #2c3e50 0%, #34495e 35%, #5d6d7e 70%, #aeb6bf 100%)",
                }}
              >
                <Building2 className="h-4 w-4 text-canvas-raised/80 absolute bottom-1 left-1" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-ink truncate">
                  {listing.title.replace(/ — Unit.*$/, "")}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {listing.propertyType}
                </p>
                <p className="font-display text-sm font-semibold text-ink tabular-nums mt-1">
                  {formatPHPWhole(listing.price)}
                </p>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  Near schools, malls
                  <br />
                  and major roads.
                </p>
              </div>
            </div>

            {/* Trailing paragraphs (closer line / CTA question) */}
            {trailing ? (
              <p
                data-testid="preview-message-trailing"
                className="text-sm leading-relaxed mt-3 whitespace-pre-line"
              >
                {trailing}
              </p>
            ) : null}

            {/* Bubble footer: timestamp + sent checks */}
            <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-ink-subtle">
              <span>{timeStr}</span>
              <CheckCheck className="h-3 w-3 text-sage-deep" />
            </div>
          </div>
        </div>

        {/* Attachments list */}
        {attachments.length > 0 ? (
          <Card data-testid="preview-attachments" className="!p-4">
            <header className="mb-2.5">
              <h2 className="text-sm font-medium text-ink">
                Attachments ({attachments.length})
              </h2>
            </header>
            <ul
              data-testid="preview-attachment-list"
              data-attachment-count={attachments.length}
              className="space-y-2"
            >
              {attachments.map((f) => (
                <li
                  key={f.id}
                  data-testid={`preview-attachment-${f.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-2.5"
                >
                  <FileIconBlock format={f.format} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {f.name}
                    </p>
                    <p className="text-[11px] text-ink-subtle">
                      {formatFileSize(f.sizeBytes)} · {f.format}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-ink-subtle" />
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-ink-subtle mt-3 text-center italic">
              Files will be sent as attachments.
            </p>
          </Card>
        ) : null}

        {/* CTAs */}
        <div className="space-y-2 sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-gradient-to-t from-canvas via-canvas to-transparent">
          <Button
            data-testid="preview-send-now"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSendNow}
            disabled={!lead || !message.trim()}
          >
            <Send className="h-4 w-4" />
            Send Now
          </Button>
          <Link
            href={`/${roleSlug}/listings/${routeId}/share?lead=${leadId}`}
            data-testid="preview-edit-message"
            className="block"
          >
            <Button variant="ghost" size="lg" className="w-full">
              <Pencil className="h-4 w-4" />
              Edit Message
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function FileIconBlock({ format }: { format: string }) {
  const fmt = format.toUpperCase();
  const isPDF = fmt === "PDF";
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold",
        isPDF
          ? "bg-terracotta-soft text-terracotta-deep"
          : "bg-navy-soft text-navy",
      )}
    >
      {fmt.slice(0, 3)}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function nowTimeStr(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hh}:${mm} ${ampm}`;
}
