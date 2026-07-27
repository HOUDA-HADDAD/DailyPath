// Scoring générique, piloté par la liste d'activités fournie.
// Aucune activité n'est « codée en dur » : les fonctions acceptent la liste
// dynamique de l'utilisateur, et retombent sur le catalogue par défaut si
// aucune liste n'est fournie (compatibilité ascendante).

import type { FormValues, ActivityValue } from "@/lib/types";
import { ACTIVITIES, CATEGORIES, type ActivityConfig } from "./config";

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

/** Moyenne pondérée d'un sous-ensemble d'activités (valeur absente = 0). */
function weightedMean(
  activities: ActivityConfig[],
  values: FormValues,
): number {
  const totalWeight = activities.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return 0;
  const sum = activities.reduce((s, a) => {
    const score = activityScore(a, values[a.id]) ?? 0;
    return s + score * a.weight;
  }, 0);
  return sum / totalWeight;
}

/**
 * Taux de complétion quotidien global (0..1), pondéré, sur les activités
 * marquées countsInCompletion.
 */
export function dailyCompletion(
  values: FormValues,
  activities: ActivityConfig[] = ACTIVITIES,
): number {
  return weightedMean(
    activities.filter((a) => a.countsInCompletion),
    values,
  );
}

/** Score d'une catégorie pour une journée (0..1). */
export function categoryScoreForDay(
  categoryId: string,
  values: FormValues,
  activities: ActivityConfig[] = ACTIVITIES,
): number {
  return weightedMean(
    activities.filter((a) => a.category === categoryId),
    values,
  );
}

/**
 * Catégories réellement présentes dans une liste d'activités, ordonnées :
 * d'abord celles du catalogue (dans leur ordre défini), puis les catégories
 * personnalisées par ordre alphabétique.
 */
export function categoriesFrom(
  activities: ActivityConfig[] = ACTIVITIES,
): string[] {
  const present = new Set(activities.map((a) => a.category));
  const known = [...CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((c) => c.id)
    .filter((id) => present.has(id));
  const custom = [...present].filter((id) => !known.includes(id)).sort();
  return [...known, ...custom];
}
