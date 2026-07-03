import type { WasteSummary } from "@/types/product";

interface WasteCardProps {
  waste: WasteSummary;
}

export function WasteCard({ waste }: WasteCardProps) {
  return (
    <section className="rounded-2xl border border-coral-red/20 bg-coral-red/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-coral-red">
        Desperdicio este mes
      </p>
      <p className="mt-1 font-heading text-2xl font-semibold text-ink">
        {waste.wastedAmount.toFixed(2)}
        {waste.currency}
      </p>
      <p className="mt-0.5 text-sm text-ink/60">
        {waste.wastedItemsCount} {waste.wastedItemsCount === 1 ? "producto caducó" : "productos caducaron"} sin usarse
      </p>
    </section>
  );
}
