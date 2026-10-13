import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { Photo } from "@/components/Photo";
import { PollCard, PollGrid } from "@/components/PollCard";
import { CommunityBox, TrendingBox } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getVotedPollIds, listPolls, listTrending } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Explorar encuestas", description: "Explora y filtra todas las encuestas de voppi! por categoría." };

const SORTS = [
  { id: "populares", label: "Más votadas" },
  { id: "nuevas", label: "Nuevas" },
  { id: "tendencia", label: "En tendencia" },
] as const;
const PAGE = 12;

export default async function PollsPage(props: PageProps<"/encuestas">) {
  const sp = await props.searchParams;
  const cat = typeof sp.cat === "string" && getCategory(sp.cat) ? sp.cat : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const sort = SORTS.find((s) => s.id === sp.orden)?.id ?? "populares";
  const page = Math.max(1, Math.min(50, Number(sp.pagina) || 1));
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const landing = !cat && !q && sort === "populares" && page === 1;

  let polls;
  if (sort === "tendencia" && !q) {
    polls = (await listTrending(168, 60)).filter((p) => !cat || p.category === cat).slice(0, page * PAGE);
  } else {
    polls = await listPolls({ category: cat, q: q || undefined, order: sort === "nuevas" ? "new" : "top", limit: page * PAGE + 1 });
  }
  const hasMore = polls.length > page * PAGE;
  polls = polls.slice(0, page * PAGE);
  const [voted, trending] = await Promise.all([getVotedPollIds(user?.id ?? null, anonId), landing ? listTrending(24, 8) : Promise.resolve([])]);

  // Foto de portada por categoría: la de su encuesta más votada.
  const covers = new Map<string, string | null>();
  if (landing) for (const p of polls) if (!covers.has(p.category)) covers.set(p.category, p.imageUrl ?? p.options[0]?.imageUrl ?? null);

  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { cat, q: q || undefined, orden: sort === "populares" ? undefined : sort, ...patch };
    Object.entries(merged).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
    const s = p.toString();
    return `/encuestas${s ? `?${s}` : ""}`;
  };
  const catInfo = cat ? getCategory(cat) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-7">
        <header className="space-y-4">
          <div>
            {catInfo && (
              <Link href="/encuestas" className="kicker hover:text-ink">
                ← Explorar
              </Link>
            )}
            <h1 className="text-[40px] font-black leading-none tracking-[-0.05em] sm:text-[52px]" style={catInfo ? { color: catInfo.tone } : undefined}>
              {catInfo ? catInfo.name : "Explorar"}
            </h1>
          </div>
          <form role="search" className="flex gap-2 rounded-full bg-wash p-1.5">
            {cat && <input type="hidden" name="cat" value={cat} />}
            <label htmlFor="polls-q" className="sr-only">
              Buscar encuestas
            </label>
            <input
              id="polls-q"
              name="q"
              defaultValue={q}
              placeholder="Busca: Messi, pizza, series, países…"
              className="min-w-0 flex-1 bg-transparent px-4 text-base font-medium outline-none"
            />
            <button className="rounded-full bg-ink px-5 py-2.5 font-extrabold text-lime">Buscar</button>
          </form>
          <CategoryChips active={cat} extraQuery={q ? `q=${encodeURIComponent(q)}` : ""} />
        </header>

        {landing && trending.length > 0 && (
          <section aria-labelledby="trend-h" className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 id="trend-h" className="text-[26px] font-black tracking-[-0.045em]">
                Tendencias hoy
              </h2>
              <Link href={qs({ orden: "tendencia" })} className="text-sm font-extrabold underline">
                Ver todas
              </Link>
            </div>
            <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
              {trending.map((p) => (
                <PollCard key={p.id} poll={p} voted={voted.has(p.id)} className="w-[260px] shrink-0 snap-start" />
              ))}
            </div>
          </section>
        )}

        {landing && (
          <section aria-labelledby="cats-h" className="space-y-3">
            <h2 id="cats-h" className="text-[26px] font-black tracking-[-0.045em]">
              Categorías
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/encuestas?cat=${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-[22px] text-white">
                  <Photo src={covers.get(c.slug)} alt="" label={c.name} tone={c.tone} className="absolute inset-0 h-full w-full transition group-hover:scale-[1.03]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
                  <span className="absolute bottom-3 left-3.5 text-xl font-black tracking-[-0.04em]">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="list-h" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="list-h" className="text-[26px] font-black tracking-[-0.045em]">
              {q ? `Resultados para «${q}»` : landing ? "Todas las encuestas" : "Encuestas"}
            </h2>
            <div className="flex gap-1 rounded-full bg-wash p-1 text-sm font-bold" role="tablist" aria-label="Ordenar">
              {SORTS.map((s) => (
                <Link
                  key={s.id}
                  href={qs({ orden: s.id === "populares" ? undefined : s.id, pagina: undefined })}
                  role="tab"
                  aria-selected={s.id === sort}
                  className={`rounded-full px-3.5 py-1.5 ${s.id === sort ? "bg-ink text-lime" : "text-muted hover:text-ink"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted">
            {polls.length}
            {hasMore ? "+" : ""} encuestas
          </p>
          <PollGrid polls={polls} votedIds={voted} />
          {hasMore && (
            <div className="text-center">
              <Link href={qs({ pagina: page + 1 })} scroll={false} className="inline-block rounded-full border-2 border-ink px-6 py-2.5 text-sm font-extrabold hover:bg-lime">
                Cargar más encuestas
              </Link>
            </div>
          )}
          {!polls.length && (
            <p className="text-center">
              ¿No existe?{" "}
              <Link href="/crear" className="font-extrabold text-pink underline">
                Propón esta pregunta
              </Link>
            </p>
          )}
        </section>
      </div>
      <aside className="space-y-4">
        <TrendingBox />
        <CommunityBox />
      </aside>
    </div>
  );
}
