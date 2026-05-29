"use client";

import * as React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/cn";

export interface LineChartDatum {
  /** X-axis label (e.g. period name, date). */
  label: string;
  /** Y value. */
  value: number;
}

interface LineChartProps {
  data: LineChartDatum[];
  height?: number;
  color?: string;
  /** Render filled area underneath the line. */
  filled?: boolean;
  /** Hide grid + axis ticks for sparkline look. */
  minimal?: boolean;
  valueFormatter?: (n: number) => string;
  className?: string;
  "data-testid"?: string;
}

/**
 * Brand-tinted line chart wrapper around Recharts.
 *
 * Used by:
 *   - Manager Analytics: Lead volume over time (Session 8A)
 *
 * If a second caller emerges, the wrapper earns Rule of Three already
 * (with BarChart + DonutChart in the same session). For now built
 * because LineChart is the natural shape for "over time" data, and
 * inlining Recharts components on the Analytics page would violate
 * the cross-file invariant Section 21 asserts.
 */
export function LineChart({
  data,
  height = 200,
  color = "#5B7A5A",
  filled = false,
  minimal = false,
  valueFormatter,
  className,
  ...rest
}: LineChartProps) {
  if (filled) {
    return (
      <div
        className={cn("w-full", className)}
        style={{ height }}
        data-testid={rest["data-testid"]}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
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
            <defs>
              <linearGradient id="lineFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#lineFillGradient)"
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div
      className={cn("w-full", className)}
      style={{ height }}
      data-testid={rest["data-testid"]}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
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
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
