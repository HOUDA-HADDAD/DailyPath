"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesBetween } from "@/lib/entries";
import { weeklyByCategory } from "@/lib/analytics/compute";
import { useActivities } from "@/lib/activities/provider";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO, toISODate, subDays } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

// Recharts n'est chargé qu'à l'affichage réel d'un graphique : le reste de
// l'application n'en paie pas le coût.
const WeeklyBars = dynamic(
  () => import("@/components/analytics/WeeklyBars").then((m) => m.WeeklyBars),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> },
);

export default function WeeklyPage() {
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
        toISODate(subDays(new Date(), 14)),
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

  const data = useMemo(
    () => (entries ? weeklyByCategory(entries, activities) : []),
    [entries, activities],
  );

  const loading = (!entries && !failed) || activitiesStatus === "loading";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-content">
          {t("analytics.weeklyTitle")}
        </h1>
        <p className="text-sm text-content-muted">
          {t("analytics.weeklySubtitle")}
        </p>
      </header>

      {loading && <SkeletonCard lines={6} />}

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

      {!loading && !failed && entries && (
        <Card>
          <CardTitle>{t("analytics.weeklyChartTitle")}</CardTitle>
          <CardSubtitle>{t("analytics.weeklyChartSubtitle")}</CardSubtitle>
          <div className="mt-4">
            {entries.length === 0 ? (
              <EmptyState
                icon="target"
                title={t("analytics.noData")}
                description={t("analytics.noDataHelp")}
                action={
                  <LinkButton href="/today">{t("analytics.noDataCta")}</LinkButton>
                }
              />
            ) : (
              <WeeklyBars data={data} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
