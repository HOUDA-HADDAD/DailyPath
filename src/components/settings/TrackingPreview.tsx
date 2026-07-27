"use client";

import { useMemo } from "react";
import { useActivities } from "@/lib/activities/provider";
import { activitiesForDate } from "@/lib/activities/recurrence";
import { activityLabel } from "@/lib/activities/labels";
import { todayISO } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { accentFor } from "@/lib/theme/accent";
import { cn } from "@/lib/cn";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

/**
 * Aperçu en direct de ce que « Aujourd'hui » affichera : l'utilisateur voit
 * immédiatement le résultat de ses réglages, sans changer d'écran.
 */
export function TrackingPreview() {
  const { t } = useTranslation();
  const { activities } = useActivities();
  const dateISO = useMemo(() => todayISO(), []);

  const scheduled = useMemo(
    () => activitiesForDate(activities, dateISO),
    [activities, dateISO],
  );

  return (
    <Card>
      <CardTitle>{t("settings.previewTitle")}</CardTitle>
      <CardSubtitle>
        {t("settings.previewSubtitle", { count: scheduled.length })}
      </CardSubtitle>

      {scheduled.length === 0 ? (
        <p className="mt-4 text-sm text-content-muted">
          {t("settings.previewEmpty")}
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {scheduled.map((activity) => {
            const accent = accentFor(activity.color);
            return (
              <li
                key={activity.rowId ?? activity.id}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    accent.badge,
                  )}
                >
                  <Icon name={activity.icon} className="h-3 w-3" />
                </span>
                <span className="text-xs text-content">
                  {activityLabel(activity, t)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
