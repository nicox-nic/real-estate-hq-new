"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Bell,
  Plug,
  Globe,
  CreditCard,
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  Mail,
  HelpCircle,
  Megaphone,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { seedIntegrations, seedPayoutAccounts, seedUsers } from "@/lib/data";
import {
  demoUserForRole,
  demoUserIdForRole,
  integrationsPathForRole,
  roleBasePath,
} from "@/lib/rolePaths";
import { useCurrentRole } from "@/lib/useCurrentRole";
import type { NotificationCategory } from "@/lib/types";

/**
 * Settings (#36) at /settings.
 *
 * Cross-cutting surface composed of multiple sections. PRD-specified:
 *   - Profile (name, photo, role, license, contact)
 *   - Notification preferences (per-category toggles for 14 categories)
 *   - Account (change password, sign out, payment methods)
 *   - Integrations (link to /integrations)
 *   - Language preference (English/Tagalog/Cebuano)
 *   - Role-aware sections for broker/realtor
 *
 * No new entity types — all sections compose from existing User /
 * NotificationCategory / Integration / PayoutAccount entities.
 */
export default function SettingsPage() {
  const role = useCurrentRole();
  const user = demoUserForRole(role);
  const demoUserId = demoUserIdForRole(role);

  // Notification prefs — initialize all 14 categories to enabled
  const allCategories: NotificationCategory[] = [
    "New Hot Lead",
    "Buyer Replied",
    "Buyer Opened Listing",
    "Computation Requested",
    "Site Visit Confirmed",
    "Site Visit Reminder",
    "Deal Stage Changed",
    "Commission Approved",
    "Commission Released",
    "Missing Document",
    "Cold Lead Reactivation",
    "Broker Sent Listing",
    "Team Announcement",
    "Bonus Campaign",
  ];
  const [notifPrefs, setNotifPrefs] = React.useState<
    Record<NotificationCategory, boolean>
  >(() =>
    Object.fromEntries(
      allCategories.map((c) => [c, true]),
    ) as Record<NotificationCategory, boolean>,
  );

  const [language, setLanguage] = React.useState<
    "English" | "Tagalog" | "Cebuano"
  >("English");

  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [smsEnabled, setSmsEnabled] = React.useState(false);

  const connectedCount = seedIntegrations.filter((i) => i.isConnected).length;
  const myAccounts = seedPayoutAccounts.filter((pa) => pa.userId === demoUserId);

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo Agent"}
      userSubtitle={user?.companyName ?? "Agent"}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={roleBasePath(role)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header>
          <h1
            data-testid="settings-title"
            className="font-display text-2xl font-semibold text-ink"
          >
            Settings
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Manage your profile, preferences, and connections.
          </p>
        </header>

        {/* Profile Section */}
        <Card data-testid="settings-profile" className="!p-5">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4 text-sage-deep" />
                Profile
              </span>
            </CardTitle>
            <button className="text-xs text-sage-deep font-medium hover:underline">
              Edit
            </button>
          </CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-ink-muted">
                {initials(user?.fullName ?? "DA")}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {user?.fullName ?? "Demo Agent"}
              </p>
              <p className="text-xs text-ink-muted">
                {role} ·{" "}
                {user?.companyName ?? "—"}
              </p>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <StatusBadge variant="verified">Verified</StatusBadge>
                {user?.prcLicenseNumber ? (
                  <span className="text-[10px] text-ink-subtle">
                    License: {user.prcLicenseNumber}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <ul
            data-testid="profile-fields"
            className="mt-4 space-y-2 text-sm border-t border-line-soft pt-3"
          >
            <FieldRow
              icon={<Mail className="h-3.5 w-3.5 text-ink-subtle" />}
              label="Email"
              value={user?.email ?? "—"}
            />
            <FieldRow
              icon={<Smartphone className="h-3.5 w-3.5 text-ink-subtle" />}
              label="Mobile"
              value={user?.mobile ?? "—"}
            />
            <FieldRow
              icon={<Users className="h-3.5 w-3.5 text-ink-subtle" />}
              label="Reports to"
              value={
                seedUsers.find((u) => u.id === user?.parentId)?.fullName ?? "—"
              }
            />
          </ul>
        </Card>

        {/* Notification Preferences */}
        <Card data-testid="settings-notifications" className="!p-5">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-gold-deep" />
                Notification Preferences
              </span>
            </CardTitle>
            <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-medium">
              {Object.values(notifPrefs).filter(Boolean).length} of{" "}
              {allCategories.length} enabled
            </span>
          </CardHeader>

          {/* Delivery channels */}
          <div
            data-testid="delivery-channels"
            className="space-y-2 mb-4 pb-4 border-b border-line-soft"
          >
            <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
              Delivery channels
            </p>
            <ToggleRow
              testId="push-toggle"
              label="Push notifications"
              description="Real-time alerts on your phone"
              value={pushEnabled}
              onChange={setPushEnabled}
            />
            <ToggleRow
              testId="email-toggle"
              label="Email notifications"
              description="Summary digest"
              value={emailEnabled}
              onChange={setEmailEnabled}
            />
            <ToggleRow
              testId="sms-toggle"
              label="SMS notifications"
              description="Urgent alerts only"
              value={smsEnabled}
              onChange={setSmsEnabled}
            />
          </div>

          {/* Per-category toggles */}
          <div data-testid="notification-categories" className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium mb-2">
              Categories
            </p>
            {allCategories.map((cat) => (
              <ToggleRow
                key={cat}
                testId={`category-${slugify(cat)}`}
                label={cat}
                value={notifPrefs[cat]}
                onChange={(v) =>
                  setNotifPrefs((prev) => ({ ...prev, [cat]: v }))
                }
                compact
              />
            ))}
          </div>
        </Card>

        {/* Language Preference */}
        <Card data-testid="settings-language" className="!p-5">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-navy" />
                Language
              </span>
            </CardTitle>
          </CardHeader>
          <p className="text-xs text-ink-muted mb-3">
            Affects generated content in Content Studio and AI replies.
          </p>
          <div className="flex items-center gap-1.5">
            {(["English", "Tagalog", "Cebuano"] as const).map((l) => (
              <button
                key={l}
                data-testid={`lang-${l.toLowerCase()}`}
                data-active={l === language}
                onClick={() => setLanguage(l)}
                className={cn(
                  "rounded-full px-3 h-8 text-xs font-medium border transition-colors",
                  l === language
                    ? "bg-sage-deep text-canvas-raised border-transparent"
                    : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>

        {/* Integrations link */}
        <Card data-testid="settings-integrations-link" className="!p-0 overflow-hidden">
          <Link
            href={integrationsPathForRole(role)}
            className="flex items-center gap-3 p-4 hover:bg-canvas-sunken/30 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-sage-soft/60 text-sage-deep flex items-center justify-center shrink-0">
              <Plug className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Integrations</p>
              <p className="text-xs text-ink-muted">
                {connectedCount} connected · {seedIntegrations.length - connectedCount} available
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-subtle" />
          </Link>
        </Card>

        {/* Payout Accounts (links to commission tracking) */}
        <Card data-testid="settings-payout-accounts" className="!p-5">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-gold-deep" />
                Payout Accounts
              </span>
            </CardTitle>
            <Link
              href="/agent/commissions"
              className="text-xs text-sage-deep font-medium hover:underline"
            >
              Manage
            </Link>
          </CardHeader>
          {myAccounts.length === 0 ? (
            <p className="text-sm text-ink-muted italic text-center py-3">
              No payout accounts added yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {myAccounts.map((pa) => (
                <li
                  key={pa.id}
                  data-testid={`payout-account-${pa.id}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="h-8 w-8 rounded-full bg-canvas-sunken flex items-center justify-center shrink-0 text-[10px] font-medium text-ink-muted">
                    {pa.bankName.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate">
                      {pa.bankName} {pa.accountNumberMasked}
                    </p>
                    <p className="text-[10px] text-ink-subtle truncate">
                      {pa.accountNameMasked}
                    </p>
                  </div>
                  {pa.isDefault ? (
                    <StatusBadge variant="paid">Default</StatusBadge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Role-aware sections */}
        {role === "Broker" || role === "Realtor" ? (
          <Card data-testid="settings-team-management" className="!p-5">
            <CardHeader>
              <CardTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-sage-deep" />
                  Team Management
                </span>
              </CardTitle>
            </CardHeader>
            <ul className="space-y-1.5">
              <ToggleRow
                testId="auto-assign-leads"
                label="Auto-assign new leads"
                description="Route leads to agents by location and specialization"
                value={true}
                onChange={() => {}}
                compact
              />
              <ToggleRow
                testId="broadcast-defaults"
                label="Send broadcasts to all agents by default"
                value={true}
                onChange={() => {}}
                compact
              />
              <ToggleRow
                testId="require-agent-approval"
                label="Require agent affiliation approval"
                value={true}
                onChange={() => {}}
                compact
              />
            </ul>
          </Card>
        ) : null}

        {/* Account / Security */}
        <Card data-testid="settings-account" className="!p-5">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-terracotta-deep" />
                Account
              </span>
            </CardTitle>
          </CardHeader>
          <ul className="space-y-2">
            <ActionRow
              testId="change-password"
              label="Change password"
              description="Update your sign-in password"
            />
            <ActionRow
              testId="two-factor"
              label="Two-factor authentication"
              description="Add a verification step at sign-in"
              badge="Recommended"
            />
            <ActionRow
              testId="export-data"
              label="Export my data"
              description="Download leads, deals, commissions as CSV"
            />
          </ul>
        </Card>

        {/* About + Sign Out */}
        <Card className="!p-5">
          <ul className="space-y-2">
            <ActionRow
              testId="help-center"
              label="Help Center"
              icon={<HelpCircle className="h-4 w-4 text-ink-subtle" />}
            />
            <ActionRow
              testId="about"
              label="About Real Estate HQ"
              icon={<Globe className="h-4 w-4 text-ink-subtle" />}
            />
          </ul>
          <button
            data-testid="sign-out"
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-canvas-raised border border-terracotta/40 text-terracotta-deep hover:bg-terracotta-soft/30 h-10 text-sm font-medium transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </Card>

        <p className="text-[11px] text-ink-subtle text-center">
          Real Estate HQ · v0.9 prototype
        </p>
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-ink-muted">
        {icon}
        {label}
      </span>
      <span className="text-ink text-xs truncate">{value}</span>
    </li>
  );
}

function ToggleRow({
  testId,
  label,
  description,
  value,
  onChange,
  compact = false,
}: {
  testId: string;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div
      data-testid={testId}
      data-enabled={value}
      className={cn(
        "flex items-center justify-between gap-3",
        compact ? "py-1.5" : "py-2",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-ink",
            compact ? "text-xs" : "text-sm font-medium",
          )}
        >
          {label}
        </p>
        {description ? (
          <p className="text-[10px] text-ink-subtle">{description}</p>
        ) : null}
      </div>
      <button
        onClick={() => onChange(!value)}
        type="button"
        aria-checked={value}
        role="switch"
        className={cn(
          "h-5 w-9 rounded-full p-0.5 transition-colors shrink-0",
          value ? "bg-sage-deep" : "bg-canvas-sunken",
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-canvas-raised shadow transition-transform",
            value ? "translate-x-4" : "",
          )}
        />
      </button>
    </div>
  );
}

function ActionRow({
  testId,
  label,
  description,
  icon,
  badge,
}: {
  testId: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
}) {
  return (
    <li>
      <button
        data-testid={testId}
        className="w-full flex items-center justify-between gap-3 hover:bg-canvas-sunken/30 -mx-2 px-2 py-2 rounded-lg transition-colors text-left"
      >
        <div className="inline-flex items-start gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 flex-wrap">
              <p className="text-sm text-ink truncate">{label}</p>
              {badge ? (
                <StatusBadge variant="warm">{badge}</StatusBadge>
              ) : null}
            </div>
            {description ? (
              <p className="text-[10px] text-ink-subtle">{description}</p>
            ) : null}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-ink-subtle shrink-0" />
      </button>
    </li>
  );
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
