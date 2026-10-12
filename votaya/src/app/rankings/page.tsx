import type { Metadata } from "next";
import Link from "next/link";
import { RankRow } from "@/components/RankRow";
import { countryFlag, countryName } from "@/lib/demographics";
import { getCountryRanking, listPolls, listTrending } from "@/lib/polls";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = { title: "Ranking de encuestas", description: "Las encuestas más votadas de VotaYa y los países que más opinan." };

const TABS = [
  { id: "siempre", label: "🏆 Histórico" },
  { id: "semana", label: "📈 Esta semana" },
  { id: "hoy", label: "🔥 Hoy" },
];

export default async function RankingsPage(props: PageProps<"/rankings">) {
  const sp = await props.searchParams;
  const tab = TABS.some((t) => t.id === sp.t) ? (sp.t as string) : "siempre";
  const cat = typeof sp.cat === "string" && CATEGORIES.some((c) => c.slug === sp.cat) ? sp.cat : undefined;
  const [polls, countries] = await Promise.all([
    tab === "siempre"
      ? listPolls({ order: "top", limit: 20, category: cat }).then((r) => r.map((p) => ({ ...p, value: p.voteCount })))
      : listTrending(tab === "hoy" ? 24 : 168, 40).then((r) => r.filter((p) => !cat || p.category === cat).slice(0, 20).map((p) => ({ ...p, value: p.recentVotes || p.voteCount }))),
    getCountryRanking(15),
  ]);
  const max = Math.max(1, ...polls.map((p) => p.value));
  const cmax = countries[0]?.n ?? 1;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card min-w-0 p-4 sm:p-6" aria-labelledby="rank-title">
        <h1 id="rank-title" className="font-display text-3xl font-extrabold">
          Ranking de encuestas
        </h1>
        <p className="text-muted">Las preguntas que más votos reciben.</p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/rankings?t=${t.id}${cat ? `&cat=${cat}` : ""}`}
              role="tab"
              aria-selected={t.id === tab}
              className={`rounded-full px-4 py-2 text-sm font-bold ${t.id === tab ? "bg-ink text-white" : "bg-slate-100 text-muted hover:text-ink"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          {[{ slug: "", name: "Todas", emoji: "✨" }, ...CATEGORIES].map((c) => (
            <Link
              key={c.slug || "all"}
              href={`/rankings?t=${tab}${c.slug ? `&cat=${c.slug}` : ""}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${(cat ?? "") === c.slug ? "border-brand bg-rose-50 text-brand" : "border-line text-muted"}`}
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
        <ol className="mt-4 space-y-1">
          {polls.map((p, i) => (
            <RankRow key={p.id} poll={p} rank={i + 1} value={p.value} max={max} note={tab === "siempre" ? "votos" : "votos recientes"} />
          ))}
        </ol>
        {!polls.length && <p className="py-6 text-center text-muted">Sin votos en este periodo todavía.</p>}
      </section>
      <aside className="space-y-4">
        <section className="card p-5" aria-labelledby="countries">
          <h2 id="countries" className="mb-3 font-display text-lg font-bold">
            🌍 Países que más opinan
          </h2>
          <ol className="space-y-3">
            {countries.map((c, i) => (
              <li key={c.country}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 font-bold text-muted">{i + 1}</span>
                  <span aria-hidden>{countryFlag(c.country)}</span>
                  <span className="flex-1 font-medium">{countryName(c.country)}</span>
                  <span className="tabular-nums text-muted">{c.n.toLocaleString("es-ES")}</span>
                </div>
                <div className="ml-7 mt-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet" style={{ width: `${(c.n / cmax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
