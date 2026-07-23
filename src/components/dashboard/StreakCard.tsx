"use client";

import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/lib/i18n";

export function StreakCard({ streak }: { streak: number }) {
  const { t } = useTranslation();

  const label =
    streak <= 0
      ? t("dashboard.streakNone")
      : streak === 1
        ? t("dashboard.streakOne")
        : t("dashboard.streakDays", { count: streak });

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-fg">
        {streak}
      </div>
      <div>
        <p className="text-sm text-content-muted">{t("dashboard.streakTitle")}</p>
        <p className="text-base font-medium text-content">{label}</p>
      </div>
    </Card>
  );
}
