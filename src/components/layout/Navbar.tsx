"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";

const ADMIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true";

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const links = [
    { href: "/today", label: t("nav.today") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/analytics/weekly", label: t("nav.weekly") },
    { href: "/analytics/yearly", label: t("nav.yearly") },
    { href: "/profile", label: t("nav.profile") },
    ...(ADMIN_ENABLED ? [{ href: "/admin", label: t("nav.admin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between py-3">
          <Link href="/today" className="text-lg font-semibold text-primary">
            {t("common.appName")}
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LocaleSwitcher />
            <SignOutButton />
          </div>
        </div>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2">
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-fg"
                    : "text-content-muted hover:bg-surface-2",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
