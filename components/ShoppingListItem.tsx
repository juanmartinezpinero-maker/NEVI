import type { ShoppingListItem as ShoppingListItemType } from "@/types/product";
import { urgencyDotClasses } from "@/lib/urgency";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
}

export function ShoppingListItem({ item }: ShoppingListItemProps) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-black/5">
      <input
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded-md border-ink/20 text-sage accent-sage"
      />
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm-bg text-lg">
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
        <span className="block truncate text-xs text-ink/50">{item.reason}</span>
      </span>
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${urgencyDotClasses[item.urgency]}`}
        aria-hidden="true"
      />
    </label>
  );
}
