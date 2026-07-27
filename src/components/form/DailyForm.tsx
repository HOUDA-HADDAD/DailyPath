"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dailyCompletion, categoriesFrom } from "@/lib/activities";
import { categoryLabel } from "@/lib/activities/labels";
import type { UserActivity } from "@/lib/activities/types";
import type { ActivityValue, FormValues } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { upsertEntry } from "@/lib/entries";
import { useTranslation } from "@/lib/i18n";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ActivityField } from "./ActivityField";

interface Props {
  userId: string;
  dateISO: string;
  activities: UserActivity[];
  initialValues: FormValues;
  /** Réponses déjà stockées, préservées même si l'activité n'est plus affichée. */
  existingResponses: Record<string, unknown>;
  isExisting: boolean;
}

/** Message d'encouragement selon l'avancement (effet « gradient d'objectif »). */
function encouragementKey(percent: number): string {
  if (percent >= 100) return "form.encourageDone";
  if (percent >= 80) return "form.encourageAlmost";
  if (percent >= 50) return "form.encourageHalf";
  if (percent > 0) return "form.encourageGoing";
  return "form.encourageStart";
}

export function DailyForm({
  userId,
  dateISO,
  activities,
  initialValues,
  existingResponses,
  isExisting,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completion = useMemo(
    () => Math.round(dailyCompletion(values, activities) * 100),
    [values, activities],
  );

  // Activités obligatoires encore sans réponse : sert au compte à rebours.
  const remaining = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.required &&
          (a.type === "scale" || a.type === "boolean") &&
          (values[a.id] === null || values[a.id] === undefined),
      ).length,
    [values, activities],
  );

  const categories = useMemo(() => categoriesFrom(activities), [activities]);

  // Aversion à la perte : on prévient avant de perdre une saisie non enregistrée.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = useCallback((id: string, value: ActivityValue) => {
    setValues((v) => ({ ...v, [id]: value }));
    setSaved(false);
    setDirty(true);
    setInvalid((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  function validate(): Set<string> {
    const missing = new Set<string>();
    for (const a of activities) {
      // Seuls les champs à choix unique obligatoires doivent être renseignés.
      if (a.required && (a.type === "scale" || a.type === "boolean")) {
        if (values[a.id] === null || values[a.id] === undefined) missing.add(a.id);
      }
    }
    return missing;
  }

  async function handleSubmit() {
    const missing = validate();
    if (missing.size > 0) {
      setInvalid(missing);
      setError(t("common.requiredMissing"));
      // Amène l'utilisateur au premier champ manquant plutôt que de le laisser chercher.
      const first = activities.find((a) => missing.has(a.id));
      if (first) {
        document
          .getElementById(`activity-${first.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const supabase = createClient();
      await upsertEntry(
        supabase,
        userId,
        dateISO,
        values,
        activities,
        existingResponses,
      );
      setSaved(true);
      setDirty(false);
      router.refresh(); // rafraîchit dashboard / analyses au retour
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-32">
      <Alert tone="info">
        {isExisting ? t("form.editBanner") : t("form.newBanner")}
      </Alert>

      {categories.map((category) => {
        const inCategory = activities.filter((a) => a.category === category);
        if (inCategory.length === 0) return null;
        return (
          <Card key={category}>
            <CardTitle>{categoryLabel(category, t)}</CardTitle>
            <div className="mt-1 divide-y divide-border">
              {inCategory.map((a) => (
                <div key={a.id} id={`activity-${a.id}`}>
                  <ActivityField
                    activity={a}
                    value={values[a.id]}
                    onChange={(v) => update(a.id, v)}
                    invalid={invalid.has(a.id)}
                  />
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {error && <Alert tone="danger">{error}</Alert>}

      {/* Barre d'action fixe (mobile-first) */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-sm text-content-muted">
              {t(encouragementKey(completion))}
            </span>
            <span className="text-lg font-semibold tabular-nums text-primary">
              {completion}%
            </span>
          </div>

          <ProgressBar value={completion} label={t("form.completion")} />

          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className="text-xs text-content-muted"
              aria-live="polite"
            >
              {saved
                ? t("form.savedToast")
                : remaining > 0
                  ? t("form.remaining", { count: remaining })
                  : t("form.allAnswered")}
            </span>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? t("common.saving") : t("form.saveEntry")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
