import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { PollCard } from "@/lib/polls";
import { formatCount } from "@/lib/text";
import { Photo } from "./Photo";

/** Tendencias en carrusel horizontal (solo móvil), al estilo de Instagram. */
export function TrendCarousel({ polls }: { polls: PollCard[] }) {
  if (!polls.length) return null;
  return (
    <section className="lg:hidden" aria-labelledby="carousel-title">
      <div className="mb-2 flex items-end justify-between">
        <h2 id="carousel-title" className="font-display text-lg font-extrabold">
          🔥 En tendencia
        </h2>
        <Link href="/descubrir" className="text-sm font-bold text-brand">
          ⚡ Modo rápido
        </Link>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {polls.map((p) => {
          const cat = getCategory(p.category);
          return (
            <li key={p.id} className="w-40 shrink-0 snap-start">
              <Link href={`/p/${p.slug}`} className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line">
                <Photo
                  src={p.imageUrl ?? p.options[0]?.imageUrl}
                  alt=""
                  emoji={p.emoji ?? cat?.emoji}
                  gradient={cat?.gradient}
                  className="h-28 w-full [&>span]:text-4xl"
                />
                <span className="block p-2.5">
                  <span className="line-clamp-2 text-sm font-bold leading-tight">{p.title}</span>
                  <span className="mt-1 block text-xs text-muted">{formatCount(p.voteCount)} votos</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
