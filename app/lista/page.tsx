import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ShoppingListItem } from "@/components/ShoppingListItem";
import { BottomNav } from "@/components/BottomNav";
import { getShoppingList } from "@/lib/products";

export default async function ListaPage() {
  const shoppingList = await getShoppingList();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col bg-warm-bg px-4">
      <PageHeader
        title="Lista inteligente"
        subtitle="Lo que probablemente necesitas antes de tu próxima compra"
      />

      <main className="flex flex-1 flex-col gap-2 pb-28">
        {shoppingList.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-black/5">
            <p className="text-sm text-ink/60">
              No hay nada urgente en tu lista por ahora. Añade productos para que nevi te avise
              cuando se estén acabando.
            </p>
            <Link
              href="/productos/nuevo"
              className="mt-3 inline-block rounded-xl bg-sage px-4 py-2 text-sm font-semibold text-white"
            >
              Añadir producto
            </Link>
          </div>
        ) : (
          shoppingList.map((item) => <ShoppingListItem key={item.id} item={item} />)
        )}
      </main>

      <BottomNav />
    </div>
  );
}
