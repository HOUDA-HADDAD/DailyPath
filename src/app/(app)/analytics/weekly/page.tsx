"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesBetween } from "@/lib/entries";
import { weeklyByCategory } from "@/lib/analytics/compute";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO, toISODate, subDays } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { WeeklyBars } from "@/components/analytics/WeeklyBars";

export default function WeeklyPage() {
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
      const from = toISODate(subDays(new Date(), 14));
      const rows = await fetchEntriesBetween(supabase, user.id, from, to);
      if (active) setEntries(rows);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-content">
        {t("analytics.weeklyTitle")}
      </h1>

      <Card>
        <CardTitle>{t("analytics.weeklyTitle")}</CardTitle>
        <CardSubtitle>{t("analytics.weeklySubtitle")}</CardSubtitle>
        <div className="mt-4">
          {!entries ? (
            <p className="text-sm text-content-muted">{t("common.loading")}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-content-muted">{t("analytics.noData")}</p>
          ) : (
            <WeeklyBars data={weeklyByCategory(entries)} />
          )}
        </div>
      </Card>
    </div>
  );
}
