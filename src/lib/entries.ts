// Accès données à la table daily_entries. Les fonctions reçoivent un client
// Supabase (navigateur ou serveur) pour rester réutilisables partout.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyEntryRow, FormValues } from "@/lib/types";
import { formValuesToRow, type ActivityConfig } from "@/lib/activities";

export async function fetchEntryByDate(
  supabase: SupabaseClient,
  userId: string,
  dateISO: string,
): Promise<DailyEntryRow | null> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", dateISO)
    .maybeSingle();

  if (error) throw error;
  return (data as DailyEntryRow) ?? null;
}

export async function fetchEntriesBetween(
  supabase: SupabaseClient,
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<DailyEntryRow[]> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", fromISO)
    .lte("entry_date", toISO)
    .order("entry_date", { ascending: true });

  if (error) throw error;
  return (data as DailyEntryRow[]) ?? [];
}

/**
 * Crée ou met à jour l'entrée du jour (une seule par user_id + date grâce à
 * la contrainte unique). L'upsert gère automatiquement le mode édition.
 *
 * `existingResponses` évite d'écraser les réponses d'activités absentes de la
 * liste courante (désactivées, non programmées ce jour-là, supprimées).
 */
export async function upsertEntry(
  supabase: SupabaseClient,
  userId: string,
  dateISO: string,
  values: FormValues,
  activities: ActivityConfig[],
  existingResponses: Record<string, unknown> = {},
): Promise<void> {
  const row = {
    ...formValuesToRow(values, activities, existingResponses),
    user_id: userId,
    entry_date: dateISO,
  };

  const { error } = await supabase
    .from("daily_entries")
    .upsert(row, { onConflict: "user_id,entry_date" });

  if (error) throw error;
}
