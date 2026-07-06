import type { SavingsSummary } from "@/types/product";

interface SavingsCardProps {
  savings: SavingsSummary;
}

export function SavingsCard({ savings }: SavingsCardProps) {
  const { currentMonth, previousMonth, currency } = savings;
  const diff = currentMonth - previousMonth;
  const diffPct = previousMonth > 0 ? Math.round((diff / previousMonth) * 100) : 0;
  const isUp = diff >= 0;

  return (
    <section className="rounded-3xl bg-linear-to-br from-sage to-sage-dark p-5 text-white shadow-lg shadow-sage/20">
      <p className="text-sm font-medium text-white/80">Gasto este mes</p>
      <p className="mt-1 font-heading text-4xl font-semibold tabular-nums">
        {currentMonth.toFixed(2)}
        <span className="ml-1 text-2xl">{currency}</span>
      </p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
        <span aria-hidden="true">{isUp ? "▲" : "▼"}</span>
        <span>
          {Math.abs(diffPct)}% {isUp ? "más" : "menos"} que el mes pasado
        </span>
      </div>
    </section>
  );
}
