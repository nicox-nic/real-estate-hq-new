import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Commission KPI Card — the marquee card from the mockup's top row.
 *
 * Composition (per mockup, image 3):
 *   - Top row: label (left, uppercase tracking-wider muted), icon (right, in colored circle)
 *   - Main number: large, color-accented (sage for Total Earned, ink for the rest)
 *   - Optional delta: "↑ 18.6% vs Apr 1 – Apr 30, 2025" — sage if positive
 *   - Optional hint: "46.8% of total earned" — small muted text
 *   - Optional progress bar: thin track with colored fill (sage / gold / terracotta per status)
 *
 * Used 4 times on the main page; the props are tuned to map exactly to the
 * mockup's four cards.
 */

export type CommissionKPIVariant =
  | "total"
  | "paid"
  | "pending"
  | "on-hold";

const variantStyles: Record<
  CommissionKPIVariant,
  {
    iconBg: string;
    iconText: string;
    valueText: string;
    progressFill: string;
  }
> = {
  total: {
    iconBg: "bg-sage-soft/60",
    iconText: "text-sage-deep",
    valueText: "text-sage-deep",
    progressFill: "bg-sage-deep",
  },
  paid: {
    iconBg: "bg-sage-soft/60",
    iconText: "text-sage-deep",
    valueText: "text-ink",
    progressFill: "bg-sage-deep",
  },
  pending: {
    iconBg: "bg-gold-soft/70",
    iconText: "text-gold-deep",
    valueText: "text-ink",
    progressFill: "bg-gold-deep",
  },
  "on-hold": {
    iconBg: "bg-terracotta-soft/60",
    iconText: "text-terracotta-deep",
    valueText: "text-ink",
    progressFill: "bg-terracotta-deep",
  },
};

export interface CommissionKPICardProps {
  variant: CommissionKPIVariant;
  label: string;
  /** Pre-formatted PHP value, e.g. "₱523,750.00". */
  value: string;
  /** Icon to render in the top-right colored circle. */
  icon: React.ReactNode;
  /** Delta string like "18.6% vs Apr 1 – Apr 30, 2025". */
  delta?: { text: string; positive: boolean };
  /** Hint text below the value, e.g. "46.8% of total earned". */
  hint?: string;
  /** Progress bar fill percentage 0–100. */
  progressPct?: number;
  className?: string;
}

export function CommissionKPICard({
  variant,
  label,
  value,
  icon,
  delta,
  hint,
  progressPct,
  className,
}: CommissionKPICardProps) {
  const s = variantStyles[variant];
  return (
    <div
      data-testid={`commission-kpi-${variant}`}
      data-kpi-variant={variant}
      className={cn(
        "rounded-2xl bg-canvas-raised border border-line p-4 sm:p-5 shadow-soft",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
          {label}
        </span>
        <span
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
            s.iconBg,
            s.iconText,
          )}
        >
          {icon}
        </span>
      </header>
      <p
        data-testid={`commission-kpi-${variant}-value`}
        className={cn(
          "font-display text-2xl sm:text-[28px] font-semibold leading-none tabular-nums",
          s.valueText,
        )}
      >
        {value}
      </p>
      {delta ? (
        <p
          data-testid={`commission-kpi-${variant}-delta`}
          className={cn(
            "mt-2 text-xs font-medium inline-flex items-center gap-1",
            delta.positive ? "text-sage-deep" : "text-terracotta-deep",
          )}
        >
          <span aria-hidden>{delta.positive ? "↑" : "↓"}</span>
          {delta.text}
        </p>
      ) : null}
      {hint ? (
        <p
          data-testid={`commission-kpi-${variant}-hint`}
          className="mt-2 text-xs text-ink-muted"
        >
          {hint}
        </p>
      ) : null}
      {progressPct !== undefined ? (
        <div
          data-testid={`commission-kpi-${variant}-progress`}
          data-progress-pct={progressPct}
          className="mt-2 h-1 rounded-full bg-canvas-sunken overflow-hidden"
        >
          <div
            className={cn("h-full rounded-full", s.progressFill)}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
