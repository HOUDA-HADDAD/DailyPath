// Conversion générique entre la ligne DB (daily_entries) et les valeurs
// normalisées du formulaire (FormValues), pilotée par la liste d'activités.
//
// Les activités par défaut écrivent dans leurs colonnes dédiées (données
// historiques préservées) ; les activités créées par l'utilisateur écrivent
// dans la colonne `responses` (jsonb) — aucune migration nécessaire.

import type { DailyEntryRow, FormValues, ActivityValue } from "@/lib/types";
import { ACTIVITIES, type ActivityConfig } from "./config";

/** Valeurs initiales d'un formulaire vierge (nouvelle journée). */
export function emptyFormValues(
  activities: ActivityConfig[] = ACTIVITIES,
): FormValues {
  const values: FormValues = {};
  for (const a of activities) {
    values[a.id] = defaultValue(a);
  }
  return values;
}

function defaultValue(a: ActivityConfig): ActivityValue {
  switch (a.type) {
    case "multi_checkbox":
      return [];
    case "scale":
      return null;
    case "boolean":
      return null; // null = non renseigné (l'utilisateur doit choisir oui/non)
    default:
      return null;
  }
}

/** DB -> formulaire : reconstruit les valeurs à partir d'une ligne existante. */
export function rowToFormValues(
  row: Partial<DailyEntryRow>,
  activities: ActivityConfig[] = ACTIVITIES,
): FormValues {
  const responses = (row.responses as Record<string, unknown>) ?? {};
  const values: FormValues = {};

  for (const a of activities) {
    const s = a.storage;
    switch (s.kind) {
      case "columns": {
        const selected: string[] = [];
        for (const opt of a.options ?? []) {
          const col = s.columns[opt] as keyof DailyEntryRow;
          if (row[col]) selected.push(opt);
        }
        values[a.id] = selected;
        break;
      }
      case "jsonb_array": {
        const raw = row[s.column as keyof DailyEntryRow];
        values[a.id] = Array.isArray(raw) ? (raw as string[]) : [];
        break;
      }
      case "enum_column": {
        const raw = row[s.column as keyof DailyEntryRow];
        values[a.id] = typeof raw === "string" ? raw : null;
        break;
      }
      case "boolean_column": {
        const raw = row[s.column as keyof DailyEntryRow];
        values[a.id] = typeof raw === "boolean" ? raw : null;
        break;
      }
      case "jsonb_key": {
        const raw = responses[s.key];
        values[a.id] = (raw as ActivityValue) ?? defaultValue(a);
        break;
      }
    }
  }
  return values;
}

/**
 * Formulaire -> DB : construit l'objet à « upsert » dans daily_entries.
 *
 * `existingResponses` permet de préserver les réponses d'activités qui ne sont
 * pas dans la liste courante (activité désactivée, non programmée ce jour-là,
 * ou supprimée) : on ne détruit jamais silencieusement l'historique.
 */
export function formValuesToRow(
  values: FormValues,
  activities: ActivityConfig[] = ACTIVITIES,
  existingResponses: Record<string, unknown> = {},
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const responses: Record<string, unknown> = { ...existingResponses };

  for (const a of activities) {
    const value = values[a.id];
    const s = a.storage;
    switch (s.kind) {
      case "columns": {
        const selected = Array.isArray(value) ? value : [];
        for (const opt of a.options ?? []) {
          row[s.columns[opt]] = selected.includes(opt);
        }
        break;
      }
      case "jsonb_array": {
        row[s.column] = Array.isArray(value) ? value : [];
        break;
      }
      case "enum_column": {
        row[s.column] = typeof value === "string" ? value : null;
        break;
      }
      case "boolean_column": {
        row[s.column] = value === true;
        break;
      }
      case "jsonb_key": {
        responses[s.key] = value;
        break;
      }
    }
  }

  row.responses = responses;
  return row;
}
