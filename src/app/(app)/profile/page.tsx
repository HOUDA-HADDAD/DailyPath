"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { validateDisplayName, DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation";
import { Card, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";

export default function ProfilePage() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const invalid = validateDisplayName(displayName);
    if (invalid) {
      setError(t(invalid));
      return;
    }
    setError(null);
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError(t("common.error"));
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-content">
          {t("profile.title")}
        </h1>
        <p className="text-sm text-content-muted">{t("profile.subtitle")}</p>
      </header>

      {loading ? (
        <SkeletonCard lines={3} />
      ) : (
        <>
          <Card className="space-y-4">
            <div>
              <Label htmlFor="displayName">{t("profile.displayName")}</Label>
              <Input
                id="displayName"
                value={displayName}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setSaved(false);
                }}
              />
              <p className="mt-1 text-xs text-content-muted">
                {t("profile.displayNameHelp")}
              </p>
            </div>

            <div>
              <Label htmlFor="email">{t("profile.emailLabel")}</Label>
              <Input id="email" value={email} disabled readOnly />
            </div>

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? t("common.saving") : t("profile.saveProfile")}
              </Button>
              <span aria-live="polite" className="text-sm text-primary">
                {saved ? t("profile.savedToast") : ""}
              </span>
            </div>
          </Card>

          {/* Passerelle vers les réglages : on annonce la valeur avant le clic. */}
          <Link
            href="/profile/settings"
            className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name="target" />
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle>{t("settings.title")}</CardTitle>
                <CardSubtitle>{t("settings.entrySubtitle")}</CardSubtitle>
              </div>
              <span aria-hidden="true" className="text-content-muted rtl:rotate-180">
                →
              </span>
            </div>
          </Link>
        </>
      )}
    </div>
  );
}
