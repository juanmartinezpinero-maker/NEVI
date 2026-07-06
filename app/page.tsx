import Link from "next/link";
import { Header } from "@/components/Header";
import { SavingsCard } from "@/components/SavingsCard";
import { ProductCard } from "@/components/ProductCard";
import { AIInsightBanner } from "@/components/AIInsightBanner";
import { BottomNav } from "@/components/BottomNav";
import { mockAIInsight } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products";
import { getMonthlySpend } from "@/lib/purchases";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userName = user?.email?.split("@")[0] ?? "";
  const [products, spend] = await Promise.all([getProducts(), getMonthlySpend()]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <Header userName={userName} />

      <main className="flex flex-1 flex-col gap-5 pb-28">
        <SavingsCard savings={spend} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink">
              Autonomía de tus productos
            </h2>
            <Link href="/productos/nuevo" className="text-sm font-medium text-sage">
              + Añadir
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-black/5">
              <p className="text-sm text-ink/60">
                Todavía no tienes productos guardados. Añade el primero para empezar a ver su
                autonomía aquí.
              </p>
              <Link
                href="/productos/nuevo"
                className="mt-3 inline-block rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-white"
              >
                Añadir producto
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <AIInsightBanner message={mockAIInsight} />
      </main>

      <BottomNav />
    </div>
  );
}
