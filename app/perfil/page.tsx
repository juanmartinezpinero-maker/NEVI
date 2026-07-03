import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { BottomNav } from "@/components/BottomNav";

export default function PerfilPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader title="Perfil" />
      <ComingSoon message="Aquí podrás gestionar tu familia y tus preferencias muy pronto." />
      <BottomNav />
    </div>
  );
}
