"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesBetween } from "@/lib/entries";
import {
  computeStreak,
  completionByDate,
  longestStreak,
} from "@/lib/analytics/compute";
import { useActivities } from "@/lib/activities/provider";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO, toISODate, subDays } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { RecentEntries } from "@/components/dashboard/RecentEntries";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { activities, status: activitiesStatus } = useActivities();
  const [entries, setEntries] = useState<DailyEntryRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const rows = await fetchEntriesBetween(
        supabase,
        user.id,
        toISODate(subDays(new Date(), 365)),
        todayISO(),
      );
      setEntries(rows);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    if (!entries) return null;
    const today = todayISO();
    return {
      streak: computeStreak(entries, today),
      best: longestStreak(entries),
      filledToday: entries.some((e) => e.entry_date === today),
      heat: Object.fromEntries(completionByDate(entries, activities)),
      recent: [...entries].reverse().slice(0, 10),
    };
  }, [entries, activities]);

  const loading =
    (!entries && !failed) || activitiesStatus === "loading";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-content">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-content-muted">{t("dashboard.subtitle")}</p>
      </header>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {!loading && failed && (
        <Card>
          <Alert tone="danger">{t("common.error")}</Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={load}>
              {t("common.retry")}
            </Button>
          </div>
        </Card>
      )}

      {!loading && !failed && stats && (
        <>
          <StreakCard
            streak={stats.streak}
            best={stats.best}
            filledToday={stats.filledToday}
          />

          <Card>
            <CardTitle>{t("dashboard.heatmapTitle")}</CardTitle>
            <div className="mt-4">
              <Heatmap data={stats.heat} />
            </div>
          </Card>

          <RecentEntries entries={stats.recent} activities={activities} />
        </>
      )}
    </div>
  );
}
