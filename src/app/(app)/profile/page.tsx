"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function ProfilePage() {
  const { t, locale, setLocale } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (active) {
        setDisplayName(data?.display_name ?? "");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ display_name: displayName, locale })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
  }

  const languages: { value: Locale; label: string }[] = [
    { value: "en", label: t("profile.languageEn") },
    { value: "ar", label: t("profile.languageAr") },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-content">{t("profile.title")}</h1>

      {loading ? (
        <p className="text-sm text-content-muted">{t("common.loading")}</p>
      ) : (
        <>
          <Card className="space-y-4">
            <div>
              <Label htmlFor="displayName">{t("profile.displayName")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="mt-1 text-xs text-content-muted">
                {t("profile.displayNameHelp")}
              </p>
            </div>

            <div>
              <Label>{t("profile.language")}</Label>
              <div className="flex gap-2">
                {languages.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLocale(l.value)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm transition-colors",
                      locale === l.value
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-content hover:bg-surface-2",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? t("common.saving") : t("profile.saveProfile")}
              </Button>
              {saved && (
                <span className="text-sm text-primary">
                  {t("profile.savedToast")}
                </span>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>{t("profile.account")}</CardTitle>
            <div className="mt-3">
              <Label>{t("profile.emailLabel")}</Label>
              <Input value={email} disabled readOnly />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
