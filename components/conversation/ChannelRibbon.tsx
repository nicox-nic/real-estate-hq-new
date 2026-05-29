import {
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  Globe,
  HelpCircle,
} from "lucide-react";
import type { LeadSource } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Channel ribbon — small visual identifier for the messaging channel a
 * conversation lives on. Driven by the lead's source field for now (the
 * conversation channel and the lead source coincide in the seed data;
 * a future MessageChannel field would refine this).
 *
 * Per PRD: Messenger / WhatsApp / Instagram DM / SMS / Email. Sources
 * outside those (lead-ad forms, website forms, manual entry, etc.) fall
 * back to a neutral "Direct" tag.
 */
export function ChannelRibbon({
  source,
  className,
}: {
  source: LeadSource;
  className?: string;
}) {
  const { label, icon: Icon, tint } = channelVisual(source);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        tint,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function channelVisual(source: LeadSource): {
  label: string;
  icon: typeof MessageCircle;
  tint: string;
} {
  switch (source) {
    case "Messenger":
      return {
        label: "Messenger",
        icon: MessageCircle,
        tint: "bg-navy-soft/40 text-navy border-navy/20",
      };
    case "WhatsApp":
      return {
        label: "WhatsApp",
        icon: MessageCircle,
        tint: "bg-sage-soft text-sage-deep border-sage/30",
      };
    case "Instagram DM":
    case "Instagram Lead Ads":
      return {
        label: "Instagram",
        icon: Instagram,
        tint:
          "bg-terracotta-soft text-terracotta-deep border-terracotta/30",
      };
    case "SMS":
      return {
        label: "SMS",
        icon: Phone,
        tint: "bg-canvas-sunken text-ink-muted border-line",
      };
    case "Email":
      return {
        label: "Email",
        icon: Mail,
        tint: "bg-canvas-sunken text-ink-muted border-line",
      };
    case "Website Forms":
    case "Landing Pages":
    case "QR Codes":
      return {
        label: "Direct",
        icon: Globe,
        tint: "bg-canvas-sunken text-ink-muted border-line",
      };
    default:
      return {
        label: source,
        icon: HelpCircle,
        tint: "bg-canvas-sunken text-ink-muted border-line",
      };
  }
}
