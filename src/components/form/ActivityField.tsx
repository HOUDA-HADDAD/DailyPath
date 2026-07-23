"use client";

import type { ActivityConfig } from "@/lib/activities";
import type { ActivityValue } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { NoteTooltip } from "./NoteTooltip";

interface Props {
  activity: ActivityConfig;
  value: ActivityValue;
  onChange: (value: ActivityValue) => void;
  invalid?: boolean;
}

/**
 * Rendu d'une activité selon son type (piloté par la config).
 * Ajouter un nouveau type d'activité = ajouter un `case` ici.
 */
export function ActivityField({ activity, value, onChange, invalid }: Props) {
  const { t } = useTranslation();

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-content">
          {t(`activities.${activity.id}`)}
        </span>
        <NoteTooltip activityId={activity.id} />
        {!activity.required && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-content-muted">
            {t("common.optional")}
          </span>
        )}
      </div>

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
          label={(opt) => t(`options.${opt}`)}
        />
      )}

      {activity.type === "scale" && (
        <Segmented
          options={(activity.scale ?? []).map((s) => s.value)}
          selected={typeof value === "string" ? value : null}
          onSelect={(opt) => onChange(opt)}
          label={(opt) => t(`options.${opt}`)}
          invalid={invalid}
        />
      )}

      {activity.type === "boolean" && (
        <Segmented
          options={["yes", "no"]}
          selected={value === true ? "yes" : value === false ? "no" : null}
          onSelect={(opt) => onChange(opt === "yes")}
          label={(opt) => t(`options.${opt}`)}
          invalid={invalid}
        />
      )}
    </div>
  );
}

/* ---------- Sous-composants de champ ---------- */

function ChipGroup({
  options,
  selected,
  onToggle,
  label,
}: {
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
  label: (opt: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(opt)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-colors",
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
}: {
  options: string[];
  selected: string | null;
  onSelect: (opt: string) => void;
  label: (opt: string) => string;
  invalid?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-2 rounded-xl",
        invalid && "rounded-xl ring-1 ring-danger/60",
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
              "min-w-[4.5rem] rounded-xl border px-3.5 py-2 text-sm transition-colors",
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
