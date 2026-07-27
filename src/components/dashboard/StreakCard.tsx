"use client";

import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useTranslation } from "@/lib/i18n";

export function StreakCard({
  streak,
  best,
  filledToday,
}: {
  streak: number;
  best: number;
  filledToday: boolean;
}) {
  const { t } = useTranslation();

  const label =
    streak <= 0
      ? t("dashboard.streakNone")
      : streak === 1
        ? t("dashboard.streakOne")
        : t("dashboard.streakDays", { count: streak });

  // Aversion à la perte : quand une série existe et que le jour n'est pas
  // encore rempli, on rend explicite ce qui est sur le point d'être perdu.
  const atRisk = streak > 0 && !filledToday;

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-primary text-2xl font-bold tabular-nums text-primary-fg">
          {streak}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-content-muted">{t("dashboard.streakTitle")}</p>
          <p className="text-base font-medium text-content">{label}</p>
          {best > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-content-muted">
              <Icon name="star" className="h-3.5 w-3.5" />
              {t("dashboard.bestStreak", { count: best })}
            </p>
          )}
        </div>
      </div>

      {atRisk && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-soft px-4 py-3">
          <p className="text-sm text-primary-soft-fg">
            {t("dashboard.streakAtRisk", { count: streak })}
          </p>
          <LinkButton href="/today" size="sm">
            {t("dashboard.streakAtRiskCta")}
          </LinkButton>
        </div>
      )}
    </Card>
  );
}
