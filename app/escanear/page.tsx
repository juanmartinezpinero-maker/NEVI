import { PageHeader } from "@/components/PageHeader";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { AppShell } from "@/components/AppShell";

export default function EscanearPage() {
  return (
    <AppShell>
      <PageHeader title="Escanear ticket" />
      <main className="flex flex-1 flex-col pb-28 md:pb-8">
        <ReceiptScanner />
      </main>
    </AppShell>
  );
}
