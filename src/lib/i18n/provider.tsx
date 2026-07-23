"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { en, type Dictionary } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirFor,
  type Locale,
} from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

type Vars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  dir: "rtl" | "ltr";
  t: (path: string, vars?: Vars) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Résout un chemin "a.b.c" dans un objet imbriqué. */
function resolve(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      // Persistance : cookie (lu côté serveur) + application immédiate au <html>.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      // Re-render serveur pour aligner le layout (dir/lang) au prochain rendu.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
    const t = (path: string, vars?: Vars) => {
      const raw = resolve(dict, path);
      if (typeof raw === "string") return interpolate(raw, vars);
      return path; // clé manquante : renvoyer la clé pour repérage facile
    };
    return { locale, dict, dir: dirFor(locale), t, setLocale };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation doit être utilisé dans <I18nProvider>.");
  }
  return ctx;
}
