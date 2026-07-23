"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesBetween } from "@/lib/entries";
import { monthlyTrend, yearlyByCategory } from "@/lib/analytics/compute";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO, toISODate, subDays } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { YearlyTrend } from "@/components/analytics/YearlyTrend";
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown";

export default function YearlyPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<DailyEntryRow[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const to = todayISO();
      const from = toISODate(subDays(new Date(), 365));
      const rows = await fetchEntriesBetween(supabase, user.id, from, to);
      if (active) setEntries(rows);
    })();
    return () => {
      active = false;
    };
  }, []);

  const hasData = entries && entries.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-content">
        {t("analytics.yearlyTitle")}
      </h1>

      <Card>
        <CardTitle>{t("analytics.trendTitle")}</CardTitle>
        <CardSubtitle>{t("analytics.trendSubtitle")}</CardSubtitle>
        <div className="mt-4">
          {!entries ? (
            <p className="text-sm text-content-muted">{t("common.loading")}</p>
          ) : !hasData ? (
            <p className="text-sm text-content-muted">{t("analytics.noData")}</p>
          ) : (
            <YearlyTrend points={monthlyTrend(entries)} />
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>{t("analytics.breakdownTitle")}</CardTitle>
        <CardSubtitle>{t("analytics.breakdownSubtitle")}</CardSubtitle>
        <div className="mt-4">
          {!entries ? (
            <p className="text-sm text-content-muted">{t("common.loading")}</p>
          ) : !hasData ? (
            <p className="text-sm text-content-muted">{t("analytics.noData")}</p>
          ) : (
            <CategoryBreakdown data={yearlyByCategory(entries)} />
          )}
        </div>
      </Card>
    </div>
  );
}
