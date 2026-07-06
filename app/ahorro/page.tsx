import { PageHeader } from "@/components/PageHeader";
import { SavingsCard } from "@/components/SavingsCard";
import { WasteCard } from "@/components/WasteCard";
import { CategoryBar } from "@/components/CategoryBar";
import { AppShell } from "@/components/AppShell";
import { getMonthlySpend, getCategorySpend, getWasteSummary } from "@/lib/purchases";

export default async function AhorroPage() {
  const [spend, categorySpend, waste] = await Promise.all([
    getMonthlySpend(),
    getCategorySpend(),
    getWasteSummary(),
  ]);
  const maxAmount = Math.max(1, ...categorySpend.map((c) => c.amount));

  return (
    <AppShell>
      <PageHeader title="Ahorro y desperdicio" />

      <main className="flex flex-1 flex-col gap-5 pb-28 md:pb-8">
        <div className="flex flex-col gap-5 md:grid md:grid-cols-2">
          <SavingsCard savings={spend} />
          <WasteCard waste={waste} />
        </div>

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
            Gasto por categoría
          </h2>
          {categorySpend.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-black/5">
              <p className="text-sm text-ink/60">
                Todavía no hay compras registradas este mes. Escanea un ticket para empezar a ver
                tu gasto real aquí.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
              {categorySpend.map((category) => (
                <CategoryBar
                  key={category.category}
                  category={category}
                  maxAmount={maxAmount}
                  currency={spend.currency}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
