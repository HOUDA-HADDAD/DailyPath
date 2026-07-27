"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryWeekly } from "@/lib/analytics/compute";
import { useTranslation } from "@/lib/i18n";
import { useChartColors } from "@/lib/theme/chart";
import { categoryLabel } from "@/lib/activities/labels";

export function WeeklyBars({ data }: { data: CategoryWeekly[] }) {
  const { t } = useTranslation();
  const c = useChartColors();

  const chartData = data.map((d) => ({
    name: categoryLabel(d.category, t),
    current: d.current,
    previous: d.previous,
  }));

  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: c.text }}
            interval={0}
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
            cursor={{ fill: c.grid, opacity: 0.35 }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${c.tooltipBorder}`,
              backgroundColor: c.tooltipBg,
              fontSize: 12,
            }}
            labelStyle={{ color: c.text }}
            itemStyle={{ color: c.text }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: c.text }} />
          <Bar
            dataKey="previous"
            name={t("analytics.lastWeek")}
            fill={c.barPrevious}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="current"
            name={t("analytics.thisWeek")}
            fill={c.barCurrent}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
