import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { PollGrid } from "@/components/PollCard";
import { CommunityBox, TrendingBox } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { getVotedPollIds, listPolls, listTrending } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Todas las encuestas", description: "Explora y filtra todas las encuestas de VotaYa por categoría." };

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

  let polls;
  if (sort === "tendencia" && !q) {
    polls = (await listTrending(168, 60)).filter((p) => !cat || p.category === cat).slice(0, page * PAGE);
  } else {
    polls = await listPolls({ category: cat, q: q || undefined, order: sort === "nuevas" ? "new" : "top", limit: page * PAGE + 1 });
  }
  const hasMore = polls.length > page * PAGE;
  polls = polls.slice(0, page * PAGE);
  const voted = await getVotedPollIds(user?.id ?? null, anonId);
  const qs = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { cat, q: q || undefined, orden: sort === "populares" ? undefined : sort, ...patch };
    Object.entries(merged).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
    const s = p.toString();
    return `/encuestas${s ? `?${s}` : ""}`;
  };
  const catInfo = cat ? getCategory(cat) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold">{catInfo ? `${catInfo.emoji} ${catInfo.name}` : "Todas las encuestas"}</h1>
          <p className="text-muted">Filtra por tema, busca y vota. Cada voto suma puntos.</p>
        </header>
        <form role="search" className="flex gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <label htmlFor="polls-q" className="sr-only">
            Buscar encuestas
          </label>
          <input
            id="polls-q"
            name="q"
            defaultValue={q}
            placeholder="Busca: Messi, pizza, series, países…"
            className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-rose-300"
          />
          <button className="rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark">Buscar</button>
        </form>
        <CategoryChips active={cat} extraQuery={q ? `q=${encodeURIComponent(q)}` : ""} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist" aria-label="Ordenar">
            {SORTS.map((s) => (
              <Link
                key={s.id}
                href={qs({ orden: s.id === "populares" ? undefined : s.id, pagina: undefined })}
                role="tab"
                aria-selected={s.id === sort}
                className={`rounded-lg px-3 py-1.5 ${s.id === sort ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {s.label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted">
            {polls.length}
            {hasMore ? "+" : ""} encuestas{q ? ` para «${q}»` : ""}
          </p>
        </div>
        <PollGrid polls={polls} votedIds={voted} />
        {hasMore && (
          <div className="text-center">
            <Link href={qs({ pagina: page + 1 })} scroll={false} className="inline-block rounded-full border border-line bg-white px-6 py-2.5 text-sm font-bold hover:border-rose-300">
              Cargar más encuestas
            </Link>
          </div>
        )}
        {!polls.length && (
          <p className="text-center">
            ¿No existe?{" "}
            <Link href="/crear" className="font-bold text-brand underline">
              Propón esta pregunta
            </Link>
          </p>
        )}
      </div>
      <aside className="space-y-4">
        <TrendingBox />
        <CommunityBox />
      </aside>
    </div>
  );
}
