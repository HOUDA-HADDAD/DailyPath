"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { validateEmail } from "@/lib/validation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateEmail(email);
    if (invalid) {
      setError(t(invalid));
      return;
    }

    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );
    setLoading(false);

    // Confirmation identique en cas de succès comme d'échec : on n'indique
    // jamais si une adresse existe dans la base (énumération de comptes).
    if (resetError && resetError.status === 429) {
      setError(t("auth.rateLimited"));
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell>
      <Card>
        <h2 className="text-lg font-semibold text-content">
          {t("auth.forgotTitle")}
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          {t("auth.forgotSubtitle")}
        </p>

        {sent ? (
          <div className="mt-4 space-y-4">
            <Alert tone="success">{t("auth.forgotSent", { email })}</Alert>
            <p className="text-sm text-content-muted">
              {t("auth.forgotSentHelp")}
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSent(false)}
            >
              {t("auth.forgotResend")}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                aria-invalid={!!error}
              />
            </div>

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.forgotCta")}
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-4 text-center text-sm text-content-muted">
        <Link href="/login" className="font-medium text-primary underline">
          {t("auth.backToSignIn")}
        </Link>
      </p>
    </AuthShell>
  );
}
