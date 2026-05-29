"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Megaphone,
  CalendarDays,
  Award,
  Gift,
  Send,
  Mail,
  Bell,
  Smartphone,
  MessageCircle,
  Eye,
  CheckCircle2,
  MousePointerClick,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import {
  seedUsers,
  seedTeamUpdates,
  DEMO_BROKER_ID,
  DEMO_REALTOR_ID,
} from "@/lib/data";
import { resolveTeamAgentIds } from "@/lib/logic/managerDashboardDerivations";
import type { TeamUpdateType, BroadcastChannel, TeamUpdate } from "@/lib/types";

interface Props {
  role: "Broker" | "Realtor";
}

/**
 * Team Updates (#31) — parameterized component for /broker/team-updates
 * and /realtor/team-updates.
 *
 * Composes with the EXISTING TeamUpdate entity (no new entity introduced).
 * The entity already supports:
 *   - 11 update types (General Update through Motivational Message)
 *   - 6 broadcast channels (In-App / Push / Email / SMS / WhatsApp /
 *     Messenger Group)
 *   - 4 audience targets (All Agents / Selected / By Specialization /
 *     By Location)
 *   - Engagement counters (delivered / opened / acknowledged / clicked)
 *
 * UI: list of past updates with engagement counters + compose card with
 * quick-action chips matching the dashboard's 4 categories (Announcement /
 * Event / Award / Bonus) which map to TeamUpdateType variants.
 */
