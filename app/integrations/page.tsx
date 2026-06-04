"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plug,
  Check,
  X,
  RefreshCcw,
  AlertCircle,
  Settings,
  ChevronRight,
  Facebook,
  Instagram,
  MessageCircle,
  Smartphone,
  Mail,
  Calendar,
  FileSpreadsheet,
  Database,
  Music2,
  Zap,
  Globe,
  Code,
  Workflow,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { seedIntegrations } from "@/lib/data";
import { demoUserForRole, settingsPathForRole } from "@/lib/rolePaths";
import { useCurrentRole } from "@/lib/useCurrentRole";
import type { Integration, IntegrationProvider } from "@/lib/types";

/**
 * Integrations (#35) at /integrations.
 *
 * Composes with EXISTING Integration entity (Session 1 type model
 * supported all 18 PRD providers + isConnected + lastSyncAt +
 * leadsCapturedToday + errorMessage). Zero new entity types — 9
 * surface-bearing sessions, zero entities introduced.
 *
 * OAuth-style connect flow: tap Connect → 800ms loading state → flip to
 * Connected. Same simulator-timing pattern as 5B's engagement sim.
 *
 * Pre-seeded connections (10 of 18 from seed):
 *   Facebook Lead Ads, Instagram Lead Ads, TikTok Lead Forms,
 *   Google Ads, WhatsApp Business, Messenger, Instagram DM, Email,
 *   Google Calendar, Website Forms — demo narrative composition
 *   (lead sources + share channels that the build's seed data exercises).
 *
 * One seeded with error state: SMS Provider — "Provider account inactive"
 */
