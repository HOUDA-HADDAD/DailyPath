"use client";

import { useEffect } from "react";
import { useActivities } from "@/lib/activities/provider";
import { activitiesForDate } from "@/lib/activities/recurrence";
import { activityLabel } from "@/lib/activities/labels";
import { useTranslation } from "@/lib/i18n";
import { todayISO } from "@/lib/dates";
import {
  alreadyNotified,
  markNotified,
  notificationPermission,
  showReminder,
} from "@/lib/reminders/notifications";

const CHECK_INTERVAL_MS = 60_000;

/**
 * Déclenche les rappels configurés pendant que l'application est ouverte.
 * Composant sans rendu : il se contente d'observer l'heure.
 */
export function RemindersRunner() {
  const { activities } = useActivities();
  const { t } = useTranslation();

  useEffect(() => {
    if (notificationPermission() !== "granted") return;

    function check() {
      const dateISO = todayISO();
      const now = new Date();
      const minutesNow = now.getHours() * 60 + now.getMinutes();

      for (const activity of activitiesForDate(activities, dateISO)) {
        if (!activity.reminderEnabled || !activity.reminderTime) continue;
        if (alreadyNotified(dateISO, activity.id)) continue;

        const [hours, minutes] = activity.reminderTime.split(":").map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

        // Fenêtre de déclenchement : de l'heure prévue jusqu'à 30 min après,
        // pour ne pas rappeler à contretemps si l'onglet vient d'être ouvert.
        const target = hours * 60 + minutes;
        if (minutesNow >= target && minutesNow - target <= 30) {
          showReminder(t("common.appName"), activityLabel(activity, t));
          markNotified(dateISO, activity.id);
        }
      }
    }

    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activities, t]);

  return null;
}
