"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/cn";

export interface BarChartDatum {
  /** X-axis label (e.g. period name, category). */
  label: string;
  /** Bar value (positive number). */
  value: number;
  /** Optional bar color override. */
  color?: string;
}

interface BarChartProps {
  data: BarChartDatum[];
  /** Height in pixels. Default 200. */
  height?: number;
  /** Default bar color when datum has no color. */
  defaultColor?: string;
  /** Hide grid + axis ticks for a minimal "sparkbar" look. */
  minimal?: boolean;
  /** Pre-formatted Y-axis value formatter (defaults to identity). */
  valueFormatter?: (n: number) => string;
  className?: string;
  /** Test-id for verify lock. */
  "data-testid"?: string;
}

/**
 * Brand-tinted bar chart wrapper around Recharts' BarChart.
 *
 * Used by:
 *   - Manager Analytics: Response time distribution (Session 8A)
 *   - Manager Analytics: Conversion rate by stage (Session 8A)
 *   - Manager Analytics: Lead volume by week (Session 8A)
 *
 * Rule of Three earned in a single session — extraction justified at
 * the point of construction because three callers already exist on the
 * same surface.
 */
export function BarChart({
  data,
  height = 200,
  defaultColor = "#5B7A5A",
  minimal = false,
  valueFormatter,
  className,
  ...rest
}: BarChartProps) {
  return (
    <div
      className={cn("w-full", className)}
      style={{ height }}
      data-testid={rest["data-testid"]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
        >
          {!minimal ? (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8E3D8"
              vertical={false}
            />
          ) : null}
          <XAxis
            dataKey="label"
            stroke="#A8A29E"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={!minimal}
          />
          <YAxis
            stroke="#A8A29E"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={!minimal}
            tickFormatter={
              valueFormatter ? (v: number) => valueFormatter(v) : undefined
            }
          />
          <Tooltip
            cursor={{ fill: "#F5F0E5", opacity: 0.5 }}
            contentStyle={{
              backgroundColor: "#FBF8F1",
              border: "1px solid #E8E3D8",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={
              valueFormatter
                ? (v: number) => [valueFormatter(v), ""] as [string, string]
                : undefined
            }
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? defaultColor} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
