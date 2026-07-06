import { PageHeader } from "@/components/PageHeader";
import { AppShell } from "@/components/AppShell";
import { createProductAction } from "./actions";

export default function NuevoProductoPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <PageHeader title="Añadir producto" />

      <main className="flex flex-1 flex-col pb-28 md:pb-8">
        <form action={createProductAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
              Nombre del producto
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Leche"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
            />
          </div>

          <div>
            <label htmlFor="icon" className="mb-1 block text-sm font-medium text-ink">
              Icono (un emoji)
            </label>
            <input
              id="icon"
              name="icon"
              type="text"
              placeholder="🥛"
              maxLength={4}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
            />
          </div>

          <div>
            <label htmlFor="cycleDays" className="mb-1 block text-sm font-medium text-ink">
              ¿Cada cuántos días sueles comprarlo?
            </label>
            <input
              id="cycleDays"
              name="cycleDays"
              type="number"
              min={1}
              required
              placeholder="7"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
            />
          </div>

          <div>
            <label htmlFor="lastPurchasedAt" className="mb-1 block text-sm font-medium text-ink">
              Última vez que lo compraste
            </label>
            <input
              id="lastPurchasedAt"
              name="lastPurchasedAt"
              type="date"
              required
              defaultValue={today}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-sage"
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white"
          >
            Guardar producto
          </button>
        </form>
      </main>
    </AppShell>
  );
}
