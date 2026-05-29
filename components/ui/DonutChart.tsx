"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";

export interface DonutSegment {
  /** Display label for the segment. */
  label: string;
  /** Raw value — used both for slice area and for the legend numeric. */
  value: number;
  /** Tailwind-friendly stroke / fill color. Pass a CSS color string. */
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Inner content of the donut hole — usually a big number plus a small label. */
  centerLabel?: string;
  centerValue?: React.ReactNode;
  /** Sets the chart's intrinsic size. Defaults to 180. */
  size?: number;
  /** Thickness of the ring. */
  thickness?: number;
  className?: string;
}

/**
 * Brand-tinted donut chart wrapper around Recharts' PieChart.
 *
 * Used by:
 *   - Agent Dashboard's Money on the Way card (Session 3A)
 *   - Commission Tracking's breakdown card (Session 6)
 *
 * Built with a ResponsiveContainer so it scales with its parent — keeps the
 * Recharts SVG crisp on mobile while staying lightweight.
 */
export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  size = 180,
  thickness = 22,
  className,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  // Recharts treats values literally; if total is 0 we want a single muted ring,
  // not a blank chart, so we fall back to a single placeholder segment.
  const displaySegments =
    total === 0
      ? [{ label: "Empty", value: 1, color: "#E8E3D8" }]
      : segments;

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displaySegments}
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2 - 2}
            paddingAngle={total === 0 ? 0 : 2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {displaySegments.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue !== undefined) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {centerValue !== undefined ? (
            <div className="font-display text-2xl font-semibold text-ink leading-none">
              {centerValue}
            </div>
          ) : null}
          {centerLabel ? (
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
              {centerLabel}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Legend row for a donut segment. Render below or beside the chart.
 *
 * Pass either:
 *   - `formattedValues`: an array of pre-formatted strings, parallel to segments
 *   - or nothing — the legend will render raw numbers via toLocaleString.
 *
 * We don't accept a formatter function because RSC boundaries forbid passing
 * functions from server components to client components. Calling sites
 * pre-format values on the server (e.g. with formatPHPCompact) and pass them
 * here as strings.
 */
export function DonutLegend({
  segments,
  className,
  formattedValues,
}: {
  segments: DonutSegment[];
  className?: string;
  formattedValues?: string[];
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {segments.map((s, i) => (
        <li
          key={s.label}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-ink truncate">{s.label}</span>
          </span>
          <span className="text-ink-muted shrink-0 tabular-nums">
            {formattedValues?.[i] ?? s.value.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
