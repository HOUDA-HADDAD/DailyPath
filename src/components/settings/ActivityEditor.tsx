"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  ACTIVITY_COLORS,
  ACTIVITY_ICONS,
  type ActivityColor,
  type ActivityIcon,
  type Recurrence,
  type UserActivity,
} from "@/lib/activities/types";
import type { ActivityType, ScaleOption } from "@/lib/activities/config";
import { slugify, uniqueKey } from "@/lib/activities/store";
import { optionLabel } from "@/lib/activities/labels";
import {
  ACTIVITY_LABEL_MAX_LENGTH,
  ACTIVITY_NOTE_MAX_LENGTH,
  cleanText,
  validateActivityLabel,
} from "@/lib/validation";
import { requestNotificationPermission } from "@/lib/reminders/notifications";
import { accentFor } from "@/lib/theme/accent";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Alert } from "@/components/ui/Alert";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/ui/Icon";

/** Échelles proposées (on ne demande pas de tout construire à la main). */
const SCALE_PRESETS: Record<string, ScaleOption[]> = {
  completion: [
    { value: "complete", score: 1 },
    { value: "partial", score: 0.5 },
    { value: "none", score: 0 },
  ],
  amount: [
    { value: "all", score: 1 },
    { value: "partial", score: 0.5 },
    { value: "none", score: 0 },
  ],
  pair: [
    { value: "both", score: 1 },
    { value: "one", score: 0.5 },
    { value: "none", score: 0 },
  ],
};

/**
 * Progression volontairement « déjà entamée » (25 %) au premier écran, et
 * paliers plus serrés vers la fin : l'utilisateur perçoit un parcours court.
 * Il s'agit d'un assistant, pas d'une mesure — aucune donnée n'est déformée.
 */
const STEP_PROGRESS = [25, 55, 80, 100];
const STEP_COUNT = STEP_PROGRESS.length;

export interface ActivityEditorProps {
  open: boolean;
  mode: "create" | "edit";
  /** Activité à éditer (mode "edit"). */
  activity?: UserActivity;
  /** Clés déjà utilisées, pour générer une clé unique. */
  takenKeys: Set<string>;
  /** Position d'insertion pour une nouvelle activité. */
  nextSortOrder: number;
  onClose: () => void;
  onSubmit: (activity: UserActivity) => Promise<void>;
}

function blankActivity(sortOrder: number): UserActivity {
  return {
    id: "",
    category: "custom",
    // Effet de défaut : le type le plus courant est pré-sélectionné.
    type: "boolean",
    required: false,
    countsInCompletion: true,
    weight: 1,
    storage: { kind: "jsonb_key", key: "" },
    label: "",
    note: "",
    icon: "sparkles",
    color: "primary",
    sortOrder,
    enabled: true,
    isBuiltin: false,
    reminderEnabled: false,
    reminderTime: "20:00",
    recurrence: { kind: "daily" },
  };
}

