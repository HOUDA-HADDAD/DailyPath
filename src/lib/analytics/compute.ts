// Calculs d'analyse (streak, heatmap, hebdo, tendance annuelle).
// Tout dérive de la config des activités via le scoring générique.

import {
  format,
  parseISO,
  subDays,
  subMonths,
  addMonths,
  startOfMonth,
} from "date-fns";
import type { DailyEntryRow, FormValues } from "@/lib/types";
import {
  rowToFormValues,
  dailyCompletion,
  categoryScoreForDay,
  orderedCategories,
} from "@/lib/activities";
import { todayISO, lastNDaysISO, toISODate } from "@/lib/dates";

// -----------------------------------------------------------------------------
// Bases : valeurs et complétion par date
// -----------------------------------------------------------------------------
export function valuesByDate(entries: DailyEntryRow[]): Map<string, FormValues> {
  const map = new Map<string, FormValues>();
  for (const e of entries) map.set(e.entry_date, rowToFormValues(e));
  return map;
}

export function completionByDate(entries: DailyEntryRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.entry_date, dailyCompletion(rowToFormValues(e)));
  return map;
}

export function filledDates(entries: DailyEntryRow[]): Set<string> {
  return new Set(entries.map((e) => e.entry_date));
}

// -----------------------------------------------------------------------------
// Série de jours consécutifs (streak) en cours
// -----------------------------------------------------------------------------
export function computeStreak(
  entries: DailyEntryRow[],
  today: string = todayISO(),
): number {
  const filled = filledDates(entries);
  let day = today;
  // Si aujourd'hui n'est pas encore rempli, la série court jusqu'à hier.
  if (!filled.has(day)) day = toISODate(subDays(parseISO(day), 1));

  let streak = 0;
  while (filled.has(day)) {
    streak += 1;
    day = toISODate(subDays(parseISO(day), 1));
  }
  return streak;
}

// -----------------------------------------------------------------------------
// Heatmap : date -> complétion (0..1) pour les jours remplis
// -----------------------------------------------------------------------------
export function heatmapMap(entries: DailyEntryRow[]): Map<string, number> {
  return completionByDate(entries);
}

// -----------------------------------------------------------------------------
// Hebdomadaire : % par catégorie, 7 derniers jours vs 7 précédents
// -----------------------------------------------------------------------------
export interface CategoryWeekly {
  category: string;
  current: number; // 0..100
  previous: number; // 0..100
}

function avgCategoryOverWindow(
  categoryId: string,
  window: string[],
  values: Map<string, FormValues>,
): number {
  const scores: number[] = [];
  for (const d of window) {
    const v = values.get(d);
    if (v) scores.push(categoryScoreForDay(categoryId, v));
  }
  if (scores.length === 0) return 0;
  const mean = scores.reduce((s, x) => s + x, 0) / scores.length;
  return Math.round(mean * 100);
}

export function weeklyByCategory(
  entries: DailyEntryRow[],
  today: string = todayISO(),
): CategoryWeekly[] {
  const values = valuesByDate(entries);
  const current = lastNDaysISO(7, parseISO(today));
  const previous = lastNDaysISO(7, subDays(parseISO(today), 7));

  return orderedCategories().map((c) => ({
    category: c.id,
    current: avgCategoryOverWindow(c.id, current, values),
    previous: avgCategoryOverWindow(c.id, previous, values),
  }));
}

// -----------------------------------------------------------------------------
// Annuel : tendance sur 12 mois du taux global
// -----------------------------------------------------------------------------
export interface MonthPoint {
  key: string; // 'YYYY-MM'
  monthIndex: number; // 0..11
  year: number;
  value: number | null; // 0..100, null si aucun jour rempli
}

export function monthlyTrend(
  entries: DailyEntryRow[],
  today: string = todayISO(),
): MonthPoint[] {
  const completion = completionByDate(entries);

  // Regrouper les complétions par mois 'YYYY-MM'
  const byMonth = new Map<string, number[]>();
  for (const [date, c] of completion) {
    const key = date.slice(0, 7);
    const arr = byMonth.get(key) ?? [];
    arr.push(c);
    byMonth.set(key, arr);
  }

  const start = startOfMonth(subMonths(parseISO(today), 11));
  const points: MonthPoint[] = [];
  for (let i = 0; i < 12; i++) {
    const m = addMonths(start, i);
    const key = format(m, "yyyy-MM");
    const arr = byMonth.get(key);
    const value =
      arr && arr.length > 0
        ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 100)
        : null;
    points.push({
      key,
      monthIndex: m.getMonth(),
      year: m.getFullYear(),
      value,
    });
  }
  return points;
}

// -----------------------------------------------------------------------------
// Annuel : répartition par catégorie sur les 365 derniers jours
// -----------------------------------------------------------------------------
export interface CategoryScore {
  category: string;
  value: number; // 0..100
}

export function yearlyByCategory(
  entries: DailyEntryRow[],
  today: string = todayISO(),
): CategoryScore[] {
  const values = valuesByDate(entries);
  const window = lastNDaysISO(365, parseISO(today));
  return orderedCategories().map((c) => ({
    category: c.id,
    value: avgCategoryOverWindow(c.id, window, values),
  }));
}
