// Accès données aux activités personnalisées (public.user_activities).
// Toutes les fonctions reçoivent un client Supabase pour rester utilisables
// côté navigateur comme côté serveur.

import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultActivities } from "./defaults";
import {
  activityToRow,
  rowToActivity,
  type UserActivity,
  type UserActivityRow,
} from "./types";

/** Génère une clé stable et unique à partir d'un libellé libre. */
export function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques (accents)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "activity";
}

/** Rend la clé unique au sein de la liste existante (suffixe _2, _3, …). */
export function uniqueKey(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

export async function fetchActivities(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserActivity[]> {
  const { data, error } = await supabase
    .from("user_activities")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return ((data as UserActivityRow[]) ?? []).map(rowToActivity);
}

/** Insère le catalogue par défaut pour un utilisateur. */
export async function seedDefaults(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserActivity[]> {
  const rows = defaultActivities().map((a) => ({
    ...activityToRow(a),
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("user_activities")
    .upsert(rows, { onConflict: "user_id,activity_key" })
    .select();

  if (error) throw error;
  return ((data as UserActivityRow[]) ?? [])
    .map(rowToActivity)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Récupère les activités de l'utilisateur ; si aucune n'existe encore
 * (premier usage), sème automatiquement le catalogue par défaut.
 */
export async function fetchOrSeedActivities(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserActivity[]> {
  const existing = await fetchActivities(supabase, userId);
  if (existing.length > 0) return existing;
  return seedDefaults(supabase, userId);
}

export async function createActivity(
  supabase: SupabaseClient,
  userId: string,
  activity: UserActivity,
): Promise<UserActivity> {
  const { data, error } = await supabase
    .from("user_activities")
    .insert({ ...activityToRow(activity), user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return rowToActivity(data as UserActivityRow);
}

export async function updateActivity(
  supabase: SupabaseClient,
  activity: UserActivity,
): Promise<UserActivity> {
  if (!activity.rowId) throw new Error("updateActivity: rowId manquant");

  const { data, error } = await supabase
    .from("user_activities")
    .update(activityToRow(activity))
    .eq("id", activity.rowId)
    .select()
    .single();

  if (error) throw error;
  return rowToActivity(data as UserActivityRow);
}

export async function deleteActivity(
  supabase: SupabaseClient,
  rowId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_activities")
    .delete()
    .eq("id", rowId);
  if (error) throw error;
}

/** Persiste un nouvel ordre d'affichage (une requête par activité déplacée). */
export async function persistOrder(
  supabase: SupabaseClient,
  activities: UserActivity[],
): Promise<void> {
  const updates = activities
    .filter((a) => a.rowId)
    .map((a, index) =>
      supabase
        .from("user_activities")
        .update({ sort_order: index })
        .eq("id", a.rowId as string),
    );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

/** Supprime tout et réinstalle le catalogue par défaut. */
export async function restoreDefaults(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserActivity[]> {
  const { error } = await supabase
    .from("user_activities")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
  return seedDefaults(supabase, userId);
}
