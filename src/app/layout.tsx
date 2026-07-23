import "./globals.css";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  dirFor,
  isLocale,
} from "@/lib/i18n/config";
import { ThemeProvider } from "@/lib/theme/provider";
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from "@/lib/theme/config";

export const metadata: Metadata = {
  title: "DailyPath",
  description: "Suivi quotidien communautaire — habitudes spirituelles et personnelles",
};

export const viewport: Viewport = {
  themeColor: "#41654e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = cookies();
  const rawLocale = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const rawTheme = store.get(THEME_COOKIE)?.value;
  const theme = isTheme(rawTheme) ? rawTheme : DEFAULT_THEME;

  return (
    <html lang={locale} dir={dirFor(locale)} data-theme={theme}>
      <body>
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
