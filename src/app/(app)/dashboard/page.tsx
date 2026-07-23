"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesBetween } from "@/lib/entries";
import { computeStreak, completionByDate } from "@/lib/analytics/compute";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO, toISODate, subDays } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle } from "@/components/ui/Card";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { RecentEntries } from "@/components/dashboard/RecentEntries";

export default function DashboardPage() {
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

  if (!entries) {
    return <p className="text-sm text-content-muted">{t("common.loading")}</p>;
  }

  const streak = computeStreak(entries);
  const heat = Object.fromEntries(completionByDate(entries));
  const recent = [...entries].reverse().slice(0, 10);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-content">
        {t("dashboard.title")}
      </h1>

      <StreakCard streak={streak} />

      <Card>
        <CardTitle>{t("dashboard.heatmapTitle")}</CardTitle>
        <div className="mt-4">
          <Heatmap data={heat} />
        </div>
      </Card>

      <RecentEntries entries={recent} />
    </div>
  );
}
