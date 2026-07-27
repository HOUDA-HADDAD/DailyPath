"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { ActivityManager } from "@/components/settings/ActivityManager";
import { TrackingPreview } from "@/components/settings/TrackingPreview";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";

/**
 * Profil → Réglages.
 * Organisation par intention : « ce que je suis » (activités), « comment ça
 * m'est présenté » (apparence). L'aperçu est placé juste après la gestion des
 * activités pour rendre l'effet des réglages immédiatement visible.
 */
export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <nav aria-label={t("settings.breadcrumb")}>
        <Link
          href="/profile"
          className="text-sm text-content-muted underline-offset-4 hover:text-content hover:underline"
        >
          ← {t("nav.profile")}
        </Link>
      </nav>

      <header>
        <h1 className="text-xl font-semibold text-content">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-content-muted">{t("settings.subtitle")}</p>
      </header>

      <ActivityManager />
      <TrackingPreview />
      <AppearanceSettings />
    </div>
  );
}
