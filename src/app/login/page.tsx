"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { validateEmail } from "@/lib/validation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkExpired = searchParams.get("error") === "expired";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setError(t(emailError));
      return;
    }
    if (!password) {
      setError(t("validation.passwordRequired"));
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      // Message volontairement générique : ne révèle pas si le compte existe.
      setError(t("auth.genericError"));
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <>
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-content">
          {t("auth.signInTitle")}
        </h2>

        {linkExpired && (
          <Alert tone="danger" className="mb-4">
            {t("auth.linkExpired")}
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("auth.forgotLink")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
            />
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.signInCta")}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-content-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-medium text-primary underline">
          {t("auth.createOne")}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Card>&nbsp;</Card>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
