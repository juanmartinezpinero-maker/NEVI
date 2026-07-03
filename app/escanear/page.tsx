import { PageHeader } from "@/components/PageHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { BottomNav } from "@/components/BottomNav";

export default function EscanearPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader title="Escanear ticket" />
      <ComingSoon message="Muy pronto podrás escanear tus tickets de supermercado aquí para analizarlos automáticamente." />
      <BottomNav />
    </div>
  );
}
