import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { RankRow } from "@/components/RankRow";
import { countryFlag, countryName } from "@/lib/demographics";
import { getCountryRanking, listPolls, listTrending } from "@/lib/polls";
import { CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = { title: "Ranking de encuestas", description: "Las encuestas más votadas de voppi! y los países que más opinan." };

const TABS = [
  { id: "siempre", label: "Histórico" },
  { id: "semana", label: "Esta semana" },
  { id: "hoy", label: "Hoy" },
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
  const cmax = countries[0]?.n ?? 1;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5" aria-labelledby="rank-title">
        <header>
          <p className="kicker">Las más votadas</p>
          <h1 id="rank-title" className="text-[40px] font-black leading-none tracking-[-0.05em] sm:text-[52px]">
            Ranking
          </h1>
        </header>
        <div className="flex w-fit gap-1 rounded-full bg-wash p-1 text-sm font-bold" role="tablist">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/rankings?t=${t.id}${cat ? `&cat=${cat}` : ""}`}
              role="tab"
              aria-selected={t.id === tab}
              className={`rounded-full px-4 py-2 ${t.id === tab ? "bg-ink text-lime" : "text-muted hover:text-ink"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <CategoryChips active={cat} base="/rankings" extraQuery={`t=${tab}`} />
        <ol>
          {polls.map((p, i) => (
            <RankRow key={p.id} poll={p} rank={i + 1} value={p.value} note={tab === "siempre" ? "votos" : "votos recientes"} />
          ))}
        </ol>
        {!polls.length && <p className="rounded-3xl bg-wash p-8 text-center text-muted">Sin votos en este periodo todavía.</p>}
      </section>
      <aside className="space-y-4">
        <section className="rounded-[22px] bg-wash p-5" aria-labelledby="countries">
          <h2 id="countries" className="mb-3 text-[22px] font-extrabold tracking-[-0.04em]">
            Países que más opinan
          </h2>
          <ol className="space-y-3">
            {countries.map((c, i) => (
              <li key={c.country}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 font-black text-pink">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden>{countryFlag(c.country)}</span>
                  <span className="flex-1 font-medium">{countryName(c.country)}</span>
                  <span className="font-bold tabular-nums">{c.n.toLocaleString("es-ES")}</span>
                </div>
                <div className="ml-8 mt-1 h-1.5 rounded-full bg-line">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(c.n / cmax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
