"use client";

import { useMemo } from "react";
import type { DailyEntryRow } from "@/lib/types";
import {
  rowToFormValues,
  dailyCompletion,
  categoryScoreForDay,
  categoriesFrom,
} from "@/lib/activities";
import { categoryLabel } from "@/lib/activities/labels";
import type { UserActivity } from "@/lib/activities/types";
import { fromISODate } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function RecentEntries({
  entries,
  activities,
}: {
  entries: DailyEntryRow[];
  activities: UserActivity[];
}) {
  const { t, locale } = useTranslation();

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [locale],
  );

  const categories = useMemo(() => categoriesFrom(activities), [activities]);

  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const values = rowToFormValues(entry, activities);
        return {
          id: entry.id,
          date: entry.entry_date,
          percent: Math.round(dailyCompletion(values, activities) * 100),
          categories: categories.map((category) => ({
            id: category,
            percent: Math.round(
              categoryScoreForDay(category, values, activities) * 100,
            ),
          })),
        };
      }),
    [entries, activities, categories],
  );

  return (
    <Card>
      <CardTitle>{t("dashboard.recentTitle")}</CardTitle>

      {rows.length === 0 ? (
        <EmptyState
          icon="clock"
          title={t("dashboard.recentEmpty")}
          description={t("dashboard.recentEmptyHelp")}
          action={
            <LinkButton href="/today">{t("dashboard.recentEmptyCta")}</LinkButton>
          }
        />
      ) : (
        <ul className="mt-3 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-content">
                  {formatter.format(fromISODate(row.date))}
                </span>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {row.percent}%
                </span>
              </div>

              <ProgressBar
                value={row.percent}
                label={t("dashboard.completionLabel")}
                className="h-1.5"
              />

              <div className="flex flex-wrap gap-1.5">
                {row.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-content-muted"
                  >
                    {categoryLabel(category.id, t)} {category.percent}%
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
