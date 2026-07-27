// Catalogue par défaut : convertit la configuration statique (config.ts) en
// activités utilisateur persistables. C'est ce qui est semé au premier usage
// et ce que restaure « Rétablir la configuration par défaut ».
//
// config.ts reste la source de vérité des DÉFAUTS ; user_activities devient la
// source de vérité de ce que CHAQUE utilisateur voit réellement.

import { ACTIVITIES } from "./config";
import type { ActivityColor, ActivityIcon, UserActivity } from "./types";

/** Présentation par défaut des activités du catalogue d'origine. */
const PRESENTATION: Record<string, { icon: ActivityIcon; color: ActivityColor }> = {
  obligatory_prayers: { icon: "moon", color: "primary" },
  nafl_prayers: { icon: "star", color: "violet" },
  quran_wird: { icon: "book", color: "teal" },
  hadith_wird: { icon: "bookmark", color: "teal" },
  program_wird: { icon: "bell", color: "blue" },
  adhkar_morning_evening: { icon: "sun", color: "amber" },
  daily_adhkar: { icon: "sparkles", color: "amber" },
  personal_reading: { icon: "book", color: "blue" },
  sport: { icon: "dumbbell", color: "green" },
  rest: { icon: "leaf", color: "green" },
  silence: { icon: "heart", color: "rose" },
};

/** Liste par défaut, prête à être insérée en base pour un utilisateur donné. */
export function defaultActivities(): UserActivity[] {
  return ACTIVITIES.map((a, index) => {
    const presentation = PRESENTATION[a.id] ?? {
      icon: "sparkles" as ActivityIcon,
      color: "primary" as ActivityColor,
    };
    return {
      ...a,
      label: null,
      note: null,
      icon: presentation.icon,
      color: presentation.color,
      sortOrder: index,
      enabled: true,
      isBuiltin: true,
      reminderEnabled: false,
      reminderTime: null,
      recurrence: { kind: "daily" as const },
    };
  });
}

/** Clés du catalogue d'origine (utile pour savoir ce qui est « built-in »). */
export const BUILTIN_KEYS = new Set(ACTIVITIES.map((a) => a.id));
