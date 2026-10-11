import type { Metadata } from "next";
import Link from "next/link";
import { PollCard } from "@/components/PollCard";
import { countryFlag, countryName } from "@/lib/demographics";
import { getCountryRanking, listPolls, listTrending } from "@/lib/polls";
import { formatCount } from "@/lib/text";

export const metadata: Metadata = { title: "Rankings y tendencias", description: "Las preguntas más votadas, tendencias del día y de la semana y los países que más opinan." };

const TABS = [
  { id: "hoy", label: "🔥 Hoy" },
  { id: "semana", label: "📈 Semana" },
  { id: "siempre", label: "🏆 Histórico" },
];

export default async function RankingsPage(props: PageProps<"/rankings">) {
  const sp = await props.searchParams;
  const tab = TABS.some((t) => t.id === sp.t) ? (sp.t as string) : "hoy";
  const [polls, countries, countriesWeek] = await Promise.all([
    tab === "siempre" ? listPolls({ order: "top", limit: 12 }) : listTrending(tab === "hoy" ? 24 : 168, 12),
    getCountryRanking(20),
    getCountryRanking(10, 7),
  ]);
  const max = countries[0]?.n ?? 1;
  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold">Rankings</h1>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4" aria-labelledby="top-polls">
          <h2 id="top-polls" className="font-display text-2xl font-extrabold">
            Preguntas más votadas
          </h2>
          <div className="flex gap-2" role="tablist">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`/rankings?t=${t.id}`}
                role="tab"
                aria-selected={t.id === tab}
                className={`rounded-full px-4 py-2 text-sm font-bold ${t.id === tab ? "bg-white text-ink" : "bg-ink-3 text-muted"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {polls.map((p, i) => (
              <PollCard key={p.id} poll={p} rank={i + 1} />
            ))}
          </div>
        </section>
        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="countries">
            <h2 id="countries" className="mb-3 font-display text-xl font-extrabold">
              🌍 Países que más opinan
            </h2>
            <ol className="space-y-2.5">
              {countries.map((c, i) => (
                <li key={c.country}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right font-black text-muted">{i + 1}</span>
                    <span aria-hidden>{countryFlag(c.country)}</span>
                    <span className="flex-1 font-semibold">{countryName(c.country)}</span>
                    <span className="text-muted">{formatCount(c.n)}</span>
                  </div>
                  <div className="ml-8 mt-1 h-1.5 rounded-full bg-ink-3">
                    <div className="bg-brand-gradient h-full rounded-full" style={{ width: `${(c.n / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="card p-5" aria-labelledby="countries-week">
            <h2 id="countries-week" className="mb-3 font-display text-xl font-extrabold">
              ⚡ Más activos esta semana
            </h2>
            <ol className="flex flex-wrap gap-2">
              {countriesWeek.map((c) => (
                <li key={c.country} className="rounded-full bg-ink-3 px-3 py-1 text-sm">
                  {countryFlag(c.country)} {countryName(c.country)} · {formatCount(c.n)}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
