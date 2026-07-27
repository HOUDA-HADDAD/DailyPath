import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes accessibles sans session. */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

/** Routes dont un utilisateur déjà connecté doit être détourné. */
const AUTH_ONLY_PATHS = new Set(["/login", "/signup"]);

/**
 * Rafraîchit la session Supabase à chaque requête et redirige les visiteurs
 * non authentifiés hors des zones protégées.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next");

  // Non connecté sur une route protégée -> /login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Déjà connecté sur login/signup -> /today
  // (/reset-password est volontairement exclu : la session de récupération est
  // active à ce moment-là, l'utilisateur doit pouvoir finir de changer son
  // mot de passe.)
  if (user && AUTH_ONLY_PATHS.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
