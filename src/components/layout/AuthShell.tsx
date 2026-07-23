"use client";

import type { ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-[100dvh] flex-col">
      <div className="flex justify-end gap-1 p-4">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-primary">
              {t("common.appName")}
            </h1>
            <p className="mt-1 text-sm text-content-muted">
              {t("common.tagline")}
            </p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
