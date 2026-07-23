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

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(t("auth.genericError"));
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <AuthShell>
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-content">
          {t("auth.signInTitle")}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
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
    </AuthShell>
  );
}
