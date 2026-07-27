"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchEntryByDate } from "@/lib/entries";
import { emptyFormValues, rowToFormValues } from "@/lib/activities";
import { activitiesForDate } from "@/lib/activities/recurrence";
import { useActivities } from "@/lib/activities/provider";
import type { DailyEntryRow } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { DailyForm } from "@/components/form/DailyForm";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type EntryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; userId: string; entry: DailyEntryRow | null };

export default function TodayPage() {
  const { t, locale } = useTranslation();
  const { activities, status: activitiesStatus, refresh } = useActivities();
  const [state, setState] = useState<EntryState>({ status: "loading" });

  const dateISO = useMemo(() => todayISO(), []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const entry = await fetchEntryByDate(supabase, user.id, dateISO);
        if (!active) return;
        setState({ status: "ready", userId: user.id, entry });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, [dateISO]);

  /** Activités actives ET programmées aujourd'hui. */
  const todayActivities = useMemo(
    () => activitiesForDate(activities, dateISO),
    [activities, dateISO],
  );

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [locale],
  );

  const loading = state.status === "loading" || activitiesStatus === "loading";
  const failed = state.status === "error" || activitiesStatus === "error";

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-content">
          {t("form.todayTitle")}
        </h1>
        <p className="text-sm text-content-muted">{dateLabel}</p>
      </header>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      )}

      {!loading && failed && (
        <Card>
          <Alert tone="danger">{t("common.error")}</Alert>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => refresh()}>
              {t("common.retry")}
            </Button>
          </div>
        </Card>
      )}

      {!loading && !failed && state.status === "ready" && (
        <>
          {todayActivities.length === 0 ? (
            <Card>
              <EmptyState
                icon="target"
                title={t("form.emptyTitle")}
                description={t("form.emptyDescription")}
                action={
                  <LinkButton href="/profile/settings">
                    {t("form.emptyCta")}
                  </LinkButton>
                }
              />
            </Card>
          ) : (
            <DailyForm
              key={todayActivities.map((a) => a.id).join("|")}
              userId={state.userId}
              dateISO={dateISO}
              activities={todayActivities}
              initialValues={
                state.entry
                  ? rowToFormValues(state.entry, todayActivities)
                  : emptyFormValues(todayActivities)
              }
              existingResponses={
                (state.entry?.responses as Record<string, unknown>) ?? {}
              }
              isExisting={!!state.entry}
            />
          )}
        </>
      )}
    </div>
  );
}
