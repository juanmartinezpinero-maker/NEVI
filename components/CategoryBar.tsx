import type { CategorySpend } from "@/types/product";

interface CategoryBarProps {
  category: CategorySpend;
  maxAmount: number;
  currency: string;
}

export function CategoryBar({ category, maxAmount, currency }: CategoryBarProps) {
  const widthPct = maxAmount > 0 ? Math.round((category.amount / maxAmount) * 100) : 0;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink">{category.category}</span>
        <span className="text-ink/60">
          {category.amount.toFixed(2)}
          {currency}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full bg-deep-blue"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
