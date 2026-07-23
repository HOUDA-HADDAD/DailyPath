"use client";

import { useTranslation } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

/**
 * Bascule simple entre les deux langues. Persiste aussi le choix dans le
 * profil de l'utilisateur (best-effort) pour le retrouver sur un autre appareil.
 */
export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation();
  const next = locale === "ar" ? "en" : "ar";
  const label = next === "ar" ? "العربية" : "English";

  async function switchTo() {
    setLocale(next);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ locale: next }).eq("id", user.id);
      }
    } catch {
      // silencieux : le cookie suffit à faire fonctionner la langue
    }
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      className="rounded-full border border-border px-3 py-1.5 text-sm text-content-muted hover:bg-surface-2 hover:text-content"
    >
      {label}
    </button>
  );
}
