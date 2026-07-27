"use client";

import { memo } from "react";
import type { UserActivity } from "@/lib/activities/types";
import { activityLabel, optionLabel } from "@/lib/activities/labels";
import type { ActivityValue } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { accentFor } from "@/lib/theme/accent";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { NoteTooltip } from "./NoteTooltip";

interface Props {
  activity: UserActivity;
  value: ActivityValue;
  onChange: (value: ActivityValue) => void;
  invalid?: boolean;
}

/**
 * Rendu d'une activité selon son type (piloté par la configuration).
 * Ajouter un nouveau type d'activité = ajouter un `case` ici.
 */
function ActivityFieldBase({ activity, value, onChange, invalid }: Props) {
  const { t } = useTranslation();
  const accent = accentFor(activity.color);
  const label = activityLabel(activity, t);
  const errorId = invalid ? `${activity.id}-error` : undefined;

  return (
    <div className="py-3.5">
      <div className="mb-2.5 flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-xl",
            accent.badge,
          )}
        >
          <Icon name={activity.icon} className="h-[18px] w-[18px]" />
        </span>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-content">{label}</span>
          <NoteTooltip activity={activity} />
          {!activity.required && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-content-muted">
              {t("common.optional")}
            </span>
          )}
        </div>
      </div>

      <div className="ps-[42px]">
        {activity.type === "multi_checkbox" && (
          <ChipGroup
            options={activity.options ?? []}
            selected={Array.isArray(value) ? value : []}
            onToggle={(opt) => {
              const cur = Array.isArray(value) ? value : [];
              onChange(
                cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt],
              );
            }}
            label={(opt) => optionLabel(opt, t)}
            groupLabel={label}
          />
        )}

        {activity.type === "scale" && (
          <Segmented
            options={(activity.scale ?? []).map((s) => s.value)}
            selected={typeof value === "string" ? value : null}
            onSelect={(opt) => onChange(opt)}
            label={(opt) => optionLabel(opt, t)}
            invalid={invalid}
            groupLabel={label}
            describedBy={errorId}
          />
        )}

        {activity.type === "boolean" && (
          <Segmented
            options={["yes", "no"]}
            selected={value === true ? "yes" : value === false ? "no" : null}
            onSelect={(opt) => onChange(opt === "yes")}
            label={(opt) => optionLabel(opt, t)}
            invalid={invalid}
            groupLabel={label}
            describedBy={errorId}
          />
        )}

        {invalid && (
          <p id={errorId} className="mt-2 text-xs text-danger">
            {t("form.fieldRequired")}
          </p>
        )}
      </div>
    </div>
  );
}

/** Mémoïsé : une activité ne se redessine que si SA valeur change. */
export const ActivityField = memo(ActivityFieldBase);

/* ---------- Sous-composants de champ ---------- */

function ChipGroup({
  options,
  selected,
  onToggle,
  label,
  groupLabel,
}: {
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
  label: (opt: string) => string;
  groupLabel: string;
}) {
  return (
    <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(opt)}
            className={cn(
              "min-h-[44px] rounded-full border px-4 text-sm transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              active
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-content hover:bg-surface-2",
            )}
          >
            {label(opt)}
          </button>
        );
      })}
    </div>
  );
}

function Segmented({
  options,
  selected,
  onSelect,
  label,
  invalid,
  groupLabel,
  describedBy,
}: {
  options: string[];
  selected: string | null;
  onSelect: (opt: string) => void;
  label: (opt: string) => string;
  invalid?: boolean;
  groupLabel: string;
  describedBy?: string;
}) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      aria-describedby={describedBy}
      className={cn(
        "inline-flex flex-wrap gap-2 rounded-xl",
        invalid && "ring-1 ring-danger/60",
      )}
    >
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(opt)}
            className={cn(
              "min-h-[44px] min-w-[4.5rem] rounded-xl border px-4 text-sm transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              active
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-surface text-content hover:bg-surface-2",
            )}
          >
            {label(opt)}
          </button>
        );
      })}
    </div>
  );
}
