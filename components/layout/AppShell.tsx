"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  Building2,
  TrendingUp,
  Trophy,
  Bell,
  Settings,
  Users,
  Megaphone,
  BarChart3,
  Sparkles,
  PlugZap,
  Map,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { seedNotifications } from "@/lib/data";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Per-role nav definitions. Mobile picks the first 5; desktop shows the rest in a secondary group. */
const NAV_BY_ROLE: Record<UserRole, { primary: NavItem[]; secondary: NavItem[] }> =
  {
    Agent: {
      primary: [
        { label: "Dashboard", href: "/agent", icon: Home },
        { label: "Leads", href: "/agent/leads", icon: Inbox },
        { label: "Listings", href: "/agent/listings", icon: Building2 },
        { label: "Deals", href: "/agent/deals", icon: TrendingUp },
        { label: "Earnings", href: "/agent/commissions", icon: Trophy },
      ],
      secondary: [
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "AI Studio", href: "/agent/content-studio", icon: Sparkles },
        { label: "Integrations", href: "/agent/integrations", icon: PlugZap },
        { label: "Settings", href: "/agent/settings", icon: Settings },
      ],
    },
    Broker: {
      primary: [
        { label: "Dashboard", href: "/broker", icon: Home },
        { label: "Agents", href: "/broker/agents", icon: Users },
        { label: "Listings", href: "/broker/listings", icon: Building2 },
        { label: "Leaderboard", href: "/broker/leaderboard", icon: TrendingUp },
        { label: "Awards", href: "/broker/campaigns", icon: Trophy },
      ],
      secondary: [
        { label: "Distribute", href: "/broker/listings", icon: Megaphone },
        { label: "Updates", href: "/broker/team-updates", icon: Megaphone },
        { label: "Analytics", href: "/broker/insights", icon: BarChart3 },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "Integrations", href: "/broker/integrations", icon: PlugZap },
        { label: "Settings", href: "/broker/settings", icon: Settings },
      ],
    },
    Realtor: {
      primary: [
        { label: "Dashboard", href: "/realtor", icon: Home },
        { label: "Network", href: "/realtor/agents", icon: Map },
        { label: "Listings", href: "/realtor/listings", icon: Building2 },
        { label: "Leaderboard", href: "/realtor/leaderboard", icon: TrendingUp },
        { label: "Analytics", href: "/realtor/insights", icon: BarChart3 },
      ],
      secondary: [
        { label: "Distribute", href: "/realtor/listings", icon: Megaphone },
        { label: "Updates", href: "/realtor/team-updates", icon: Megaphone },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "Integrations", href: "/realtor/integrations", icon: PlugZap },
        { label: "Settings", href: "/realtor/settings", icon: Settings },
      ],
    },
  };

interface AppShellProps {
  role: UserRole;
  userName: string;
  userSubtitle?: string;
  children: React.ReactNode;
}

