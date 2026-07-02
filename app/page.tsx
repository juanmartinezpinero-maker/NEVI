import { Header } from "@/components/Header";
import { SavingsCard } from "@/components/SavingsCard";
import { ProductCard } from "@/components/ProductCard";
import { AIInsightBanner } from "@/components/AIInsightBanner";
import { BottomNav } from "@/components/BottomNav";
import { mockUserName, mockSavings, mockProducts, mockAIInsight } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <Header userName={mockUserName} />

      <main className="flex flex-1 flex-col gap-5 pb-28">
        <SavingsCard savings={mockSavings} />

        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
            Autonomía de tus productos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {mockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <AIInsightBanner message={mockAIInsight} />
      </main>

      <BottomNav />
    </div>
  );
}
