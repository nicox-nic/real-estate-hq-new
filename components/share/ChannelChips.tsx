"use client";

import {
  Facebook,
  Send,
  MessageCircle,
  Mail,
  MoreHorizontal,
  Instagram,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { ShareChannel } from "@/lib/types";

/**
 * Channel selector for the Share Listing page.
 *
 * Per the mockup (image 1): Messenger / WhatsApp / Instagram DM / SMS /
 * Email / More — 6 chips in a horizontal row. Selected channel gets a
 * filled brand-aware visual; others stay neutral.
 */

interface ChannelVisual {
  Icon: LucideIcon;
  /** Tailwind classes for the SELECTED state (icon + bg). */
  activeClass: string;
  /** Tailwind classes for the INACTIVE state. */
  inactiveClass: string;
}

const VISUALS: Record<ShareChannel | "More", ChannelVisual> = {
  Messenger: {
    Icon: Facebook,
    activeClass: "bg-[#0084FF] text-white",
    inactiveClass: "bg-canvas-sunken text-[#0084FF]",
  },
  WhatsApp: {
    Icon: MessageCircle,
    activeClass: "bg-[#25D366] text-white",
    inactiveClass: "bg-canvas-sunken text-[#25D366]",
  },
  "Instagram DM": {
    Icon: Instagram,
    activeClass:
      "bg-gradient-to-tr from-[#FFD600] via-[#FF7A00] to-[#D300C5] text-white",
    inactiveClass: "bg-canvas-sunken text-[#D300C5]",
  },
  SMS: {
    Icon: Phone,
    activeClass: "bg-sage-deep text-canvas-raised",
    inactiveClass: "bg-canvas-sunken text-sage-deep",
  },
  Email: {
    Icon: Mail,
    activeClass: "bg-ink text-canvas-raised",
    inactiveClass: "bg-canvas-sunken text-ink-muted",
  },
  More: {
    Icon: MoreHorizontal,
    activeClass: "bg-ink text-canvas-raised",
    inactiveClass: "bg-canvas-sunken text-ink-muted",
  },
  // Not shown in chip set but typed for completeness
  "Smart Link": {
    Icon: Send,
    activeClass: "bg-gold-deep text-canvas-raised",
    inactiveClass: "bg-canvas-sunken text-gold-deep",
  },
  "QR Code": {
    Icon: Send,
    activeClass: "bg-gold-deep text-canvas-raised",
    inactiveClass: "bg-canvas-sunken text-gold-deep",
  },
};

export function channelVisualFor(c: ShareChannel | "More"): ChannelVisual {
  return VISUALS[c];
}

/** The chip set rendered in the row, in PRD/mockup order. */
export const CHANNELS: Array<ShareChannel | "More"> = [
  "Messenger",
  "WhatsApp",
  "Instagram DM",
  "SMS",
  "Email",
  "More",
];

export function ChannelChips({
  selected,
  onSelect,
}: {
  selected: ShareChannel;
  onSelect: (c: ShareChannel) => void;
}) {
  return (
    <div
      data-testid="share-channel-row"
      data-channel-count={CHANNELS.length}
      className="flex items-start gap-2.5 sm:gap-3 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none"
    >
      {CHANNELS.map((c) => {
        const visual = VISUALS[c];
        const active = c === selected;
        return (
          <button
            key={c}
            onClick={() => {
              if (c === "More") {
                // No-op for prototype; the channel set is what it is.
                alert("Additional channels (Viber, Telegram, Copy link) — Session 5B");
                return;
              }
              onSelect(c);
            }}
            data-testid={`channel-chip-${c.replace(/\s+/g, "-").toLowerCase()}`}
            data-active={active}
            className={cn(
              "shrink-0 flex flex-col items-center gap-1 group",
            )}
          >
            <span
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors border",
                active
                  ? visual.activeClass + " border-transparent shadow-soft"
                  : visual.inactiveClass + " border-line",
              )}
            >
              <visual.Icon className="h-5 w-5" />
            </span>
            <span
              className={cn(
                "text-[10px] font-medium",
                active ? "text-ink" : "text-ink-muted",
              )}
            >
              {c}
            </span>
          </button>
        );
      })}
    </div>
  );
}
