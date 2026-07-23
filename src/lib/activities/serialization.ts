// Conversion générique entre la ligne DB (daily_entries) et les valeurs
// normalisées du formulaire (FormValues), pilotée par la config des activités.

import type { DailyEntryRow, FormValues, ActivityValue } from "@/lib/types";
import { ACTIVITIES, type ActivityConfig } from "./config";

/** Valeurs initiales d'un formulaire vierge (nouvelle journée). */
export function emptyFormValues(): FormValues {
  const values: FormValues = {};
  for (const a of ACTIVITIES) {
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
export function rowToFormValues(row: Partial<DailyEntryRow>): FormValues {
  const responses = (row.responses as Record<string, unknown>) ?? {};
  const values: FormValues = {};

  for (const a of ACTIVITIES) {
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
        values[a.id] = (responses[s.key] as ActivityValue) ?? defaultValue(a);
        break;
      }
    }
  }
  return values;
}

/**
 * Formulaire -> DB : construit l'objet à "upsert" dans daily_entries.
 * Retourne un objet partiel (colonnes + responses), sans user_id ni date.
 */
export function formValuesToRow(values: FormValues): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const responses: Record<string, unknown> = {};

  for (const a of ACTIVITIES) {
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
