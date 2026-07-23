"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthPoint } from "@/lib/analytics/compute";
import { useTranslation } from "@/lib/i18n";
import { useChartColors } from "@/lib/theme/chart";

export function YearlyTrend({ points }: { points: MonthPoint[] }) {
  const { t, dict } = useTranslation();
  const c = useChartColors();
  const months = dict.analytics.months;

  const chartData = points.map((p) => ({
    name: months[p.monthIndex],
    value: p.value, // peut être null -> trou dans la courbe
  }));

  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.areaStop} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.areaStop} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: c.text }}
            tickLine={false}
            axisLine={{ stroke: c.grid }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: c.text }}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            formatter={(value) => `${value}%`}
            labelFormatter={(l) => `${t("analytics.overall")} · ${l}`}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${c.tooltipBorder}`,
              backgroundColor: c.tooltipBg,
              fontSize: 12,
            }}
            labelStyle={{ color: c.text }}
            itemStyle={{ color: c.text }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={c.line}
            strokeWidth={2}
            fill="url(#trendFill)"
            connectNulls={false}
            dot={{ r: 3, fill: c.line }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