export default function IntegrationsPage() {
  const role = useCurrentRole();
  const user = demoUserForRole(role);

  // Local state allows toggling connections during demo
  const [integrations, setIntegrations] = React.useState<Integration[]>(
    () => [...seedIntegrations],
  );
  const [connectingId, setConnectingId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<
    "All" | "Connected" | "Available" | "Issues"
  >("All");
  const [manageOpen, setManageOpen] = React.useState<Integration | null>(null);

  const filtered = React.useMemo(() => {
    if (filter === "All") return integrations;
    if (filter === "Connected") return integrations.filter((i) => i.isConnected);
    if (filter === "Available")
      return integrations.filter((i) => !i.isConnected && !i.errorMessage);
    if (filter === "Issues") return integrations.filter((i) => i.errorMessage);
    return integrations;
  }, [integrations, filter]);

  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                isConnected: true,
                lastSyncAt: new Date().toISOString(),
                errorMessage: undefined,
              }
            : i,
        ),
      );
      setConnectingId(null);
    }, 800); // OAuth simulator timing — same as 5B's engagement sim
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              isConnected: false,
              lastSyncAt: undefined,
              leadsCapturedToday: undefined,
            }
          : i,
      ),
    );
    setManageOpen(null);
  };

  const connectedCount = integrations.filter((i) => i.isConnected).length;
  const issueCount = integrations.filter((i) => i.errorMessage).length;

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={settingsPathForRole(role)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>

        <header>
          <h1
            data-testid="integrations-title"
            className="font-display text-2xl font-semibold text-ink inline-flex items-center gap-2"
          >
            <Plug className="h-5 w-5 text-sage-deep" />
            Integrations
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Connect your lead sources, messaging channels, calendars, and
            automation tools.
          </p>
        </header>

        {/* Summary strip */}
        <section
          data-testid="integrations-summary"
          className="grid grid-cols-3 gap-3"
        >
          <SummaryStat
            testId="stat-connected"
            label="Connected"
            value={String(connectedCount)}
            accent="sage"
          />
          <SummaryStat
            testId="stat-available"
            label="Available"
            value={String(integrations.length - connectedCount - issueCount)}
            accent="ink"
          />
          <SummaryStat
            testId="stat-issues"
            label="Issues"
            value={String(issueCount)}
            accent="terracotta"
          />
        </section>

        {/* Filter chips */}
        <div
          data-testid="integration-filter-chips"
          className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none"
        >
          {(["All", "Connected", "Available", "Issues"] as const).map((f) => {
            const count =
              f === "All"
                ? integrations.length
                : f === "Connected"
                ? connectedCount
                : f === "Issues"
                ? issueCount
                : integrations.length - connectedCount - issueCount;
            const active = f === filter;
            return (
              <button
                key={f}
                data-testid={`filter-${f.toLowerCase()}`}
                data-active={active}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-xs font-medium border transition-colors",
                  active
                    ? "bg-sage-deep text-canvas-raised border-transparent"
                    : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                )}
              >
                {f}
                <span
                  className={cn(
                    "text-[10px]",
                    active ? "text-canvas-raised/70" : "text-ink-subtle",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Integration cards grid */}
        <section
          data-testid="integrations-grid"
          data-count={filtered.length}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              connecting={connectingId === integration.id}
              onConnect={() => handleConnect(integration.id)}
              onManage={() => setManageOpen(integration)}
            />
          ))}
        </section>

        {/* Manage sheet */}
        {manageOpen ? (
          <ManageSheet
            integration={manageOpen}
            onClose={() => setManageOpen(null)}
            onDisconnect={() => handleDisconnect(manageOpen.id)}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// IntegrationCard
// ----------------------------------------------------------------------------

function IntegrationCard({
  integration,
  connecting,
  onConnect,
  onManage,
}: {
  integration: Integration;
  connecting: boolean;
  onConnect: () => void;
  onManage: () => void;
}) {
  const { provider, isConnected, errorMessage } = integration;
  const meta = PROVIDER_META[provider];

  return (
    <div
      data-testid={`integration-${slugify(provider)}`}
      data-provider={provider}
      data-connected={isConnected}
      data-has-error={!!errorMessage}
      className="rounded-2xl border border-line bg-canvas-raised p-4 shadow-soft hover:border-gold/40 transition-colors"
    >
      <header className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            meta.iconBg,
            meta.iconFg,
          )}
        >
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">
            {provider}
          </p>
          <p className="text-[11px] text-ink-subtle leading-snug line-clamp-2 mt-0.5">
            {meta.description}
          </p>
        </div>
        {errorMessage ? (
          <AlertCircle className="h-4 w-4 text-terracotta-deep shrink-0" />
        ) : isConnected ? (
          <Check className="h-4 w-4 text-sage-deep shrink-0" />
        ) : null}
      </header>

      {/* Status row */}
      <div
        data-testid={`integration-${slugify(provider)}-status`}
        className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-line-soft"
      >
        {errorMessage ? (
          <StatusBadge variant="hot">Issue</StatusBadge>
        ) : isConnected ? (
          <StatusBadge variant="paid">Connected</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">Not connected</StatusBadge>
        )}
        {isConnected && integration.leadsCapturedToday !== undefined ? (
          <span className="text-[10px] text-ink-muted tabular-nums">
            {integration.leadsCapturedToday} leads today
          </span>
        ) : null}
      </div>

      {/* Error detail */}
      {errorMessage ? (
        <p className="text-[10px] text-terracotta-deep mt-1.5 leading-relaxed">
          {errorMessage}
        </p>
      ) : null}

      {/* Action */}
      <div className="mt-3">
        {connecting ? (
          <button
            data-testid={`connecting-${slugify(provider)}`}
            disabled
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-canvas-sunken text-ink-muted h-9 text-xs font-medium"
          >
            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
            Connecting…
          </button>
        ) : isConnected ? (
          <button
            data-testid={`manage-${slugify(provider)}`}
            onClick={onManage}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-canvas-raised border border-line hover:border-gold/40 text-ink h-9 text-xs font-medium transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage
          </button>
        ) : errorMessage ? (
          <button
            data-testid={`reconnect-${slugify(provider)}`}
            onClick={onConnect}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-terracotta-deep text-canvas-raised hover:bg-terracotta-deep/90 h-9 text-xs font-medium transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reconnect
          </button>
        ) : (
          <button
            data-testid={`connect-${slugify(provider)}`}
            onClick={onConnect}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-sage-deep text-canvas-raised hover:bg-sage-deep/90 h-9 text-xs font-medium transition-colors"
          >
            <Plug className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

function ManageSheet({
  integration,
  onClose,
  onDisconnect,
}: {
  integration: Integration;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const meta = PROVIDER_META[integration.provider];
  return (
    <div
      data-testid="manage-sheet"
      data-provider={integration.provider}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas-raised w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 shadow-xl"
      >
        <header className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
              meta.iconBg,
              meta.iconFg,
            )}
          >
            {meta.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-ink truncate">
              {integration.provider}
            </h2>
            <p className="text-xs text-ink-muted">{meta.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-subtle hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Settings list */}
        <ul className="space-y-2 mb-4">
          {meta.manageRows.map((row, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl bg-canvas-sunken/30 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="text-ink font-medium truncate">{row.label}</p>
                {row.value ? (
                  <p className="text-xs text-ink-subtle truncate">
                    {row.value}
                  </p>
                ) : null}
              </div>
              {row.toggle !== undefined ? (
                <div
                  className={cn(
                    "h-5 w-9 rounded-full p-0.5 transition-colors",
                    row.toggle ? "bg-sage-deep" : "bg-canvas-sunken",
                  )}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full bg-canvas-raised shadow transition-transform",
                      row.toggle ? "translate-x-4" : "",
                    )}
                  />
                </div>
              ) : (
                <ChevronRight className="h-4 w-4 text-ink-subtle" />
              )}
            </li>
          ))}
        </ul>

        {/* Last sync */}
        {integration.lastSyncAt ? (
          <p className="text-[11px] text-ink-subtle text-center mb-3">
            Last sync: {formatRelative(integration.lastSyncAt)}
          </p>
        ) : null}

        <button
          data-testid="disconnect-cta"
          onClick={onDisconnect}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-canvas-raised border border-terracotta/40 text-terracotta-deep hover:bg-terracotta-soft/30 h-10 text-sm font-medium transition-colors"
        >
          <X className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}

function SummaryStat({
  testId,
  label,
  value,
  accent,
}: {
  testId: string;
  label: string;
  value: string;
  accent: "sage" | "ink" | "terracotta";
}) {
  const colorClass =
    accent === "sage"
      ? "text-sage-deep"
      : accent === "terracotta"
      ? "text-terracotta-deep"
      : "text-ink";
  return (
    <div
      data-testid={testId}
      className="rounded-2xl bg-canvas-raised border border-line p-3 shadow-soft"
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p
        className={cn(
          "font-display text-2xl font-semibold tabular-nums leading-none mt-1",
          colorClass,
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Provider metadata — icon + description + manage rows per provider
// ----------------------------------------------------------------------------

interface ProviderMeta {
  icon: React.ReactNode;
  iconBg: string;
  iconFg: string;
  description: string;
  manageRows: Array<{
    label: string;
    value?: string;
    toggle?: boolean;
  }>;
}

const PROVIDER_META: Record<IntegrationProvider, ProviderMeta> = {
  "Facebook Lead Ads": {
    icon: <Facebook className="h-5 w-5" />,
    iconBg: "bg-blue-100",
    iconFg: "text-blue-600",
    description: "Auto-import leads from Facebook lead form campaigns.",
    manageRows: [
      { label: "Connected page", value: "Landmasters Properties" },
      { label: "Auto-import leads", toggle: true },
      { label: "Notify on new lead", toggle: true },
      { label: "Lead form mappings" },
    ],
  },
  "Instagram Lead Ads": {
    icon: <Instagram className="h-5 w-5" />,
    iconBg: "bg-pink-100",
    iconFg: "text-pink-600",
    description: "Auto-import leads from Instagram lead form ads.",
    manageRows: [
      { label: "Connected account", value: "@landmasters_ph" },
      { label: "Auto-import leads", toggle: true },
    ],
  },
  "TikTok Lead Forms": {
    icon: <Music2 className="h-5 w-5" />,
    iconBg: "bg-ink/10",
    iconFg: "text-ink",
    description: "Capture TikTok native lead form submissions.",
    manageRows: [
      { label: "Connected account", value: "@landmasters_ph" },
      { label: "Auto-import leads", toggle: true },
    ],
  },
  "Google Ads Lead Forms": {
    icon: <Globe className="h-5 w-5" />,
    iconBg: "bg-yellow-100",
    iconFg: "text-yellow-700",
    description: "Sync Google Ads lead form extensions.",
    manageRows: [
      { label: "Connected campaign", value: "Cebu condos 2025" },
      { label: "Auto-import leads", toggle: true },
    ],
  },
  "WhatsApp Business": {
    icon: <Smartphone className="h-5 w-5" />,
    iconBg: "bg-green-100",
    iconFg: "text-green-700",
    description: "Send and receive WhatsApp messages with buyers.",
    manageRows: [
      { label: "Connected number", value: "+63 917 *** 5678" },
      { label: "Auto-reply when offline", toggle: false },
      { label: "Template message library" },
    ],
  },
  Messenger: {
    icon: <MessageCircle className="h-5 w-5" />,
    iconBg: "bg-blue-100",
    iconFg: "text-blue-600",
    description: "Sync Messenger conversations into your inbox.",
    manageRows: [
      { label: "Connected page", value: "Landmasters Properties" },
      { label: "Auto-reply when offline", toggle: false },
    ],
  },
  "Instagram DM": {
    icon: <Instagram className="h-5 w-5" />,
    iconBg: "bg-pink-100",
    iconFg: "text-pink-600",
    description: "Pull Instagram DM inquiries into your inbox.",
    manageRows: [
      { label: "Connected account", value: "@landmasters_ph" },
      { label: "Auto-acknowledge", toggle: true },
    ],
  },
  "SMS Provider": {
    icon: <MessageCircle className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink-muted",
    description: "Send and receive SMS via Semaphore or Globe Labs.",
    manageRows: [
      { label: "Provider", value: "Semaphore" },
      { label: "Sender ID", value: "LANDMASTER" },
    ],
  },
  Email: {
    icon: <Mail className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink-muted",
    description: "Send email follow-ups from your real estate inbox.",
    manageRows: [
      { label: "Connected email", value: "alyssa@landmasters.ph" },
      { label: "Auto-bcc broker", toggle: true },
    ],
  },
  "Google Calendar": {
    icon: <Calendar className="h-5 w-5" />,
    iconBg: "bg-blue-100",
    iconFg: "text-blue-600",
    description: "Sync site visits to your Google Calendar automatically.",
    manageRows: [
      { label: "Calendar", value: "alyssa@landmasters.ph" },
      { label: "Auto-create site visit events", toggle: true },
      { label: "Send buyer invite", toggle: true },
    ],
  },
  "Google Sheets": {
    icon: <FileSpreadsheet className="h-5 w-5" />,
    iconBg: "bg-green-100",
    iconFg: "text-green-700",
    description: "Export leads and commissions to a Google Sheet.",
    manageRows: [
      { label: "Connected spreadsheet" },
      { label: "Auto-export new leads", toggle: false },
    ],
  },
  "CRM Systems": {
    icon: <Database className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink-muted",
    description: "Push leads and deals to HubSpot, Salesforce, or Pipedrive.",
    manageRows: [{ label: "Target CRM" }],
  },
  n8n: {
    icon: <Workflow className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink",
    description: "Trigger n8n workflows on lead and deal events.",
    manageRows: [{ label: "Webhook URL" }],
  },
  Make: {
    icon: <Layers className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink",
    description: "Connect Make (Integromat) scenarios for automation.",
    manageRows: [{ label: "Webhook URL" }],
  },
  Zapier: {
    icon: <Zap className="h-5 w-5" />,
    iconBg: "bg-orange-100",
    iconFg: "text-orange-700",
    description: "Trigger Zaps when new leads arrive or deals close.",
    manageRows: [{ label: "Connected Zapier account" }],
  },
  "Website Forms": {
    icon: <Code className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink",
    description: "Capture leads from your website contact forms.",
    manageRows: [
      { label: "Form embed code" },
      { label: "Auto-assign new leads", toggle: true },
    ],
  },
  "Landing Pages": {
    icon: <Globe className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink",
    description: "Sync leads from your landing page builder.",
    manageRows: [{ label: "Builder", value: "Unbounce / Carrd / Custom" }],
  },
  "Property Inventory Database": {
    icon: <Database className="h-5 w-5" />,
    iconBg: "bg-canvas-sunken",
    iconFg: "text-ink",
    description: "Sync listing inventory from your developer database.",
    manageRows: [{ label: "Database endpoint" }],
  },
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatRelative(iso: string): string {
  try {
    const now = new Date("2025-05-29T08:00:00.000Z").getTime();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(diffMs / 3_600_000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
