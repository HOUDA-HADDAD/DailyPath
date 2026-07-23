// Types partagés du domaine.

/** Valeur d'une activité côté formulaire, normalisée et indexée par activity.id. */
export type ActivityValue = string[] | string | boolean | null;

/** Map { activityId -> valeur } manipulée par le formulaire et le scoring. */
export type FormValues = Record<string, ActivityValue>;

/** Ligne brute de la table daily_entries (telle que renvoyée par Supabase). */
export interface DailyEntryRow {
  id: string;
  user_id: string;
  entry_date: string; // 'YYYY-MM-DD'

  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;

  quran_wird: "complete" | "partial" | "none" | null;
  hadith_wird: "complete" | "partial" | "none" | null;

  nafl_prayers: string[] | null;

  adhkar_morning_evening: "both" | "one" | "none" | null;
  daily_adhkar: string[] | null;

  program_wird: "all" | "partial" | "none" | null;

  personal_reading: boolean;
  sport: boolean;

  rest: "healthy" | "draining" | "none" | null;
  silence: boolean;

  responses: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  locale: "en" | "ar";
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
