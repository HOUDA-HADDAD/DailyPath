import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point de retour de la confirmation d'email Supabase.
 * Échange le code de connexion contre une session, puis redirige.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
