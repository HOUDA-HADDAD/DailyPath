// Utilitaires de dates, basés sur date-fns, en heure locale de l'appareil.
import {
  format,
  parseISO,
  startOfDay,
  subDays,
  eachDayOfInterval,
  differenceInCalendarDays,
} from "date-fns";

/** 'YYYY-MM-DD' pour aujourd'hui (heure locale). */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Date -> 'YYYY-MM-DD'. */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** 'YYYY-MM-DD' -> Date (début de journée locale). */
export function fromISODate(s: string): Date {
  return startOfDay(parseISO(s));
}

/** Liste des N derniers jours (du plus ancien au plus récent), format ISO. */
export function lastNDaysISO(n: number, end: Date = new Date()): string[] {
  const endDay = startOfDay(end);
  const startDay = subDays(endDay, n - 1);
  return eachDayOfInterval({ start: startDay, end: endDay }).map(toISODate);
}

/** Nombre de jours calendaires entre deux dates ISO (b - a). */
export function daysBetween(aISO: string, bISO: string): number {
  return differenceInCalendarDays(fromISODate(bISO), fromISODate(aISO));
}

export { format, subDays, startOfDay, parseISO };
