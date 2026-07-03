import { PageHeader } from "@/components/PageHeader";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { BottomNav } from "@/components/BottomNav";

export default function EscanearPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader title="Escanear ticket" />
      <main className="flex flex-1 flex-col pb-28">
        <ReceiptScanner />
      </main>
      <BottomNav />
    </div>
  );
}
