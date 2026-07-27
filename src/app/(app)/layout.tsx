import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { RemindersRunner } from "@/components/layout/RemindersRunner";
import { ActivitiesProvider } from "@/lib/activities/provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Résolu côté serveur pour que l'onglet Administration ne soit rendu que
  // pour un administrateur. La RLS et la garde `is_admin()` de la fonction SQL
  // restent la vraie barrière : ceci évite surtout d'exposer une entrée que
  // l'utilisateur ne peut pas emprunter.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return (
    // Les activités sont chargées une seule fois et partagées : une
    // modification dans les réglages se reflète aussitôt sur « Aujourd'hui ».
    <ActivitiesProvider>
      <Navbar isAdmin={profile?.is_admin === true} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      <RemindersRunner />
    </ActivitiesProvider>
  );
}
