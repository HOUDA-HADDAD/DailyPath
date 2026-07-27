"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryScore } from "@/lib/analytics/compute";
import { useTranslation } from "@/lib/i18n";
import { useChartColors, breakdownBucket } from "@/lib/theme/chart";
import { categoryLabel } from "@/lib/activities/labels";

export function CategoryBreakdown({ data }: { data: CategoryScore[] }) {
  const { t } = useTranslation();
  const c = useChartColors();

  const chartData = data.map((d) => ({
    name: categoryLabel(d.category, t),
    value: d.value,
  }));

  return (
    <div dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: c.text }}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 11, fill: c.text }}
            tickLine={false}
            axisLine={false}
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
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={c.breakdown[breakdownBucket(d.value)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