export function TeamUpdates({ role }: Props) {
  const userId = role === "Broker" ? DEMO_BROKER_ID : DEMO_REALTOR_ID;
  const manager = seedUsers.find((u) => u.id === userId);
  if (!manager) return null;
  const roleSlug = role.toLowerCase() as "broker" | "realtor";

  const teamIds = resolveTeamAgentIds(manager, seedUsers);
  const teamSize = teamIds.size;

  // Filter updates authored by this manager (broker shows their own;
  // realtor would show their own across the network — for now scoped
  // to authorId match)
  const updates = seedTeamUpdates
    .filter((u) =>
      role === "Broker" ? u.authorId === userId : true,
    )
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  const [composeType, setComposeType] = React.useState<TeamUpdateType>(
    "General Update",
  );
  const [composeBody, setComposeBody] = React.useState("");
  const [audience, setAudience] = React.useState<TeamUpdate["audience"]>(
    "All Agents",
  );

  return (
    <AppShell
      role={role}
      userName={manager.fullName}
      userSubtitle={manager.companyName ?? role}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={`/${roleSlug}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header>
          <h1
            data-testid="team-updates-title"
            className="font-display text-2xl font-semibold text-ink"
          >
            Team Updates
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Share announcements, events, and bonuses with{" "}
            {role === "Broker" ? "your team" : "your network"}.
          </p>
        </header>

        {/* Compose */}
        <Card data-testid="team-update-compose" className="!p-5">
          <CardHeader>
            <CardTitle>Compose Update</CardTitle>
            <span className="text-xs text-ink-subtle">
              Reach {teamSize} {teamSize === 1 ? "agent" : "agents"}
            </span>
          </CardHeader>

          {/* Quick-action chips matching the dashboard's chips */}
          <div
            data-testid="compose-type-chips"
            className="flex items-center gap-1.5 flex-wrap mb-3"
          >
            <TypeChip
              testId="type-announcement"
              icon={<Megaphone className="h-3 w-3" />}
              label="Announcement"
              active={composeType === "General Update"}
              onClick={() => setComposeType("General Update")}
            />
            <TypeChip
              testId="type-event"
              icon={<CalendarDays className="h-3 w-3" />}
              label="Event"
              active={composeType === "Event Announcement"}
              onClick={() => setComposeType("Event Announcement")}
            />
            <TypeChip
              testId="type-award"
              icon={<Award className="h-3 w-3" />}
              label="Award"
              active={composeType === "Awards Announcement"}
              onClick={() => setComposeType("Awards Announcement")}
            />
            <TypeChip
              testId="type-bonus"
              icon={<Gift className="h-3 w-3" />}
              label="Bonus"
              active={composeType === "Bonus Announcement"}
              onClick={() => setComposeType("Bonus Announcement")}
            />
          </div>

          <textarea
            data-testid="compose-body"
            rows={3}
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder={
              role === "Broker"
                ? "Share an update with your team..."
                : "Share an update, training, or opportunity..."
            }
            className="w-full rounded-xl bg-canvas-raised border border-line px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-gold/60 resize-none"
          />

          {/* Audience targeting */}
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
                Audience
              </span>
              <select
                data-testid="audience-selector"
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value as TeamUpdate["audience"])
                }
                className="text-xs bg-canvas-raised border border-line rounded-lg px-2 h-7 text-ink focus:outline-none focus:border-gold/60"
              >
                <option value="All Agents">All Agents</option>
                <option value="Selected">Selected agents</option>
                <option value="By Specialization">By specialization</option>
                <option value="By Location">By location</option>
              </select>
            </div>
            <Button
              variant="primary"
              size="sm"
              data-testid="send-update-cta"
            >
              <Send className="h-3.5 w-3.5" />
              Send Update
            </Button>
          </div>
        </Card>

        {/* History list */}
        <section data-testid="updates-history" className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">
              Recent Updates
            </h2>
            <span className="text-xs text-ink-subtle">
              {updates.length} sent
            </span>
          </header>
          {updates.length === 0 ? (
            <Card className="!p-5 text-center">
              <p className="text-sm text-ink-muted italic">
                No updates sent yet. Compose your first above.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {updates.map((u) => (
                <UpdateCard key={u.id} update={u} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function TypeChip({
  testId,
  icon,
  label,
  active,
  onClick,
}: {
  testId: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={testId}
      data-active={active}
      onClick={onClick}
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-medium border transition-colors",
        active
          ? "bg-sage-deep text-canvas-raised border-transparent"
          : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function UpdateCard({ update }: { update: TeamUpdate }) {
  const author = seedUsers.find((u) => u.id === update.authorId);
  return (
    <li>
      <Card
        data-testid={`update-card-${update.id}`}
        data-type={update.type}
        data-audience={update.audience}
        className="!p-4"
      >
        <header className="flex items-start justify-between gap-2 flex-wrap mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge variant="paid">{update.type}</StatusBadge>
              <span className="text-[10px] text-ink-subtle uppercase tracking-wider font-medium">
                {update.audience}
              </span>
            </div>
            <p className="text-sm font-medium text-ink truncate">
              {update.title}
            </p>
          </div>
          <span className="text-[11px] text-ink-subtle shrink-0">
            {formatRelativeDate(update.sentAt)}
          </span>
        </header>
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
          {update.body}
        </p>

        {/* Engagement row */}
        <div
          data-testid={`update-${update.id}-engagement`}
          className="mt-3 pt-3 border-t border-line-soft grid grid-cols-4 gap-2 text-center"
        >
          <EngagementCell
            icon={<Send className="h-3 w-3" />}
            label="Delivered"
            value={update.delivered}
          />
          <EngagementCell
            icon={<Eye className="h-3 w-3" />}
            label="Opened"
            value={update.opened}
          />
          <EngagementCell
            icon={<CheckCircle2 className="h-3 w-3" />}
            label="Acknowledged"
            value={update.acknowledged}
          />
          <EngagementCell
            icon={<MousePointerClick className="h-3 w-3" />}
            label="Clicked"
            value={update.clicked}
          />
        </div>

        {/* Channels */}
        <div className="mt-2 inline-flex items-center gap-1 flex-wrap">
          {update.channels.map((c: BroadcastChannel) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-canvas-sunken/40 text-ink-subtle"
            >
              {channelIcon(c)}
              {c}
            </span>
          ))}
        </div>

        {author ? (
          <p className="mt-2 text-[10px] text-ink-subtle">
            Sent by {author.fullName}
          </p>
        ) : null}
      </Card>
    </li>
  );
}

function EngagementCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-0.5 text-ink-subtle">
        {icon}
      </div>
      <p className="font-display text-sm font-semibold text-ink tabular-nums leading-none">
        {value}
      </p>
      <p className="text-[9px] uppercase tracking-wider text-ink-subtle font-medium">
        {label}
      </p>
    </div>
  );
}

function channelIcon(c: BroadcastChannel): React.ReactNode {
  switch (c) {
    case "Email":
      return <Mail className="h-2.5 w-2.5" />;
    case "Push Notification":
      return <Smartphone className="h-2.5 w-2.5" />;
    case "SMS":
      return <MessageCircle className="h-2.5 w-2.5" />;
    case "WhatsApp":
      return <MessageCircle className="h-2.5 w-2.5" />;
    case "Messenger Group":
      return <MessageCircle className="h-2.5 w-2.5" />;
    default:
      return <Bell className="h-2.5 w-2.5" />;
  }
}

function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
