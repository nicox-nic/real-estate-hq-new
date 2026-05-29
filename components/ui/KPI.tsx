import * as React from "react";
import { cn } from "@/lib/cn";

interface KPIProps {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  /** Accent color tag. Defaults to ink. */
  accent?: "ink" | "gold" | "sage" | "navy" | "terracotta";
  className?: string;
}

const accentClasses: Record<NonNullable<KPIProps["accent"]>, string> = {
  ink: "text-ink",
  gold: "text-gold-deep",
  sage: "text-sage-deep",
  navy: "text-navy",
  terracotta: "text-terracotta-deep",
};

export function KPI({
  label,
  value,
  delta,
  hint,
  accent = "ink",
  className,
}: KPIProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-canvas-raised border border-line p-5 shadow-soft",
        className,
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold", accentClasses[accent])}>
        {value}
      </div>
      {delta ? (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            delta.positive ? "text-sage-deep" : "text-terracotta-deep",
          )}
        >
          {delta.positive ? "▲" : "▼"} {delta.value}
        </div>
      ) : null}
      {hint ? <div className="mt-1 text-xs text-ink-muted">{hint}</div> : null}
    </div>
  );
}
