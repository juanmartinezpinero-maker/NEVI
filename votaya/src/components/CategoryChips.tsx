import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

/** Filtros por categoría: píldoras con un punto del color de cada tema. */
export function CategoryChips({ active, extraQuery = "", base = "/encuestas" }: { active?: string; extraQuery?: string; base?: string }) {
  const items = [{ slug: "", name: "Todas", tone: "#222128" }, ...CATEGORIES];
  return (
    <nav aria-label="Filtrar por categoría" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((c) => {
        const on = (active ?? "") === c.slug;
        const q = [c.slug && `cat=${c.slug}`, extraQuery].filter(Boolean).join("&");
        return (
          <Link
            key={c.slug || "all"}
            href={`${base}${q ? `?${q}` : ""}`}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-bold ${on ? "bg-lime ring-2 ring-inset ring-ink" : "bg-wash text-ink-2 hover:bg-line"}`}
          >
            {c.slug && <span className="h-2 w-2 rounded-full" style={{ background: c.tone }} aria-hidden />}
            {c.name}
          </Link>
        );
      })}
    </nav>
  );
}
