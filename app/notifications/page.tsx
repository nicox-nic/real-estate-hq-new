"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Flame,
  MessageCircle,
  Eye,
  Calculator,
  CalendarCheck,
  Clock,
  FileCheck2,
  Coins,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Send,
  Megaphone,
  Gift,
  Check,
  CheckCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { seedNotifications } from "@/lib/data";
import { entityHrefForRole } from "@/lib/notificationLinks";
import { demoUserForRole, demoUserIdForRole, roleBasePath } from "@/lib/rolePaths";
import { useCurrentRole } from "@/lib/useCurrentRole";
import type {
  NotificationItem,
  NotificationCategory,
  UserRole,
} from "@/lib/types";

/**
 * Notifications (#45) at /notifications.
 *
 * Composes with the EXISTING NotificationItem entity (no new entity
 * introduced — same field-not-entity discipline as Session 7B).
 *
 * - Categorized list with type icons (14 PRD categories mapped)
 * - Unread state with visual indicator
 * - Per-notification mark-as-read affordance + mark-all
 * - Filter chips by category (All / Unread / + top categories)
 * - Priority badge (Urgent / Important / Normal)
 * - Tap-through to related entity (lead/deal/commission)
 *
 * Scoped to the current demo user (agent-001). In a real backend the
 * userId would come from auth context; here it's the seeded demo agent.
 */
