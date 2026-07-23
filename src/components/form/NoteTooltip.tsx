"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * Info-bulle explicative à côté d'une activité.
 * Le texte vient des dictionnaires i18n sous `notes.<activityId>`.
 * Ces notes sont VOLONTAIREMENT VIDES pour l'instant : dès que vous les
 * remplissez dans en.ts / ar.ts, l'icône (i) apparaît automatiquement ici.
 */
export function NoteTooltip({ activityId }: { activityId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const note = t(`notes.${activityId}`).trim();

  // Pas de note renseignée -> rien à afficher (structure prête pour plus tard).
  if (!note) return null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={t("form.noteLabel")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-primary hover:bg-surface-2"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute top-6 z-20 w-60 rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-content shadow-lg ltr:left-0 rtl:right-0"
        >
          {note}
        </span>
      )}
    </span>
  );
}