export function AppShell({ role, userName, userSubtitle, children }: AppShellProps) {
  const nav = NAV_BY_ROLE[role];
  const pathname = usePathname();
  // Compute unread notification count from seed (scoped to demo user;
  // a real backend would scope by auth context). Used for the bell
  // badge in the sidebar footer + mobile header. The bell routes
  // universally to /notifications regardless of role.
  const unreadCount = React.useMemo(
    () => seedNotifications.filter((n) => !n.read).length,
    [],
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-canvas-raised border-r border-line">
        <div className="px-6 py-6 border-b border-line">
          <div className="font-display text-xl font-semibold tracking-tight">
            Real Estate <span className="text-gold-deep">HQ</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {nav.primary.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
          <div className="space-y-1">
            <div className="px-3 mb-1 text-xs font-medium uppercase tracking-wider text-ink-subtle">
              More
            </div>
            {nav.secondary.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <UserAccountMenu
              userName={userName}
              userSubtitle={userSubtitle || role}
              role={role}
              unreadCount={unreadCount}
              size="default"
              menuPlacement="above"
              className="min-w-0 flex-1"
            />
            <Link
              href="/notifications"
              data-testid="appshell-bell"
              data-unread-count={unreadCount}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              className="relative shrink-0 text-ink-subtle hover:text-ink"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span
                  data-testid="appshell-bell-badge"
                  className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-terracotta-deep text-canvas-raised text-[9px] font-semibold flex items-center justify-center tabular-nums"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile top header — visible on small screens only.
       *  Shows the role + a tappable bell with unread badge so mobile
       *  users have a notification entry point without crowding the
       *  5-icon bottom nav. */}
      <header className="lg:hidden sticky top-0 z-40 bg-canvas-raised/95 backdrop-blur-sm border-b border-line">
        <div className="flex items-center justify-between gap-2 px-4 h-12">
          <UserAccountMenu
            userName={userName}
            userSubtitle={userSubtitle || role}
            role={role}
            unreadCount={unreadCount}
            size="compact"
            menuPlacement="below"
          />
          <Link
            href="/notifications"
            data-testid="mobile-bell"
            data-unread-count={unreadCount}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-xl text-ink-muted hover:text-ink"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span
                data-testid="mobile-bell-badge"
                className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-terracotta-deep text-canvas-raised text-[9px] font-semibold flex items-center justify-center tabular-nums"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-canvas-raised border-t border-line shadow-lift">
        <div className="grid grid-cols-5 h-16">
          {nav.primary.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-gold-deep" : "text-ink-subtle",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

const ACCOUNT_MENU_LABELS = new Set([
  "Settings",
  "Notifications",
  "Integrations",
  "AI Studio",
]);

function accountMenuItems(role: UserRole): NavItem[] {
  return NAV_BY_ROLE[role].secondary.filter((item) =>
    ACCOUNT_MENU_LABELS.has(item.label),
  );
}

function UserAccountMenu({
  userName,
  userSubtitle,
  role,
  unreadCount,
  size,
  menuPlacement,
  className,
}: {
  userName: string;
  userSubtitle: string;
  role: UserRole;
  unreadCount: number;
  size: "compact" | "default";
  menuPlacement: "below" | "above";
  className?: string;
}) {
  const compact = size === "compact";
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuItems = accountMenuItems(role);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative flex items-center gap-2 min-w-0",
        compact && "flex-1",
        className,
      )}
      data-testid={compact ? "mobile-user-profile" : "sidebar-user-profile"}
    >
      <button
        type="button"
        data-testid={compact ? "mobile-user-avatar-menu" : "desktop-user-avatar-menu"}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "rounded-full bg-gold-soft flex items-center justify-center text-gold-deep font-semibold shrink-0",
          "hover:ring-2 hover:ring-gold-deep/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/50",
          open && "ring-2 ring-gold-deep/40",
          compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm",
        )}
      >
        {userInitials(userName)}
      </button>
      <div className="min-w-0 leading-tight pointer-events-none">
        <div className="text-sm font-medium text-ink truncate">{userName}</div>
        <div
          className={cn(
            "text-ink-muted truncate",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {userSubtitle}
        </div>
      </div>

      {open ? (
        <div
          role="menu"
          data-testid={compact ? "mobile-user-menu" : "desktop-user-menu"}
          className={cn(
            "absolute left-0 z-50 w-56 rounded-2xl border border-line bg-canvas-raised shadow-lift py-1.5",
            menuPlacement === "below"
              ? "top-[calc(100%+6px)]"
              : "bottom-[calc(100%+6px)]",
          )}
        >
          <div className="px-3 py-2 border-b border-line-soft">
            <p className="text-sm font-medium text-ink truncate">{userName}</p>
            <p className="text-xs text-ink-muted truncate">{userSubtitle}</p>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const showUnread =
              item.label === "Notifications" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-canvas-sunken transition-colors"
              >
                <Icon className="h-4 w-4 text-ink-subtle shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showUnread ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta-deep text-canvas-raised text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="my-1 border-t border-line-soft" />

          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            data-testid={
              compact ? "mobile-user-menu-sign-out" : "desktop-user-menu-sign-out"
            }
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-terracotta-deep hover:bg-canvas-sunken transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Switch user</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
        active
          ? "bg-canvas-sunken text-ink font-medium"
          : "text-ink-muted hover:bg-canvas-sunken hover:text-ink",
      )}
    >
      <Icon
        className={cn("h-4 w-4", active ? "text-gold-deep" : "text-ink-subtle")}
      />
      <span>{item.label}</span>
    </Link>
  );
}
