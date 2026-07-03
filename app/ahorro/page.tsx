import { PageHeader } from "@/components/PageHeader";
import { SavingsCard } from "@/components/SavingsCard";
import { WasteCard } from "@/components/WasteCard";
import { CategoryBar } from "@/components/CategoryBar";
import { BottomNav } from "@/components/BottomNav";
import { mockSavings, mockWasteSummary, mockCategorySpend } from "@/lib/mock-data";

export default function AhorroPage() {
  const maxAmount = Math.max(...mockCategorySpend.map((c) => c.amount));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader title="Ahorro y desperdicio" />

      <main className="flex flex-1 flex-col gap-5 pb-28">
        <SavingsCard savings={mockSavings} />
        <WasteCard waste={mockWasteSummary} />

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
            Gasto por categoría
          </h2>
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
            {mockCategorySpend.map((category) => (
              <CategoryBar
                key={category.category}
                category={category}
                maxAmount={maxAmount}
                currency={mockSavings.currency}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
