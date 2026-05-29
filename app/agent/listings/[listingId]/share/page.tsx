"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  RotateCw,
  Paperclip,
  X as XIcon,
  Plus,
  Send,
  ChevronDown,
  QrCode,
  Copy,
  Check,
  Info,
  User,
  Globe2,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  DEMO_AGENT_ID,
  seedListings,
  seedLeads,
  seedPropertyFiles,
  seedUsers,
} from "@/lib/data";
import { useCurrentRole } from "@/lib/useCurrentRole";
import { generateShareMessage } from "@/lib/logic/aiShareMessage";
import { applyShareTone } from "@/lib/logic/aiShareTone";
import { applyLanguage } from "@/lib/logic/aiReply";
import type { Tone } from "@/lib/logic/aiReply/tones";
import type { Language } from "@/lib/logic/aiReply/languages";
import { smartLinkFor, shareListing } from "@/lib/shareStore";
import { formatPHPCompact, formatPHPWhole } from "@/lib/format";
import type { ShareChannel } from "@/lib/types";
import { ChannelChips } from "@/components/share/ChannelChips";
import { ShareRefineSheet } from "@/components/share/ShareRefineSheet";

/**
 * Share Listing main page (#21).
 *
 * The marquee mockup-matching composition. Reproduces the mockup's vertical
 * stack: back nav → property hero → AI Generated Message panel → Attach
 * Files chips row → Share via channel row → Smart Link Created card →
 * primary "Send to {Buyer}" CTA.
 *
 * State held by this page:
 *   - selected buyer lead (the recipient — Maria by default)
 *   - tone + language (drive AI message regeneration)
 *   - editable message text (user can edit after AI generates)
 *   - selected attachment file IDs (default to top files for the listing)
 *   - selected channel
 *   - copy-link confirmation state
 *
 * Send dispatch: shareListing() creates a ShareCampaign + drops a
 * ConversationMessage into the buyer's thread (with shareCampaignId
 * linking back to the campaign).
 */
