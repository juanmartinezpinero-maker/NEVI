import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

/** Filtros por categoría en forma de píldoras desplazables. */
export function CategoryChips({ active, extraQuery = "" }: { active?: string; extraQuery?: string }) {
  const items = [{ slug: "", name: "Todas", emoji: "✨" }, ...CATEGORIES];
  return (
    <nav aria-label="Filtrar por categoría" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((c) => {
        const on = (active ?? "") === c.slug;
        const q = [c.slug && `cat=${c.slug}`, extraQuery].filter(Boolean).join("&");
        return (
          <Link
            key={c.slug || "all"}
            href={`/encuestas${q ? `?${q}` : ""}`}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
              on ? "border-brand bg-brand text-white" : "border-line bg-white text-ink/80 hover:border-rose-300"
            }`}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}
