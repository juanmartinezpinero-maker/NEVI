import type { Product } from "@/types/product";
import { getUrgencyLevel, urgencyColors, urgencyTextClasses } from "@/lib/urgency";
import { markProductWastedAction } from "@/app/actions";
import { TrashIcon } from "@/components/icons";

interface ProductCardProps {
  product: Product;
}

const SIZE = 76;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProductCard({ product }: ProductCardProps) {
  const { name, icon, daysRemaining, cycleDays } = product;
  const urgency = getUrgencyLevel(daysRemaining);
  const progress = Math.max(0, Math.min(1, daysRemaining / cycleDays));
  const offset = CIRCUMFERENCE * (1 - progress);
  const ringColor = urgencyColors[urgency];
  const displayDays = Math.max(0, daysRemaining);

  return (
    <div className="relative flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
      <form action={markProductWastedAction.bind(null, product.id)} className="absolute right-2 top-2">
        <button
          type="submit"
          aria-label={`Marcar ${name} como desperdiciado`}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink/30 hover:bg-coral-red/10 hover:text-coral-red"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </form>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#EFEAE0"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-2xl"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <p className="text-center text-sm font-medium leading-tight text-ink">
        {name}
      </p>
      <p className={`text-xs font-semibold ${urgencyTextClasses[urgency]}`}>
        {daysRemaining <= 0
          ? "Toca comprar"
          : `${displayDays} ${displayDays === 1 ? "día" : "días"}`}
      </p>
    </div>
  );
}
