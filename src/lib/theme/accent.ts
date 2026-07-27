// Accents d'activité : classes Tailwind statiques (donc bien détectées au
// build) pour chaque couleur proposée, déclinées clair/sombre.

import type { ActivityColor } from "@/lib/activities/types";

export interface AccentClasses {
  /** Pastille contenant l'icône. */
  badge: string;
  /** Barre de progression / point d'accent. */
  bar: string;
  /** Bordure d'un état sélectionné. */
  ring: string;
}

export const ACCENT: Record<ActivityColor, AccentClasses> = {
  primary: {
    badge: "bg-primary/10 text-primary",
    bar: "bg-primary",
    ring: "ring-primary",
  },
  violet: {
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    bar: "bg-violet-500",
    ring: "ring-violet-500",
  },
  blue: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    bar: "bg-blue-500",
    ring: "ring-blue-500",
  },
  teal: {
    badge: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    bar: "bg-teal-500",
    ring: "ring-teal-500",
  },
  green: {
    badge: "bg-green-500/10 text-green-600 dark:text-green-300",
    bar: "bg-green-500",
    ring: "ring-green-500",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    bar: "bg-amber-500",
    ring: "ring-amber-500",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    bar: "bg-rose-500",
    ring: "ring-rose-500",
  },
};

export function accentFor(color: ActivityColor): AccentClasses {
  return ACCENT[color] ?? ACCENT.primary;
}
