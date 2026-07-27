"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { activityNote } from "@/lib/activities/labels";
import type { UserActivity } from "@/lib/activities/types";

/**
 * Info-bulle explicative à côté d'une activité.
 * Le texte vient de la note personnalisée de l'activité, sinon des
 * dictionnaires i18n (`notes.<activityId>`). Tant qu'aucune note n'est
 * renseignée, l'icône n'apparaît pas — pas de bruit visuel inutile.
 */
export function NoteTooltip({ activity }: { activity: UserActivity }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const note = activityNote(activity, t).trim();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!note) return null;

  return (
    <span ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={t("form.noteLabel")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-primary hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
