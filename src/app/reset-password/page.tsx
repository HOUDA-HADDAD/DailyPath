"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { validatePassword, validatePasswordConfirmation } from "@/lib/validation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button, LinkButton } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

type SessionState = "checking" | "valid" | "expired";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Le lien de récupération ouvre une session temporaire. Sans elle, le lien
  // est invalide ou expiré : on le dit clairement plutôt que d'échouer au submit.
  useEffect(() => {
    let active = true;
    (async () => {
      if (searchParams.get("error")) {
        if (active) setSessionState("expired");
        return;
      }
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      setSessionState(session ? "valid" : "expired");
    })();
    return () => {
      active = false;
    };
  }, [searchParams]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(t(passwordError));
      return;
    }
    const confirmationError = validatePasswordConfirmation(password, confirmation);
    if (confirmationError) {
      setError(t(confirmationError));
      return;
    }

    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      // Jeton périmé entre l'ouverture de la page et la validation.
      setSessionState(
        updateError.message.toLowerCase().includes("session") ? "expired" : "valid",
      );
      setError(t("auth.resetFailed"));
      return;
    }

    setDone(true);
    // Laisse le temps de lire la confirmation avant de basculer sur l'app.
    window.setTimeout(() => {
      router.push("/today");
      router.refresh();
    }, 1500);
  }

  if (sessionState === "checking") {
    return (
      <Card>
        <Skeleton className="h-5 w-2/3" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (sessionState === "expired") {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-content">
          {t("auth.resetExpiredTitle")}
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          {t("auth.resetExpiredBody")}
        </p>
        <LinkButton href="/forgot-password" className="mt-4 w-full">
          {t("auth.resetExpiredCta")}
        </LinkButton>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-content">
        {t("auth.resetTitle")}
      </h2>
      <p className="mt-1 text-sm text-content-muted">{t("auth.resetSubtitle")}</p>

      {done ? (
        <Alert tone="success" className="mt-4">
          {t("auth.resetSuccess")}
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <div>
            <Label htmlFor="password">{t("auth.newPassword")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              aria-describedby="password-hint"
            />
            <PasswordStrength password={password} />
            <p id="password-hint" className="mt-1 text-xs text-content-muted">
              {t("auth.passwordHint")}
            </p>
          </div>

          <div>
            <Label htmlFor="confirmation">{t("auth.confirmPassword")}</Label>
            <Input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value);
                setError(null);
              }}
            />
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.saving") : t("auth.resetCta")}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <Card>
            <Skeleton className="h-5 w-2/3" />
          </Card>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
