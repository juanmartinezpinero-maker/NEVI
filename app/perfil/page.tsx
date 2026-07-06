import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { BottomNav } from "@/components/BottomNav";
import { LogoutButton } from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader title="Perfil" subtitle={session?.user.email} />
      <main className="flex flex-1 flex-col items-center pb-28">
        <ComingSoon message="Aquí podrás gestionar tu familia y tus preferencias muy pronto." />
        <LogoutButton />
      </main>
      <BottomNav />
    </div>
  );
}
