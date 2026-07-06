import Link from "next/link";
import { Header } from "@/components/Header";
import { SavingsCard } from "@/components/SavingsCard";
import { ProductCard } from "@/components/ProductCard";
import { AIInsightBanner } from "@/components/AIInsightBanner";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products";
import { getMonthlySpend } from "@/lib/purchases";

function urgentInsight(products: Awaited<ReturnType<typeof getProducts>>): string | null {
  const urgent = products
    .filter((p) => p.daysRemaining <= 3)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
  if (!urgent) return null;

  return urgent.daysRemaining <= 0
    ? `Según tu ritmo de compra, es probable que ya se te haya acabado ${urgent.icon} ${urgent.name}.`
    : `Según tu ritmo de compra, ${urgent.icon} ${urgent.name} se te acabará en ${urgent.daysRemaining} ${urgent.daysRemaining === 1 ? "día" : "días"}.`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [
    {
      data: { session },
    },
    products,
    spend,
  ] = await Promise.all([supabase.auth.getSession(), getProducts(), getMonthlySpend()]);
  const userName = session?.user.email?.split("@")[0] ?? "";
  const insight = urgentInsight(products);

  return (
    <AppShell>
      <Header userName={userName} />

      <main className="flex flex-1 flex-col gap-5 pb-28 md:pb-8">
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
                Escanea tu primer ticket y nevi empezará a calcular cuándo se te acaba cada cosa.
              </p>
              <Link
                href="/escanear"
                className="mt-3 inline-block rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-white"
              >
                Escanear ticket
              </Link>
              <p className="mt-3 text-xs text-ink/50">
                O{" "}
                <Link href="/productos/nuevo" className="font-medium text-sage underline">
                  añade un producto a mano
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {insight && <AIInsightBanner message={insight} />}
      </main>
    </AppShell>
  );
}
