"use client";

import { startOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { toISODate } from "@/lib/dates";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface Props {
  /** date ISO -> complétion (0..1) des jours remplis */
  data: Record<string, number>;
  weeks?: number;
}

// L'intensité s'inverse en thème sombre (plus rempli = vert plus lumineux),
// pour rester lisible sur fond foncé.
const LEVEL_CLASSES = [
  "bg-surface-2", // 0 : aucune entrée
  "bg-sage-200 dark:bg-sage-800", // >0..0.25
  "bg-sage-300 dark:bg-sage-700", // 0.25..0.5
  "bg-sage-400 dark:bg-sage-500", // 0.5..0.75
  "bg-sage-600 dark:bg-sage-300", // 0.75..1
];

function levelFor(c: number | undefined): number {
  if (c === undefined) return 0;
  if (c <= 0) return 1;
  if (c <= 0.25) return 1;
  if (c <= 0.5) return 2;
  if (c <= 0.75) return 3;
  return 4;
}

export function Heatmap({ data, weeks = 53 }: Props) {
  const { t, locale } = useTranslation();
  const today = new Date();
  const start = startOfWeek(subDays(today, (weeks - 1) * 7), {
    weekStartsOn: 0,
  });
  const days = eachDayOfInterval({ start, end: today });

  // Découpe en colonnes de 7 jours (semaines)
  const columns: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  return (
    <div>
      {/* dir=ltr : la frise temporelle se lit pareil en AR et EN */}
      <div dir="ltr" className="overflow-x-auto pb-1">
        <div className="flex gap-1">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((d) => {
                const iso = toISODate(d);
                const c = data[iso];
                const level = levelFor(c);
                const title =
                  c === undefined
                    ? fmt.format(d)
                    : `${fmt.format(d)} · ${Math.round(c * 100)}%`;
                return (
                  <div
                    key={iso}
                    title={title}
                    className={cn(
                      "h-3 w-3 rounded-[3px]",
                      LEVEL_CLASSES[level],
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-content-muted">
        <span className="me-1">{t("dashboard.less")}</span>
        {LEVEL_CLASSES.map((cls, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-[3px]", cls)} />
        ))}
        <span className="ms-1">{t("dashboard.more")}</span>
      </div>
    </div>
  );
}
