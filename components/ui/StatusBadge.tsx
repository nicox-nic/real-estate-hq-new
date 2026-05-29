import * as React from "react";
import { cn } from "@/lib/cn";

type Variant =
  | "neutral"
  | "hot"
  | "warm"
  | "nurture"
  | "cold"
  | "paid"
  | "for-closing"
  | "for-payout"
  | "for-approval"
  | "on-hold"
  | "verified"
  | "pending"
  | "rejected";

const variantClasses: Record<Variant, string> = {
  neutral: "bg-canvas-sunken text-ink-muted border-line",
  hot: "bg-terracotta-soft text-terracotta-deep border-terracotta/30",
  warm: "bg-gold-soft text-gold-deep border-gold/30",
  nurture: "bg-navy-soft text-navy border-navy/30",
  cold: "bg-canvas-sunken text-ink-muted border-line",
  paid: "bg-sage-soft text-sage-deep border-sage/30",
  "for-closing": "bg-navy-soft text-navy border-navy/30",
  "for-payout": "bg-gold-soft text-gold-deep border-gold/30",
  "for-approval": "bg-canvas-sunken text-ink-muted border-line",
  "on-hold": "bg-terracotta-soft text-terracotta-deep border-terracotta/30",
  verified: "bg-sage-soft text-sage-deep border-sage/30",
  pending: "bg-gold-soft text-gold-deep border-gold/30",
  rejected: "bg-terracotta-soft text-terracotta-deep border-terracotta/30",
};

interface StatusBadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  variant = "neutral",
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
