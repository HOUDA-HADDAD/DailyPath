"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    setLoading(false);

    if (error) {
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
        <h2 className="mb-4 text-lg font-semibold text-content">
          {t("auth.signUpTitle")}
        </h2>

        {success ? (
          <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-soft-fg">
            {t("auth.signUpSuccess")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="displayName">{t("auth.displayName")}</Label>
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                required
                placeholder={t("auth.displayNamePlaceholder")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-content-muted">
                {t("auth.passwordHint")}
              </p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
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
