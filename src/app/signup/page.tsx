"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import {
  DISPLAY_NAME_MAX_LENGTH,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from "@/lib/validation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

export default function SignupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const firstError =
      validateDisplayName(displayName) ??
      validateEmail(email) ??
      validatePassword(password);
    if (firstError) {
      setError(t(firstError));
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(t("auth.genericError"));
      return;
    }
    // Si la confirmation d'email est désactivée, la session existe déjà.
    if (data.session) {
      router.push("/today");
      router.refresh();
      return;
    }
    setSuccess(true);
  }

  return (
    <AuthShell>
      <Card>
        {/* Cadrage « je construis quelque chose à moi » plutôt que « je remplis
            un formulaire » : l'engagement est nettement meilleur. */}
        <h2 className="text-lg font-semibold text-content">
          {t("auth.signUpTitle")}
        </h2>
        <p className="mt-1 text-sm text-content-muted">
          {t("auth.signUpSubtitle")}
        </p>

        {success ? (
          <Alert tone="success" className="mt-4">
            {t("auth.signUpSuccess")}
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <Label htmlFor="displayName">{t("auth.displayName")}</Label>
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                required
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                placeholder={t("auth.displayNamePlaceholder")}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError(null);
                }}
              />
            </div>

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
              />
            </div>

            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
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

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.signUpCta")}
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-4 text-center text-sm text-content-muted">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-medium text-primary underline">
          {t("auth.signInLink")}
        </Link>
      </p>
    </AuthShell>
  );
}