export default function ShareListingPage() {
  const params = useParams<{ listingId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = useCurrentRole();
  const roleSlug = role.toLowerCase();

  const listing = seedListings.find((l) => l.id === params.listingId);
  if (!listing) notFound();

  // Eligible buyer leads = leads assigned to the current agent (or showing
  // interest in this listing). Default selection is the lead with the
  // listing in selectedListingIds (the demo: Maria → Laurel 12A).
  const eligibleLeads = React.useMemo(() => {
    return seedLeads.filter((l) => l.assignedAgentId === DEMO_AGENT_ID);
  }, []);

  const initialLeadId =
    searchParams.get("lead") ??
    eligibleLeads.find((l) =>
      l.selectedListingIds.includes(listing.id),
    )?.id ??
    eligibleLeads[0]?.id;

  const [selectedLeadId, setSelectedLeadId] = React.useState<string>(
    initialLeadId ?? "",
  );
  const selectedLead = eligibleLeads.find((l) => l.id === selectedLeadId);

  const [tone, setTone] = React.useState<Tone>("Friendly Agent");
  const [language, setLanguage] = React.useState<Language>("English");

  // Generate the AI message (deterministic given lead + listing + tone + language)
  const generatedMessage = React.useMemo(() => {
    if (!selectedLead) return null;
    const result = generateShareMessage({ listing, lead: selectedLead });
    const buyerFirstName = selectedLead.buyer.name.split(/\s+/)[0];
    const toned = applyShareTone(result.draft, tone, { buyerFirstName });
    const localized = applyLanguage(toned, language, { buyerFirstName });
    return { ...result, text: localized };
  }, [listing, selectedLead, tone, language]);

  // Editable text — initialize from AI; user edits free-form
  const [editedText, setEditedText] = React.useState<string>("");
  const [edited, setEdited] = React.useState<boolean>(false);

  // When the AI regenerates, reset edits — unless user pinned them
  React.useEffect(() => {
    if (!edited && generatedMessage) {
      setEditedText(generatedMessage.text);
    }
  }, [generatedMessage, edited]);

  // Attachments — default to all available files for the listing
  const availableFiles = React.useMemo(
    () => seedPropertyFiles.filter((f) => f.listingId === listing.id),
    [listing.id],
  );
  const [selectedFileIds, setSelectedFileIds] = React.useState<string[]>(() =>
    availableFiles.slice(0, 4).map((f) => f.id),
  );
  const selectedFiles = availableFiles.filter((f) =>
    selectedFileIds.includes(f.id),
  );

  // Channel
  const [channel, setChannel] = React.useState<ShareChannel>("Messenger");

  // Refine sheet
  const [refineOpen, setRefineOpen] = React.useState(false);

  // Copy link feedback
  const [linkCopied, setLinkCopied] = React.useState(false);
  const smartLink = smartLinkFor(
    listing.id,
    DEMO_AGENT_ID,
    selectedLeadId,
  );

  // Regenerate (re-run rule + tone with current selections)
  const handleRegenerate = () => {
    setEdited(false);
    // Force a recompute by toggling tone? Actually, since deps include
    // tone/language and they haven't changed, useMemo will return the
    // same value. We need to bump a regen counter.
    setRegenCounter((c) => c + 1);
  };
  const [regenCounter, setRegenCounter] = React.useState(0);

  // When regenCounter changes, recompute with the seed bump for variation.
  React.useEffect(() => {
    if (!selectedLead) return;
    const result = generateShareMessage({ listing, lead: selectedLead });
    const buyerFirstName = selectedLead.buyer.name.split(/\s+/)[0];
    const toned = applyShareTone(result.draft, tone, { buyerFirstName });
    const localized = applyLanguage(toned, language, { buyerFirstName });
    setEditedText(localized);
    setEdited(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regenCounter]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(smartLink);
    } catch {
      // ignored in prototype
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  };

  const handleSend = () => {
    if (!selectedLead || !editedText.trim()) return;
    const result = shareListing({
      listingId: listing.id,
      agentId: DEMO_AGENT_ID,
      buyerLeadId: selectedLead.id,
      buyerProfileId: selectedLead.buyer.id,
      channel,
      message: editedText,
      attachedFileIds: selectedFileIds,
      tone,
      language: language === "English" ? "English" : language,
    });
    // Route to the conversation thread to show the message landed.
    router.push(`/${roleSlug}/leads/${selectedLead.id}?shared=${result.campaign.id}`);
  };

  const buyerFirstName = selectedLead?.buyer.name.split(/\s+/)[0] ?? "buyer";
  const sendCtaLabel = selectedLead
    ? `Send to ${selectedLead.buyer.name}`
    : "Select a recipient";

  const currentUser = seedUsers.find((u) => u.id === DEMO_AGENT_ID);

  return (
    <AppShell
      role={role}
      userName={currentUser?.fullName ?? "Agent"}
      userSubtitle={currentUser?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        {/* Header strip: back + title + Preview link */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${roleSlug}/listings/${listing.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Link>
          <h1 className="font-display text-lg font-semibold text-ink">
            Share Listing
          </h1>
          <Link
            href={`/${roleSlug}/listings/${listing.id}/share/preview?lead=${selectedLeadId}&tone=${encodeURIComponent(tone)}&language=${language}&files=${selectedFileIds.join(",")}&message=${encodeURIComponent(editedText)}`}
            data-testid="share-preview-link"
            className="text-sm font-medium text-gold-deep hover:text-ink"
          >
            Preview
          </Link>
        </div>

        {/* Property hero card */}
        <Card
          data-testid="share-listing-hero"
          surface="raised"
          className="!p-0 overflow-hidden"
        >
          <div className="flex">
            <div className="relative w-32 sm:w-40 shrink-0 bg-canvas-sunken aspect-square">
              {/* Tonal placeholder — gradient bands suggest a property image */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, #2c3e50 0%, #34495e 35%, #5d6d7e 70%, #aeb6bf 100%)",
                }}
              />
              <div className="absolute inset-0 flex items-end p-2">
                <Building2 className="h-5 w-5 text-canvas-raised/80" />
              </div>
            </div>
            <div className="flex-1 min-w-0 p-4">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-ink truncate">
                {listing.title}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {listing.propertyType}
              </p>
              <p className="text-xs text-ink-muted">{listing.location}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusBadge variant="neutral">{listing.ownership}</StatusBadge>
                <StatusBadge variant="neutral">{listing.transactionType}</StatusBadge>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-xl sm:text-2xl font-semibold text-ink tabular-nums">
                  {listing.transactionType === "For Rent" && listing.rentalRate
                    ? `${formatPHPCompact(listing.rentalRate)}/mo`
                    : formatPHPWhole(listing.price)}
                </span>
              </div>
              <p className="text-xs text-sage-deep font-medium mt-0.5">
                {(listing.commissionRate * 100).toFixed(listing.commissionRate * 100 % 1 === 0 ? 0 : 1)}% Commission
              </p>
            </div>
          </div>
        </Card>

        {/* AI Generated Message panel */}
        <Card
          data-testid="ai-message-panel"
          className="!p-4 bg-gold-soft/40 border-gold-deep/15"
        >
          <header className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-gold-deep" />
              <span className="font-medium text-sm text-ink">
                AI Generated Message
              </span>
              {generatedMessage ? (
                <span
                  data-testid="ai-message-rule"
                  className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium ml-1.5"
                  title={generatedMessage.ruleDescription}
                >
                  · rule: {generatedMessage.rule}
                </span>
              ) : null}
            </div>
            <button
              data-testid="ai-message-regenerate"
              onClick={handleRegenerate}
              className="text-xs font-medium text-gold-deep hover:text-ink inline-flex items-center gap-1"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          </header>

          <textarea
            data-testid="ai-message-textarea"
            value={editedText}
            onChange={(e) => {
              setEditedText(e.target.value);
              setEdited(true);
            }}
            rows={6}
            className="w-full rounded-xl bg-canvas-raised border border-line p-3 text-sm text-ink leading-relaxed resize-none focus:outline-none focus:border-gold/60"
          />

          {/* Tone + Language pills (lightweight; full controls in Refine sheet) */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRefineOpen(true)}
              data-testid="ai-message-tone-pill"
              className="inline-flex items-center gap-1 rounded-full bg-canvas-raised border border-line px-2.5 h-7 text-[11px] font-medium text-ink-muted hover:border-gold/40"
            >
              <span className="text-ink-subtle">Tone:</span>
              <span className="text-ink">{tone}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setRefineOpen(true)}
              data-testid="ai-message-language-pill"
              className="inline-flex items-center gap-1 rounded-full bg-canvas-raised border border-line px-2.5 h-7 text-[11px] font-medium text-ink-muted hover:border-gold/40"
            >
              <Globe2 className="h-3 w-3 text-ink-subtle" />
              <span className="text-ink">{language}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => setRefineOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-canvas-raised border border-line px-2.5 h-7 text-[11px] font-medium text-gold-deep hover:border-gold/40"
            >
              Refine
            </button>
          </div>

          {generatedMessage ? (
            <p
              className="mt-2 text-[10px] text-ink-subtle italic flex items-start gap-1"
              data-testid="ai-message-rule-description"
            >
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{generatedMessage.ruleDescription}</span>
            </p>
          ) : null}
        </Card>

        {/* Attach Files row */}
        <section data-testid="attach-files-section">
          <header className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5">
              <Paperclip className="h-4 w-4 text-ink-muted" />
              <span className="text-sm font-medium text-ink">
                Attach Files
              </span>
              <span className="text-xs text-ink-subtle">
                ({selectedFiles.length})
              </span>
            </div>
            <button
              className="text-xs font-medium text-ink-muted hover:text-ink"
              data-testid="attach-files-view-all"
              onClick={() => alert("Attach Files sheet — Session 5B")}
            >
              View All
            </button>
          </header>
          <ul
            data-testid="attach-files-list"
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {selectedFiles.map((f) => (
              <li
                key={f.id}
                data-testid={`attach-file-chip-${f.id}`}
                className="relative rounded-xl border border-line p-2.5 bg-canvas-raised"
              >
                <button
                  onClick={() =>
                    setSelectedFileIds((ids) =>
                      ids.filter((id) => id !== f.id),
                    )
                  }
                  aria-label={`Remove ${f.name}`}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-canvas-raised border border-line text-ink-muted hover:text-terracotta-deep flex items-center justify-center"
                >
                  <XIcon className="h-3 w-3" />
                </button>
                <FileChipIcon format={f.format} />
                <p className="text-[11px] font-medium text-ink mt-1.5 line-clamp-1">
                  {f.name}
                </p>
                <p className="text-[10px] text-ink-subtle mt-0.5">
                  {formatFileSize(f.sizeBytes)} · {f.format}
                </p>
              </li>
            ))}
            <li
              className="rounded-xl border border-line border-dashed p-2.5 bg-canvas-sunken/50 text-ink-muted flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40"
              onClick={() => alert("Attach Files sheet — Session 5B")}
              data-testid="attach-files-add-more"
            >
              <Plus className="h-4 w-4" />
              <span className="text-[11px] font-medium">Add More</span>
            </li>
          </ul>
        </section>

        {/* Share via channel row */}
        <section data-testid="share-via-section">
          <h3 className="text-sm font-medium text-ink mb-2">Share via</h3>
          <ChannelChips selected={channel} onSelect={setChannel} />
        </section>

        {/* Smart Link Created card */}
        <Card
          data-testid="smart-link-card"
          className="!p-3.5"
        >
          <header className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-medium text-ink">Smart Link Created</h3>
            <span className="text-[10px] uppercase tracking-wider text-sage-deep font-medium">
              ● Live
            </span>
          </header>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas-sunken px-3 h-10">
            <span
              data-testid="smart-link-url"
              className="flex-1 text-xs text-ink-muted tabular-nums truncate"
            >
              {smartLink}
            </span>
            <button
              data-testid="smart-link-copy"
              onClick={handleCopyLink}
              className={cn(
                "rounded-md px-2 h-7 text-[11px] font-medium inline-flex items-center gap-1 transition-colors",
                linkCopied
                  ? "bg-sage-soft text-sage-deep"
                  : "bg-gold-soft text-gold-deep hover:bg-gold-deep hover:text-canvas-raised",
              )}
            >
              {linkCopied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Link
                </>
              )}
            </button>
          </div>
          <div
            data-testid="smart-link-qr"
            className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-line p-2.5"
          >
            <div className="h-10 w-10 rounded-md bg-ink text-canvas-raised flex items-center justify-center shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink">Scan QR Code</p>
              <p className="text-[10px] text-ink-subtle truncate">
                Buyers can view listing instantly
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-ink-subtle -rotate-90" />
          </div>
        </Card>

        {/* Recipient picker — appears as a chip + the CTA */}
        <Card data-testid="recipient-picker" className="!p-3">
          <header className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Send to
            </h3>
            {eligibleLeads.length > 1 ? (
              <span className="text-[10px] text-ink-subtle">
                {eligibleLeads.length} active leads
              </span>
            ) : null}
          </header>
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
            {eligibleLeads.slice(0, 5).map((l) => {
              const active = l.id === selectedLeadId;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedLeadId(l.id)}
                  data-testid={`recipient-chip-${l.id}`}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-xs font-medium border transition-colors",
                    active
                      ? "bg-sage-soft text-sage-deep border-sage-deep/20"
                      : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center",
                      active
                        ? "bg-sage-deep text-canvas-raised"
                        : "bg-canvas-sunken text-ink-muted",
                    )}
                  >
                    <User className="h-3 w-3" />
                  </div>
                  <span className="truncate max-w-[7rem]">{l.buyer.name}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Primary CTA: Send to {Buyer} */}
        <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-4 bg-gradient-to-t from-canvas via-canvas to-transparent">
          <Button
            data-testid="share-send-cta"
            data-buyer-name={selectedLead?.buyer.name ?? ""}
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSend}
            disabled={!selectedLead || !editedText.trim()}
          >
            <Send className="h-4 w-4" />
            {sendCtaLabel}
          </Button>
        </div>
      </div>

      <ShareRefineSheet
        open={refineOpen}
        onClose={() => setRefineOpen(false)}
        tone={tone}
        onToneChange={(t) => {
          setTone(t);
          setEdited(false);
        }}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          setEdited(false);
        }}
        onRegenerate={handleRegenerate}
      />

      {/* Voice carry-over — unused names to silence TS strict */}
      <span hidden>{buyerFirstName}</span>
    </AppShell>
  );
}

function FileChipIcon({ format }: { format: string }) {
  const fmt = format.toUpperCase();
  const isPDF = fmt === "PDF";
  return (
    <div
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold",
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
