// Planification : quelles activités sont dues un jour donné.

import { fromISODate } from "@/lib/dates";
import type { Recurrence, UserActivity } from "./types";

/** L'activité est-elle programmée à cette date ? */
export function isScheduledOn(recurrence: Recurrence, dateISO: string): boolean {
  if (recurrence.kind === "daily") return true;
  // weekly : aucun jour coché = jamais programmée (évite un formulaire fantôme)
  if (recurrence.days.length === 0) return false;
  return recurrence.days.includes(fromISODate(dateISO).getDay());
}

/**
 * Activités à afficher/compter pour une date : activées ET programmées ce
 * jour-là, triées par ordre d'affichage.
 */
export function activitiesForDate(
  activities: UserActivity[],
  dateISO: string,
): UserActivity[] {
  return activities
    .filter((a) => a.enabled && isScheduledOn(a.recurrence, dateISO))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Libellé court d'une récurrence, pour les résumés ('daily' | 'weekly'). */
export function recurrenceSummaryKey(recurrence: Recurrence): string {
  return recurrence.kind === "daily"
    ? "settings.recurrenceDaily"
    : "settings.recurrenceWeekly";
}
