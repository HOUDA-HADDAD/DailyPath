"use client";

import { passwordStrength } from "@/lib/validation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const TONE = [
  "bg-border",
  "bg-danger",
  "bg-amber-500",
  "bg-blue-500",
  "bg-primary",
];

const LABEL_KEYS = [
  "validation.strength0",
  "validation.strength1",
  "validation.strength2",
  "validation.strength3",
  "validation.strength4",
];

/** Retour visuel non bloquant sur la robustesse du mot de passe. */
export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  const score = passwordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              step <= score ? TONE[score] : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-content-muted" aria-live="polite">
        {t(LABEL_KEYS[score])}
      </p>
    </div>
  );
}
