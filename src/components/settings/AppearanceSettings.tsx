"use client";

import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { useTheme } from "@/lib/theme/provider";
import type { Theme } from "@/lib/theme/config";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";

/** Langue + thème, regroupés : ce sont les réglages de présentation. */
export function AppearanceSettings() {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();

  async function changeLocale(next: Locale) {
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
      // Le cookie suffit au fonctionnement : échec silencieux acceptable.
    }
  }

  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>{t("settings.appearanceTitle")}</CardTitle>
        <CardSubtitle>{t("settings.appearanceSubtitle")}</CardSubtitle>
      </div>

      <div>
        <Label>{t("profile.language")}</Label>
        <OptionRow
          options={[
            { value: "en", label: t("profile.languageEn") },
            { value: "ar", label: t("profile.languageAr") },
          ]}
          selected={locale}
          onSelect={(value) => changeLocale(value as Locale)}
        />
      </div>

      <div>
        <Label>{t("settings.themeField")}</Label>
        <OptionRow
          options={[
            { value: "light", label: t("settings.themeLight") },
            { value: "dark", label: t("settings.themeDark") },
          ]}
          selected={theme}
          onSelect={(value) => setTheme(value as Theme)}
        />
      </div>
    </Card>
  );
}

function OptionRow({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
          className={cn(
            "min-h-[44px] rounded-xl border px-4 text-sm transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            selected === option.value
              ? "border-primary bg-primary text-primary-fg"
              : "border-border bg-surface text-content hover:bg-surface-2",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
