import { PageHeader } from "@/components/PageHeader";
import { ShoppingListItem } from "@/components/ShoppingListItem";
import { BottomNav } from "@/components/BottomNav";
import { mockShoppingList } from "@/lib/mock-data";

export default function ListaPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader
        title="Lista inteligente"
        subtitle="Lo que probablemente necesitas antes de tu próxima compra"
      />

      <main className="flex flex-1 flex-col gap-2 pb-28">
        {mockShoppingList.map((item) => (
          <ShoppingListItem key={item.id} item={item} />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
