// Résolution des libellés : un libellé personnalisé prime toujours sur la
// traduction ; sinon on tente la clé i18n ; sinon on retombe sur la valeur
// brute (cas d'une activité créée par l'utilisateur, non traduite).

import type { UserActivity } from "./types";

type Translate = (key: string) => string;

/** Traduit `key` ; renvoie `fallback` si la clé n'existe pas. */
function translateOr(t: Translate, key: string, fallback: string): string {
  const value = t(key);
  return value === key ? fallback : value;
}

export function activityLabel(activity: UserActivity, t: Translate): string {
  if (activity.label && activity.label.trim()) return activity.label;
  return translateOr(t, `activities.${activity.id}`, activity.id);
}

export function activityNote(activity: UserActivity, t: Translate): string {
  if (activity.note && activity.note.trim()) return activity.note;
  return translateOr(t, `notes.${activity.id}`, "");
}

export function optionLabel(option: string, t: Translate): string {
  return translateOr(t, `options.${option}`, option);
}

export function categoryLabel(category: string, t: Translate): string {
  return translateOr(t, `categories.${category}`, category);
}
