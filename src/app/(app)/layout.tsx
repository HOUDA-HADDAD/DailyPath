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

  return (
    // Les activités sont chargées une seule fois et partagées : une
    // modification dans les réglages se reflète aussitôt sur « Aujourd'hui ».
    <ActivitiesProvider>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      <RemindersRunner />
    </ActivitiesProvider>
  );
}
