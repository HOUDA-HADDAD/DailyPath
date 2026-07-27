"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesBetween } from "@/lib/entries";
import { monthlyTrend, yearlyByCategory } from "@/lib/analytics/compute";
import { useActivities } from "@/lib/activities/provider";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO, toISODate, subDays } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

const YearlyTrend = dynamic(
  () => import("@/components/analytics/YearlyTrend").then((m) => m.YearlyTrend),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> },
);
const CategoryBreakdown = dynamic(
  () =>
    import("@/components/analytics/CategoryBreakdown").then(
      (m) => m.CategoryBreakdown,
    ),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> },
);

export default function YearlyPage() {
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

  const trend = useMemo(
    () => (entries ? monthlyTrend(entries, activities) : []),
    [entries, activities],
  );
  const breakdown = useMemo(
    () => (entries ? yearlyByCategory(entries, activities) : []),
    [entries, activities],
  );

  const loading = (!entries && !failed) || activitiesStatus === "loading";
  const hasData = !!entries && entries.length > 0;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-content">
          {t("analytics.yearlyTitle")}
        </h1>
        <p className="text-sm text-content-muted">
          {t("analytics.yearlySubtitle")}
        </p>
      </header>

      {loading && (
        <>
          <SkeletonCard lines={6} />
          <SkeletonCard lines={6} />
        </>
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

      {!loading && !failed && !hasData && (
        <Card>
          <EmptyState
            icon="target"
            title={t("analytics.noData")}
            description={t("analytics.noDataHelp")}
            action={
              <LinkButton href="/today">{t("analytics.noDataCta")}</LinkButton>
            }
          />
        </Card>
      )}

      {!loading && !failed && hasData && (
        <>
          <Card>
            <CardTitle>{t("analytics.trendTitle")}</CardTitle>
            <CardSubtitle>{t("analytics.trendSubtitle")}</CardSubtitle>
            <div className="mt-4">
              <YearlyTrend points={trend} />
            </div>
          </Card>

          <Card>
            <CardTitle>{t("analytics.breakdownTitle")}</CardTitle>
            <CardSubtitle>{t("analytics.breakdownSubtitle")}</CardSubtitle>
            <div className="mt-4">
              <CategoryBreakdown data={breakdown} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
