"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  orderedCategories,
  activitiesByCategory,
  dailyCompletion,
} from "@/lib/activities";
import type { ActivityValue, FormValues } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { upsertEntry } from "@/lib/entries";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ActivityField } from "./ActivityField";

interface Props {
  userId: string;
  dateISO: string;
  initialValues: FormValues;
  isExisting: boolean;
}

export function DailyForm({ userId, dateISO, initialValues, isExisting }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completion = useMemo(
    () => Math.round(dailyCompletion(values) * 100),
    [values],
  );

  function update(id: string, value: ActivityValue) {
    setValues((v) => ({ ...v, [id]: value }));
    setSaved(false);
    if (invalid.has(id)) {
      setInvalid((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function validate(): Set<string> {
    const missing = new Set<string>();
    for (const cat of orderedCategories()) {
      for (const a of activitiesByCategory(cat.id)) {
        // Seuls les champs à choix unique obligatoires doivent être renseignés.
        if (a.required && (a.type === "scale" || a.type === "boolean")) {
          if (values[a.id] === null || values[a.id] === undefined) {
            missing.add(a.id);
          }
        }
      }
    }
    return missing;
  }

  async function handleSubmit() {
    const missing = validate();
    if (missing.size > 0) {
      setInvalid(missing);
      setError(t("common.requiredMissing"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      await upsertEntry(supabase, userId, dateISO, values);
      setSaved(true);
      router.refresh(); // rafraîchit dashboard / analyses au retour
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="rounded-2xl bg-primary-soft px-4 py-3 text-sm text-primary-soft-fg">
        {isExisting ? t("form.editBanner") : t("form.newBanner")}
      </div>

      {orderedCategories().map((cat) => (
        <Card key={cat.id}>
          <CardTitle>{t(`categories.${cat.id}`)}</CardTitle>
          <div className="mt-2 divide-y divide-border">
            {activitiesByCategory(cat.id).map((a) => (
              <ActivityField
                key={a.id}
                activity={a}
                value={values[a.id]}
                onChange={(v) => update(a.id, v)}
                invalid={invalid.has(a.id)}
              />
            ))}
          </div>
        </Card>
      ))}

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Barre d'action fixe (mobile-first) */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <div className="text-sm">
            <span className="text-content-muted">{t("form.completion")}</span>
            <span className="ms-2 text-lg font-semibold text-primary">
              {completion}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-primary">
                {t("form.savedToast")}
              </span>
            )}
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? t("common.saving") : t("form.saveEntry")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
