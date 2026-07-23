"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n";

export function SignOutButton() {
  const { t } = useTranslation();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full px-3 py-1.5 text-sm text-content-muted hover:bg-surface-2 hover:text-content"
    >
      {t("nav.signOut")}
    </button>
  );
}
