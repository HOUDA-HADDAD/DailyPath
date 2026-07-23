"use client";

import type { DailyEntryRow } from "@/lib/types";
import {
  rowToFormValues,
  dailyCompletion,
  categoryScoreForDay,
  orderedCategories,
} from "@/lib/activities";
import { fromISODate } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle } from "@/components/ui/Card";

export function RecentEntries({ entries }: { entries: DailyEntryRow[] }) {
  const { t, locale } = useTranslation();

  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <Card>
      <CardTitle>{t("dashboard.recentTitle")}</CardTitle>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-content-muted">
          {t("dashboard.recentEmpty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {entries.map((e) => {
            const values = rowToFormValues(e);
            const pct = Math.round(dailyCompletion(values) * 100);
            return (
              <li key={e.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-content">
                    {fmt.format(fromISODate(e.entry_date))}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {orderedCategories().map((c) => {
                    const cp = Math.round(
                      categoryScoreForDay(c.id, values) * 100,
                    );
                    return (
                      <span
                        key={c.id}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-content-muted"
                      >
                        {t(`categories.${c.id}`)} {cp}%
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
