"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Copy,
  RefreshCcw,
  Check,
  Wand2,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Smartphone,
  Music2,
  Film,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  seedListings,
  seedUsers,
  DEMO_AGENT_ID,
} from "@/lib/data";
import {
  ALL_CONTENT_TYPES,
  CONTENT_TEMPLATES,
  generateContentTemplate,
  destinationForContentType,
  type ContentType,
  type DestinationPlatform,
} from "@/lib/logic/contentTemplates";
import { ALL_TONES, type Tone } from "@/lib/logic/aiReply/tones";
import {
  ALL_LANGUAGES,
  type Language,
} from "@/lib/logic/aiReply/languages";

/**
 * AI Content Studio (#34) at /agent/content-studio.
 *
 * Composition:
 *   - Header: title + subtitle
 *   - Template picker (12 types as cards with description + estimated chars)
 *   - Tone + Language pickers (8 tones × 3 languages)
 *   - Listing context picker (optional — composes with the demo's listings)
 *   - Generate button → renders output in platform-flavored preview chrome
 *   - Copy / Regenerate / Edit actions
 *
 * Composes with EXISTING applyShareTone (5A) + applyLanguage (3B) via
 * generateContentTemplate (sibling helper). No new tone or language
 * dispatchers; CONTENT_TEMPLATES is a registry, not a rule table —
 * Rule of Seven stands.
 */
