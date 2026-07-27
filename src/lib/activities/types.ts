// Types du catalogue d'activités personnalisables.
//
// Point clé d'architecture : `UserActivity` ÉTEND `ActivityConfig`. Tout le
// moteur existant (serialization, scoring, analytics) accepte donc une
// UserActivity sans la moindre modification — seule la LISTE devient dynamique.

import type { ActivityConfig, ActivityType, ScaleOption, StorageMap } from "./config";

/** Icônes disponibles (rendues par <Icon />, aucune dépendance externe). */
export const ACTIVITY_ICONS = [
  "sparkles",
  "moon",
  "sun",
  "book",
  "bookmark",
  "heart",
  "star",
  "run",
  "dumbbell",
  "leaf",
  "drop",
  "flame",
  "check",
  "clock",
  "bell",
  "target",
] as const;
export type ActivityIcon = (typeof ACTIVITY_ICONS)[number];

/** Accents disponibles (tokens du design system, compatibles clair/sombre). */
export const ACTIVITY_COLORS = [
  "primary",
  "violet",
  "blue",
  "teal",
  "green",
  "amber",
  "rose",
] as const;
export type ActivityColor = (typeof ACTIVITY_COLORS)[number];

/** Récurrence : tous les jours, ou certains jours de la semaine (0 = dimanche). */
export type Recurrence =
  | { kind: "daily" }
  | { kind: "weekly"; days: number[] };

/** Activité telle que manipulée dans l'app (config + présentation + planning). */
export interface UserActivity extends ActivityConfig {
  /** Identifiant de la ligne en base (absent tant que non persistée). */
  rowId?: string;
  /** Libellé personnalisé ; si absent, on retombe sur la traduction i18n. */
  label?: string | null;
  /** Note explicative personnalisée ; sinon traduction i18n. */
  note?: string | null;
  icon: ActivityIcon;
  color: ActivityColor;
  sortOrder: number;
  enabled: boolean;
  isBuiltin: boolean;
  reminderEnabled: boolean;
  /** 'HH:MM' ou null. */
  reminderTime: string | null;
  recurrence: Recurrence;
}

/** Ligne brute renvoyée par Supabase pour public.user_activities. */
export interface UserActivityRow {
  id: string;
  user_id: string;
  activity_key: string;
  label: string | null;
  note: string | null;
  category: string;
  type: ActivityType;
  options: string[] | null;
  scale: ScaleOption[] | null;
  icon: string;
  color: string;
  sort_order: number;
  enabled: boolean;
  required: boolean;
  counts_in_completion: boolean;
  weight: number;
  storage: StorageMap;
  is_builtin: boolean;
  reminder_enabled: boolean;
  reminder_time: string | null;
  recurrence: Recurrence;
  created_at: string;
  updated_at: string;
}

function asIcon(value: string): ActivityIcon {
  return (ACTIVITY_ICONS as readonly string[]).includes(value)
    ? (value as ActivityIcon)
    : "sparkles";
}

function asColor(value: string): ActivityColor {
  return (ACTIVITY_COLORS as readonly string[]).includes(value)
    ? (value as ActivityColor)
    : "primary";
}

function asRecurrence(value: unknown): Recurrence {
  if (
    value &&
    typeof value === "object" &&
    (value as Recurrence).kind === "weekly" &&
    Array.isArray((value as { days?: unknown }).days)
  ) {
    const days = ((value as { days: unknown[] }).days as unknown[])
      .map(Number)
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    return { kind: "weekly", days };
  }
  return { kind: "daily" };
}

/** Ligne DB -> activité applicative. */
export function rowToActivity(row: UserActivityRow): UserActivity {
  return {
    id: row.activity_key,
    rowId: row.id,
    label: row.label,
    note: row.note,
    category: row.category,
    type: row.type,
    required: row.required,
    countsInCompletion: row.counts_in_completion,
    weight: Number(row.weight) || 1,
    options: row.options ?? undefined,
    scale: row.scale ?? undefined,
    storage: row.storage,
    icon: asIcon(row.icon),
    color: asColor(row.color),
    sortOrder: row.sort_order,
    enabled: row.enabled,
    isBuiltin: row.is_builtin,
    reminderEnabled: row.reminder_enabled,
    reminderTime: row.reminder_time ? row.reminder_time.slice(0, 5) : null,
    recurrence: asRecurrence(row.recurrence),
  };
}

/** Activité applicative -> payload d'insertion/mise à jour (sans user_id). */
export function activityToRow(
  activity: UserActivity,
): Omit<UserActivityRow, "id" | "user_id" | "created_at" | "updated_at"> {
  return {
    activity_key: activity.id,
    label: activity.label ?? null,
    note: activity.note ?? null,
    category: activity.category,
    type: activity.type,
    options: activity.options ?? null,
    scale: activity.scale ?? null,
    icon: activity.icon,
    color: activity.color,
    sort_order: activity.sortOrder,
    enabled: activity.enabled,
    required: activity.required,
    counts_in_completion: activity.countsInCompletion,
    weight: activity.weight,
    storage: activity.storage,
    is_builtin: activity.isBuiltin,
    reminder_enabled: activity.reminderEnabled,
    reminder_time: activity.reminderTime,
    recurrence: activity.recurrence,
  };
}
