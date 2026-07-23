"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchEntryByDate } from "@/lib/entries";
import { emptyFormValues, rowToFormValues } from "@/lib/activities";
import type { FormValues } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { DailyForm } from "@/components/form/DailyForm";

export default function TodayPage() {
  const { t, locale } = useTranslation();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | {
        status: "ready";
        userId: string;
        dateISO: string;
        values: FormValues;
        isExisting: boolean;
      }
  >({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const dateISO = todayISO(); // jour local de l'appareil
        const row = await fetchEntryByDate(supabase, user.id, dateISO);
        if (!active) return;

        setState({
          status: "ready",
          userId: user.id,
          dateISO,
          values: row ? rowToFormValues(row) : emptyFormValues(),
          isExisting: !!row,
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-content">
          {t("form.todayTitle")}
        </h1>
        <p className="text-sm text-content-muted">{dateLabel}</p>
      </div>

      {state.status === "loading" && (
        <p className="text-sm text-content-muted">{t("common.loading")}</p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-danger">{t("common.error")}</p>
      )}
      {state.status === "ready" && (
        <DailyForm
          userId={state.userId}
          dateISO={state.dateISO}
          initialValues={state.values}
          isExisting={state.isExisting}
        />
      )}
    </div>
  );
}
