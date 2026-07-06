import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { AppShell } from "@/components/AppShell";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <AppShell>
      <PageHeader title="Perfil" subtitle={session?.user.email} />
      <main className="flex flex-1 flex-col items-center pb-28 md:pb-8">
        <ComingSoon message="Aquí podrás gestionar tu familia y tus preferencias muy pronto." />
        <LogoutButton />
      </main>
    </AppShell>
  );
}
