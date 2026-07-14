import { PageHeader } from "@/components/PageHeader";
import { AppShell } from "@/components/AppShell";
import { RecetasTabs } from "@/components/RecetasTabs";
import { getProducts } from "@/lib/products";
import { getHousehold } from "@/lib/household";

export default async function RecetasPage() {
  const [products, household] = await Promise.all([getProducts(), getHousehold()]);
  const hasPreferences = Boolean(household?.memberCount || household?.dietaryNotes);

  return (
    <AppShell>
      <PageHeader title="Ideas de recetas" subtitle="Con lo que ya tienes en casa" />
      <main className="flex flex-1 flex-col pb-28 md:pb-8">
        <RecetasTabs hasProducts={products.length > 0} hasPreferences={hasPreferences} />
      </main>
    </AppShell>
  );
}
