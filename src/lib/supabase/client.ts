import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur (composants "use client").
 * Utilise la clé anon publique ; toute la sécurité repose sur les policies RLS.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
