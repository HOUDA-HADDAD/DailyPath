// Scoring générique, piloté par la configuration des activités.
// Aucune activité n'est "codée en dur" ici : tout dérive de config.ts.

import type { FormValues, ActivityValue } from "@/lib/types";
import {
  ACTIVITIES,
  completionActivities,
  activitiesByCategory,
  type ActivityConfig,
} from "./config";

/**
 * Score d'une activité pour une valeur donnée, entre 0 et 1.
 * Renvoie `null` si l'activité n'a pas été renseignée (non applicable).
 */
export function activityScore(
  activity: ActivityConfig,
  value: ActivityValue,
): number | null {
  switch (activity.type) {
    case "multi_checkbox": {
      if (!Array.isArray(value)) return null;
      const total = activity.options?.length ?? 0;
      if (total === 0) return null;
      return value.length / total;
    }
    case "scale": {
      if (typeof value !== "string") return null;
      const opt = activity.scale?.find((o) => o.value === value);
      return opt ? opt.score : 0;
    }
    case "boolean": {
      if (typeof value !== "boolean") return null;
      return value ? 1 : 0;
    }
    default:
      return null;
  }
}

/**
 * Taux de complétion quotidien global (0..1), pondéré, sur les activités
 * marquées countsInCompletion. Une valeur non renseignée compte comme 0.
 */
export function dailyCompletion(values: FormValues): number {
  const acts = completionActivities();
  const totalWeight = acts.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return 0;

  const sum = acts.reduce((s, a) => {
    const score = activityScore(a, values[a.id]) ?? 0;
    return s + score * a.weight;
  }, 0);

  return sum / totalWeight;
}

/**
 * Score d'une catégorie pour une journée (0..1), moyenne pondérée des
 * activités de la catégorie (valeur non renseignée = 0).
 */
export function categoryScoreForDay(
  categoryId: string,
  values: FormValues,
): number {
  const acts = activitiesByCategory(categoryId);
  const totalWeight = acts.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return 0;

  const sum = acts.reduce((s, a) => {
    const score = activityScore(a, values[a.id]) ?? 0;
    return s + score * a.weight;
  }, 0);

  return sum / totalWeight;
}

/** Score d'une activité précise pour une journée (0..1, null si non renseignée). */
export function activityScoreForDay(
  activityId: string,
  values: FormValues,
): number | null {
  const activity = ACTIVITIES.find((a) => a.id === activityId);
  if (!activity) return null;
  return activityScore(activity, values[activityId]);
}