export default function ContentStudioPage() {
  const user = seedUsers.find((u) => u.id === DEMO_AGENT_ID);
  const [type, setType] = React.useState<ContentType>("Property Caption");
  const [tone, setTone] = React.useState<Tone>("Friendly Agent");
  const [language, setLanguage] = React.useState<Language>("English");
  const [listingId, setListingId] = React.useState<string>(
    "listing-laurel-12a",
  );
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const listing = seedListings.find((l) => l.id === listingId);
  const template = CONTENT_TEMPLATES[type];
  const destination = destinationForContentType(type);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const result = generateContentTemplate({
        type,
        context: {
          listing: template.requiresListing ? listing : undefined,
          buyer: { id: "demo-buyer", name: "Maria Santos" } as any,
          agentName: user?.fullName ?? "Your agent",
          eventDate: "Saturday, May 31 · 10:00 AM",
        },
        tone,
        language: template.supportsLanguage ? language : "English",
      });
      setGenerated(result.text);
      setGenerating(false);
    }, 600); // simulator timing — same posture as 5B's engagement simulator
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard?.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — copy not supported
    }
  };

  return (
    <AppShell
      role="Agent"
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        <Link
          href="/agent"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header>
          <h1
            data-testid="content-studio-title"
            className="font-display text-2xl font-semibold text-ink inline-flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5 text-sage-deep" />
            AI Content Studio
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Generate captions, posts, scripts, and messages — tuned to your
            tone, translated to your buyer's language.
          </p>
        </header>

        {/* Template picker */}
        <Card data-testid="content-template-picker" className="!p-5">
          <CardHeader>
            <CardTitle>Choose Template</CardTitle>
            <span
              data-testid="template-count"
              className="text-xs text-ink-subtle tabular-nums"
            >
              {ALL_CONTENT_TYPES.length} templates
            </span>
          </CardHeader>
          <div
            data-testid="template-grid"
            data-template-count={ALL_CONTENT_TYPES.length}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
          >
            {ALL_CONTENT_TYPES.map((t) => {
              const tmpl = CONTENT_TEMPLATES[t];
              const isActive = t === type;
              return (
                <button
                  key={t}
                  data-testid={`template-${slugify(t)}`}
                  data-active={isActive}
                  onClick={() => {
                    setType(t);
                    setGenerated(null);
                  }}
                  type="button"
                  className={cn(
                    "rounded-xl p-2.5 text-left transition-colors border",
                    isActive
                      ? "bg-sage-soft/40 border-sage-deep/30"
                      : "bg-canvas-raised border-line hover:border-gold/40",
                  )}
                >
                  <div className="inline-flex items-center gap-1.5 mb-0.5">
                    <DestinationIcon
                      destination={destinationForContentType(t)}
                      className={cn(
                        "h-3 w-3 shrink-0",
                        isActive ? "text-sage-deep" : "text-ink-subtle",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium truncate",
                        isActive ? "text-sage-deep" : "text-ink",
                      )}
                    >
                      {t}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-subtle leading-snug line-clamp-2">
                    {tmpl.description}
                  </p>
                  <p className="text-[10px] text-ink-subtle mt-1">
                    ~{tmpl.estimatedChars} chars
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tone + Language + Listing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Tone picker */}
          <Card data-testid="tone-picker" className="!p-4">
            <CardHeader>
              <CardTitle>Tone</CardTitle>
              <span
                data-testid="tone-count"
                className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium"
              >
                {ALL_TONES.length} options
              </span>
            </CardHeader>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_TONES.map((t) => {
                const active = t === tone;
                return (
                  <button
                    key={t}
                    data-testid={`tone-${slugify(t)}`}
                    data-active={active}
                    onClick={() => {
                      setTone(t);
                      setGenerated(null);
                    }}
                    className={cn(
                      "rounded-full px-2.5 h-7 text-[11px] font-medium border transition-colors",
                      active
                        ? "bg-sage-deep text-canvas-raised border-transparent"
                        : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Language picker */}
          <Card data-testid="language-picker" className="!p-4">
            <CardHeader>
              <CardTitle>Language</CardTitle>
              {!template.supportsLanguage ? (
                <span className="text-[10px] uppercase tracking-wider text-terracotta-deep font-medium">
                  EN only
                </span>
              ) : (
                <span
                  data-testid="language-count"
                  className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium"
                >
                  {ALL_LANGUAGES.length} languages
                </span>
              )}
            </CardHeader>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ALL_LANGUAGES.map((l) => {
                const active = l === language;
                const disabled =
                  !template.supportsLanguage && l !== "English";
                return (
                  <button
                    key={l}
                    data-testid={`language-${l.toLowerCase()}`}
                    data-active={active}
                    data-disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setLanguage(l);
                      setGenerated(null);
                    }}
                    disabled={disabled}
                    className={cn(
                      "rounded-full px-2.5 h-7 text-[11px] font-medium border transition-colors",
                      disabled && "opacity-40 cursor-not-allowed",
                      active
                        ? "bg-sage-deep text-canvas-raised border-transparent"
                        : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                    )}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Listing context */}
          <Card data-testid="listing-context" className="!p-4">
            <CardHeader>
              <CardTitle>Listing Context</CardTitle>
              {template.requiresListing ? null : (
                <span className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                  Optional
                </span>
              )}
            </CardHeader>
            <select
              data-testid="listing-selector"
              value={listingId}
              onChange={(e) => {
                setListingId(e.target.value);
                setGenerated(null);
              }}
              className="w-full rounded-lg bg-canvas-raised border border-line px-2.5 h-9 text-xs text-ink focus:outline-none focus:border-gold/60"
            >
              {seedListings.slice(0, 8).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-ink-subtle mt-2 line-clamp-2">
              {listing
                ? `${listing.location} · ${listing.propertyType} · ₱${(listing.price / 1_000_000).toFixed(1)}M`
                : "Select a listing to seed the template."}
            </p>
          </Card>
        </div>

        {/* Generate CTA */}
        <Card className="!p-4 sticky top-3 z-10 shadow-soft">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                Ready to generate
              </p>
              <p
                data-testid="generation-summary"
                className="text-sm text-ink font-medium"
              >
                {type} · {tone} · {template.supportsLanguage ? language : "English"}
              </p>
            </div>
            <Button
              variant="primary"
              data-testid="generate-cta"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Wand2 className="h-4 w-4 animate-pulse" />
                  Generating…
                </>
              ) : generated ? (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output / Preview */}
        {generated ? (
          <section data-testid="content-preview-section">
            <header className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-medium text-ink">
                Preview ({destination})
              </h2>
              <button
                data-testid="copy-content"
                onClick={handleCopy}
                className="text-xs text-sage-deep font-medium inline-flex items-center gap-1 hover:underline"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </header>
            <PlatformPreview
              destination={destination}
              text={generated}
              listing={listing}
              agentName={user?.fullName ?? "Your agent"}
            />
          </section>
        ) : (
          <Card data-testid="empty-preview" className="!p-8 text-center">
            <Sparkles className="h-8 w-8 text-ink-subtle mx-auto mb-2" />
            <p className="text-sm text-ink-muted">
              Pick a template, tone, and language, then tap{" "}
              <span className="font-medium text-ink">Generate Content</span>.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Platform preview chrome
// ----------------------------------------------------------------------------

function PlatformPreview({
  destination,
  text,
  listing,
  agentName,
}: {
  destination: DestinationPlatform;
  text: string;
  listing: ReturnType<typeof seedListings.find>;
  agentName: string;
}) {
  switch (destination) {
    case "facebook":
      return (
        <div
          data-testid="preview-facebook"
          className="rounded-xl border border-line bg-canvas-raised p-4"
        >
          <header className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-full bg-sage-soft flex items-center justify-center">
              <span className="text-[11px] font-medium text-sage-deep">
                {initials(agentName)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{agentName}</p>
              <p className="text-[10px] text-ink-subtle">Just now · 🌍 Public</p>
            </div>
          </header>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
            {text}
          </p>
          {listing?.imageUrls?.[0] || listing?.heroImageUrl ? (
            <div className="mt-3 aspect-[16/9] rounded-lg bg-canvas-sunken/50 flex items-center justify-center text-xs text-ink-subtle">
              {listing.title} · property image
            </div>
          ) : null}
          <div className="mt-3 pt-2 border-t border-line-soft text-[11px] text-ink-subtle flex items-center gap-4">
            <span>👍 Like</span>
            <span>💬 Comment</span>
            <span>↗ Share</span>
          </div>
        </div>
      );
    case "instagram":
      return (
        <div
          data-testid="preview-instagram"
          className="rounded-xl border border-line bg-canvas-raised overflow-hidden"
        >
          <header className="flex items-center justify-between p-3 border-b border-line-soft">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-terracotta to-gold p-0.5">
                <div className="h-full w-full rounded-full bg-canvas-raised flex items-center justify-center">
                  <span className="text-[10px] font-medium text-ink">
                    {initials(agentName)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-semibold text-ink">{agentName.toLowerCase().replace(/\s+/g, "_")}</p>
            </div>
            <span className="text-ink-subtle">⋯</span>
          </header>
          <div className="aspect-square bg-canvas-sunken/40 flex items-center justify-center text-xs text-ink-subtle">
            {listing?.title ?? "Photo"}
          </div>
          <div className="p-3">
            <div className="text-ink-muted text-sm mb-1">♡ &nbsp; 💬 &nbsp; ↗</div>
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
              {text}
            </p>
          </div>
        </div>
      );
    case "tiktok":
    case "reels":
      return (
        <div
          data-testid={`preview-${destination}`}
          className="rounded-xl border border-line bg-ink/95 text-canvas-raised p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed"
        >
          <header className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-70">
              <Music2 className="h-3 w-3" />
              {destination === "tiktok" ? "TikTok Script" : "Reels Script"}
            </span>
            <span className="text-[10px] opacity-70">⏱ ~30s</span>
          </header>
          {text}
        </div>
      );
    case "messenger":
      return (
        <div
          data-testid="preview-messenger"
          className="rounded-xl border border-line bg-canvas-raised p-4"
        >
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 rounded-full bg-sage-soft flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium text-sage-deep">
                {initials(agentName)}
              </span>
            </div>
            <div className="rounded-2xl rounded-tl-md bg-blue-500 text-white px-3 py-2 max-w-md">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {text}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-ink-subtle mt-1.5 ml-9">Delivered · 9:41 AM</p>
        </div>
      );
    case "whatsapp":
      return (
        <div
          data-testid="preview-whatsapp"
          className="rounded-xl border border-line bg-[#ECE5DD] p-4"
        >
          <div className="flex items-start gap-2 justify-end">
            <div className="rounded-2xl rounded-tr-md bg-[#DCF8C6] text-ink px-3 py-2 max-w-md">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {text}
              </p>
              <p className="text-[10px] text-ink-subtle text-right mt-1">
                9:41 AM ✓✓
              </p>
            </div>
          </div>
        </div>
      );
    case "email":
      return (
        <div
          data-testid="preview-email"
          className="rounded-xl border border-line bg-canvas-raised overflow-hidden"
        >
          <header className="px-4 py-2.5 border-b border-line-soft bg-canvas-sunken/30">
            <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
              From: {agentName}
            </p>
            <p className="text-[10px] text-ink-subtle">To: Maria Santos</p>
          </header>
          <div className="px-4 py-3">
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
              {text}
            </p>
          </div>
        </div>
      );
    case "generic":
    default:
      return (
        <Card
          data-testid="preview-generic"
          className="!p-5"
        >
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">
            {text}
          </p>
        </Card>
      );
  }
}

function DestinationIcon({
  destination,
  className,
}: {
  destination: DestinationPlatform;
  className?: string;
}) {
  switch (destination) {
    case "facebook":
      return <Facebook className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "tiktok":
      return <Music2 className={className} />;
    case "reels":
      return <Film className={className} />;
    case "messenger":
      return <MessageCircle className={className} />;
    case "whatsapp":
      return <Smartphone className={className} />;
    case "email":
      return <Mail className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

function initials(name: string): string {
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
    .replace(/^-+|-+$/g, "");
}
