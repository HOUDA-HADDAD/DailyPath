export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

const RTL_LOCALES: Locale[] = ["ar"];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return isRTL(locale) ? "rtl" : "ltr";
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