export default function NotificationsPage() {
  const role = useCurrentRole();
  const demoUserId = demoUserIdForRole(role);
  const user = demoUserForRole(role);

  // Initial state from seed; mark-as-read updates local state only
  // (would persist via a backend in production)
  const [items, setItems] = React.useState<NotificationItem[]>(() =>
    seedNotifications
      .filter((n) => n.userId === demoUserId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  );

  const unreadCount = items.filter((n) => !n.read).length;

  const [filter, setFilter] = React.useState<string>("All");

  const filteredItems = React.useMemo(() => {
    if (filter === "All") return items;
    if (filter === "Unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  const markAsRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Get the top categories present in the seed for filter chips
  const presentCategories = React.useMemo(() => {
    const set = new Set<NotificationCategory>();
    for (const n of items) set.add(n.category);
    return Array.from(set);
  }, [items]);

  return (
    <AppShell
      role={role}
      userName={user?.fullName ?? "Demo User"}
      userSubtitle={user?.companyName ?? role}
    >
      <div className="space-y-4 pb-4">
        <Link
          href={roleBasePath(role)}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1
              data-testid="notifications-title"
              className="font-display text-2xl font-semibold text-ink inline-flex items-center gap-2"
            >
              <Bell className="h-5 w-5 text-gold-deep" />
              Notifications
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">
              <span
                data-testid="unread-count"
                data-count={unreadCount}
                className="text-ink font-medium"
              >
                {unreadCount}
              </span>{" "}
              unread of {items.length} total
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              data-testid="mark-all-read"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-canvas-raised border border-line px-3 h-9 text-xs text-ink hover:border-gold/40"
            >
              <CheckCheck className="h-3.5 w-3.5 text-sage-deep" />
              Mark All Read
            </button>
          ) : null}
        </header>

        {/* Filter chips */}
        <div
          data-testid="notification-filter-chips"
          className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none"
        >
          <FilterChip
            label="All"
            count={items.length}
            active={filter === "All"}
            onClick={() => setFilter("All")}
            testId="filter-all"
          />
          <FilterChip
            label="Unread"
            count={unreadCount}
            active={filter === "Unread"}
            onClick={() => setFilter("Unread")}
            testId="filter-unread"
          />
          {presentCategories.map((cat) => {
            const count = items.filter((n) => n.category === cat).length;
            return (
              <FilterChip
                key={cat}
                label={cat}
                count={count}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                testId={`filter-${slugify(cat)}`}
              />
            );
          })}
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <Card className="!p-6 text-center">
            <Bell className="h-8 w-8 text-ink-subtle mx-auto mb-2" />
            <p className="text-sm text-ink-muted italic">
              No notifications match this filter.
            </p>
          </Card>
        ) : (
          <ul
            data-testid="notifications-list"
            data-count={filteredItems.length}
            className="space-y-2"
          >
            {filteredItems.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                role={role}
                onMarkRead={markAsRead}
              />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function FilterChip({
  label,
  count,
  active,
  onClick,
  testId,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      data-active={active}
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-xs font-medium border transition-colors",
        active
          ? "bg-sage-deep text-canvas-raised border-transparent"
          : "bg-canvas-raised text-ink-muted border-line hover:border-gold/40",
      )}
    >
      {label}
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
}

function NotificationRow({
  notification,
  role,
  onMarkRead,
}: {
  notification: NotificationItem;
  role: UserRole;
  onMarkRead: (id: string) => void;
}) {
  const Icon = categoryIcon(notification.category);
  const iconColor = categoryColor(notification.category);
  const href = entityHrefForRole(role, notification);

  const content = (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
          iconColor.bg,
          iconColor.fg,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-0.5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  "text-sm truncate",
                  notification.read
                    ? "text-ink font-normal"
                    : "text-ink font-semibold",
                )}
              >
                {notification.title}
              </p>
              {notification.priority === "Urgent" ? (
                <StatusBadge variant="hot">Urgent</StatusBadge>
              ) : notification.priority === "Important" ? (
                <StatusBadge variant="warm">Important</StatusBadge>
              ) : null}
              {!notification.read ? (
                <span
                  data-testid={`unread-dot-${notification.id}`}
                  aria-label="Unread"
                  className="h-2 w-2 rounded-full bg-sage-deep shrink-0"
                />
              ) : null}
            </div>
            <p
              className={cn(
                "text-xs leading-relaxed mt-0.5",
                notification.read ? "text-ink-muted" : "text-ink-muted",
              )}
            >
              {notification.body}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[11px] text-ink-subtle inline-flex items-center gap-1">
            <span>{notification.category}</span>
            <span>·</span>
            <span>{formatRelative(notification.occurredAt)}</span>
          </span>
          {!notification.read ? (
            <button
              data-testid={`mark-read-${notification.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="text-[11px] text-sage-deep font-medium inline-flex items-center gap-0.5 hover:underline"
            >
              <Check className="h-3 w-3" />
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <li>
      {href ? (
        <Link
          href={href}
          data-testid={`notif-${notification.id}`}
          data-read={notification.read}
          data-category={notification.category}
          className={cn(
            "block rounded-xl border p-3 transition-colors",
            notification.read
              ? "bg-canvas-raised border-line"
              : "bg-canvas-raised border-sage-deep/30 shadow-soft",
            "hover:border-gold/40",
          )}
        >
          {content}
        </Link>
      ) : (
        <div
          data-testid={`notif-${notification.id}`}
          data-read={notification.read}
          data-category={notification.category}
          className={cn(
            "block rounded-xl border p-3",
            notification.read
              ? "bg-canvas-raised border-line"
              : "bg-canvas-raised border-sage-deep/30 shadow-soft",
          )}
        >
          {content}
        </div>
      )}
    </li>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function categoryIcon(c: NotificationCategory) {
  switch (c) {
    case "New Hot Lead":
      return Flame;
    case "Buyer Replied":
      return MessageCircle;
    case "Buyer Opened Listing":
      return Eye;
    case "Computation Requested":
      return Calculator;
    case "Site Visit Confirmed":
      return CalendarCheck;
    case "Site Visit Reminder":
      return Clock;
    case "Deal Stage Changed":
      return FileCheck2;
    case "Commission Approved":
      return CheckCircle2;
    case "Commission Released":
      return Coins;
    case "Missing Document":
      return AlertCircle;
    case "Cold Lead Reactivation":
      return RefreshCcw;
    case "Broker Sent Listing":
      return Send;
    case "Team Announcement":
      return Megaphone;
    case "Bonus Campaign":
      return Gift;
    default:
      return Bell;
  }
}

function categoryColor(c: NotificationCategory): { bg: string; fg: string } {
  switch (c) {
    case "New Hot Lead":
      return { bg: "bg-terracotta-soft/60", fg: "text-terracotta-deep" };
    case "Buyer Replied":
    case "Buyer Opened Listing":
    case "Computation Requested":
      return { bg: "bg-sage-soft/60", fg: "text-sage-deep" };
    case "Site Visit Confirmed":
    case "Site Visit Reminder":
      return { bg: "bg-navy-soft/70", fg: "text-navy" };
    case "Deal Stage Changed":
    case "Commission Approved":
    case "Commission Released":
      return { bg: "bg-sage-soft/60", fg: "text-sage-deep" };
    case "Missing Document":
    case "Cold Lead Reactivation":
      return { bg: "bg-terracotta-soft/60", fg: "text-terracotta-deep" };
    case "Broker Sent Listing":
    case "Team Announcement":
      return { bg: "bg-gold-soft/70", fg: "text-gold-deep" };
    case "Bonus Campaign":
      return { bg: "bg-gold-soft/70", fg: "text-gold-deep" };
    default:
      return { bg: "bg-canvas-sunken/50", fg: "text-ink-muted" };
  }
}

function formatRelative(iso: string): string {
  try {
    const now = new Date("2025-05-29T08:00:00.000Z").getTime();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(diffMs / 86_400_000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
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
