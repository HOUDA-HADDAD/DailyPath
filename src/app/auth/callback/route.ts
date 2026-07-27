import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point de retour des liens envoyés par email (confirmation d'inscription et
 * réinitialisation de mot de passe). Échange le code contre une session, puis
 * redirige vers `next`.
 *
 * En cas d'échec (lien déjà utilisé ou expiré), on redirige vers la
 * destination avec `?error=expired` afin d'afficher un message explicite
 * plutôt qu'un écran de connexion sans explication.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  // `next` est contraint à un chemin interne : empêche une redirection ouverte.
  const requestedNext = searchParams.get("next") ?? "/today";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/today";

  const failureTarget =
    next === "/reset-password" ? "/reset-password?error=expired" : "/login?error=expired";

  if (errorParam) {
    return NextResponse.redirect(`${origin}${failureTarget}`);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}${failureTarget}`);
  }

  return NextResponse.redirect(`${origin}${failureTarget}`);
}