export function ActivityEditor({
  open,
  mode,
  activity,
  takenKeys,
  nextSortOrder,
  onClose,
  onSubmit,
}: ActivityEditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<UserActivity>(
    () => activity ?? blankActivity(nextSortOrder),
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCreate = mode === "create";
  // En édition, l'utilisateur sait ce qu'il veut : tout est visible d'un coup.
  const showAllSections = !isCreate;
  const locked = !!draft.isBuiltin; // type/options d'une activité d'origine

  function patch(changes: Partial<UserActivity>) {
    setDraft((d) => ({ ...d, ...changes }));
    setError(null);
  }

  const labelError = useMemo(
    () => validateActivityLabel(draft.label ?? ""),
    [draft.label],
  );

  function goNext() {
    if (step === 0 && labelError) {
      setError(t(labelError));
      return;
    }
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  }

  async function handleSave() {
    if (labelError) {
      setError(t(labelError));
      setStep(0);
      return;
    }

    const label = cleanText(draft.label ?? "", ACTIVITY_LABEL_MAX_LENGTH);
    const note = cleanText(draft.note ?? "", ACTIVITY_NOTE_MAX_LENGTH);

    // Clé stable : générée une seule fois, jamais modifiée ensuite (sinon on
    // perdrait le lien avec les réponses déjà enregistrées).
    const key = draft.id || uniqueKey(slugify(label), takenKeys);

    const prepared: UserActivity = {
      ...draft,
      id: key,
      label,
      note: note || null,
      storage: draft.isBuiltin ? draft.storage : { kind: "jsonb_key", key },
      options:
        draft.type === "multi_checkbox"
          ? (draft.options ?? []).filter((o) => o.trim().length > 0)
          : undefined,
      scale: draft.type === "scale" ? draft.scale : undefined,
    };

    if (prepared.type === "multi_checkbox" && (prepared.options?.length ?? 0) === 0) {
      setError(t("settings.errorNeedOption"));
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(prepared);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  const visible = (index: number) => showAllSections || step === index;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCreate ? t("settings.createTitle") : t("settings.editTitle")}
      description={isCreate ? t("settings.createSubtitle") : undefined}
      footer={
        <div className="flex items-center justify-between gap-3">
          {isCreate && step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              {t("common.back")}
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
          )}

          {isCreate && step < STEP_COUNT - 1 ? (
            <Button onClick={goNext}>{t("common.continue")}</Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : t("settings.saveActivity")}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {isCreate && (
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs font-medium text-content-muted">
                {t("settings.stepOf", { current: step + 1, total: STEP_COUNT })}
              </span>
              <span className="text-xs font-semibold text-primary">
                {STEP_PROGRESS[step]}%
              </span>
            </div>
            <ProgressBar
              value={STEP_PROGRESS[step]}
              label={t("settings.wizardProgress")}
            />
          </div>
        )}

        {error && <Alert tone="danger">{error}</Alert>}

        {/* --- 1. Identité --- */}
        {visible(0) && (
          <section className="space-y-3">
            {showAllSections && (
              <h3 className="text-sm font-semibold text-content">
                {t("settings.sectionIdentity")}
              </h3>
            )}
            <div>
              <Label htmlFor="activity-label">{t("settings.labelField")}</Label>
              <Input
                id="activity-label"
                value={draft.label ?? ""}
                maxLength={ACTIVITY_LABEL_MAX_LENGTH}
                placeholder={t("settings.labelPlaceholder")}
                onChange={(e) => patch({ label: e.target.value })}
                autoFocus={isCreate}
              />
            </div>
            <div>
              <Label htmlFor="activity-note">{t("settings.noteField")}</Label>
              <textarea
                id="activity-note"
                rows={3}
                maxLength={ACTIVITY_NOTE_MAX_LENGTH}
                value={draft.note ?? ""}
                placeholder={t("settings.notePlaceholder")}
                onChange={(e) => patch({ note: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-xs text-content-muted">
                {t("settings.noteHelp")}
              </p>
            </div>
          </section>
        )}

        {/* --- 2. Type de réponse --- */}
        {visible(1) && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-content">
              {t("settings.sectionType")}
            </h3>

            {locked ? (
              <Alert tone="info">{t("settings.typeLocked")}</Alert>
            ) : (
              <ChoiceGrid
                columns={3}
                options={(["boolean", "scale", "multi_checkbox"] as ActivityType[]).map(
                  (type) => ({
                    value: type,
                    label: t(`settings.type_${type}`),
                  }),
                )}
                selected={draft.type}
                onSelect={(type) =>
                  patch({
                    type: type as ActivityType,
                    scale:
                      type === "scale" ? SCALE_PRESETS.completion : undefined,
                    options: type === "multi_checkbox" ? [""] : undefined,
                  })
                }
              />
            )}

            {draft.type === "scale" && !locked && (
              <div>
                <Label>{t("settings.scalePreset")}</Label>
                <ChoiceGrid
                  columns={1}
                  options={Object.entries(SCALE_PRESETS).map(([key, scale]) => ({
                    value: key,
                    label: scale
                      .map((s) => optionLabel(s.value, t))
                      .join("  ·  "),
                  }))}
                  selected={
                    Object.entries(SCALE_PRESETS).find(
                      ([, scale]) =>
                        scale[0].value === draft.scale?.[0]?.value,
                    )?.[0] ?? "completion"
                  }
                  onSelect={(key) => patch({ scale: SCALE_PRESETS[key] })}
                />
              </div>
            )}

            {draft.type === "multi_checkbox" && !locked && (
              <OptionsEditor
                options={draft.options ?? [""]}
                onChange={(options) => patch({ options })}
              />
            )}
          </section>
        )}

        {/* --- 3. Apparence --- */}
        {visible(2) && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-content">
              {t("settings.sectionAppearance")}
            </h3>

            <div>
              <Label>{t("settings.iconField")}</Label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={icon}
                    aria-pressed={draft.icon === icon}
                    onClick={() => patch({ icon: icon as ActivityIcon })}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      draft.icon === icon
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-content-muted hover:bg-surface-2",
                    )}
                  >
                    <Icon name={icon} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t("settings.colorField")}</Label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_COLORS.map((color) => {
                  const accent = accentFor(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      aria-label={t(`settings.color_${color}`)}
                      aria-pressed={draft.color === color}
                      onClick={() => patch({ color: color as ActivityColor })}
                      className={cn(
                        "h-11 w-11 rounded-xl border transition-transform",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        draft.color === color
                          ? "scale-105 border-content"
                          : "border-border hover:scale-105",
                      )}
                    >
                      <span
                        className={cn(
                          "mx-auto flex h-6 w-6 items-center justify-center rounded-full",
                          accent.badge,
                        )}
                      >
                        <Icon name={draft.icon} className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aperçu : on voit immédiatement ce que l'on construit. */}
            <div>
              <Label>{t("settings.preview")}</Label>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 p-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl",
                    accentFor(draft.color).badge,
                  )}
                >
                  <Icon name={draft.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-medium text-content">
                  {draft.label?.trim() || t("settings.previewPlaceholder")}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* --- 4. Planification --- */}
        {visible(3) && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-content">
              {t("settings.sectionSchedule")}
            </h3>

            <div>
              <Label>{t("settings.recurrenceField")}</Label>
              <ChoiceGrid
                columns={2}
                options={[
                  { value: "daily", label: t("settings.recurrenceDaily") },
                  { value: "weekly", label: t("settings.recurrenceWeekly") },
                ]}
                selected={draft.recurrence.kind}
                onSelect={(kind) =>
                  patch({
                    recurrence:
                      kind === "daily"
                        ? { kind: "daily" }
                        : { kind: "weekly", days: [1, 3, 5] },
                  })
                }
              />
              {draft.recurrence.kind === "weekly" && (
                <WeekdayPicker
                  days={draft.recurrence.days}
                  onChange={(days) => patch({ recurrence: { kind: "weekly", days } })}
                />
              )}
            </div>

            <ToggleRow
              label={t("settings.requiredField")}
              help={t("settings.requiredHelp")}
              checked={draft.required}
              onChange={(required) => patch({ required })}
            />

            <ToggleRow
              label={t("settings.reminderField")}
              help={t("settings.reminderHelp")}
              checked={draft.reminderEnabled}
              onChange={async (reminderEnabled) => {
                patch({ reminderEnabled });
                // L'autorisation ne peut être demandée que depuis un geste
                // utilisateur : c'est exactement ce clic.
                if (reminderEnabled) {
                  const granted = await requestNotificationPermission();
                  if (!granted) setError(t("settings.reminderDenied"));
                }
              }}
            />

            {draft.reminderEnabled && (
              <div>
                <Label htmlFor="reminder-time">{t("settings.reminderTime")}</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={draft.reminderTime ?? "20:00"}
                  onChange={(e) => patch({ reminderTime: e.target.value })}
                  className="max-w-[10rem]"
                />
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */

function ChoiceGrid({
  options,
  selected,
  onSelect,
  columns,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  columns: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={selected === option.value}
          onClick={() => onSelect(option.value)}
          className={cn(
            "min-h-[44px] rounded-xl border px-3 py-2 text-sm transition-colors",
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

function WeekdayPicker({
  days,
  onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  const { t, locale } = useTranslation();
  // Libellés courts localisés, sans table de traduction à maintenir.
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const labels = Array.from({ length: 7 }, (_, i) =>
    // 2024-01-07 est un dimanche : index 0 = dimanche.
    formatter.format(new Date(Date.UTC(2024, 0, 7 + i))),
  );

  function toggle(day: number) {
    onChange(
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort(),
    );
  }

  return (
    <div
      role="group"
      aria-label={t("settings.recurrenceWeekly")}
      className="mt-2 flex flex-wrap gap-1.5"
    >
      {labels.map((label, day) => (
        <button
          key={day}
          type="button"
          aria-pressed={days.includes(day)}
          onClick={() => toggle(day)}
          className={cn(
            "min-h-[40px] min-w-[44px] rounded-lg border px-2 text-xs transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            days.includes(day)
              ? "border-primary bg-primary text-primary-fg"
              : "border-border bg-surface text-content-muted hover:bg-surface-2",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const { t } = useTranslation();
  const MAX_OPTIONS = 8;

  return (
    <div>
      <Label>{t("settings.optionsField")}</Label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option}
              placeholder={t("settings.optionPlaceholder")}
              onChange={(e) => {
                const next = [...options];
                next[index] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("common.remove")}
              onClick={() => onChange(options.filter((_, i) => i !== index))}
              disabled={options.length <= 1}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
      {options.length < MAX_OPTIONS && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => onChange([...options, ""])}
        >
          {t("settings.addOption")}
        </Button>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-content">{label}</p>
        <p className="text-xs text-content-muted">{help}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
