import Link from "next/link";
import { PollCard, PollGrid } from "@/components/PollCard";
import { PollVoter } from "@/components/PollVoter";
import { TrackView } from "@/components/TrackView";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { countryFlag, countryName } from "@/lib/demographics";
import { findExistingVote, getCountryRanking, getFeaturedPoll, getResults, getSiteTotals, getVotedPollIds, listPolls, listTrending } from "@/lib/polls";
import { getAnonId, getBaseUrl } from "@/lib/request";
import { formatCount } from "@/lib/text";

export default async function Home() {
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const [featured, trending, latest, sponsored, countries, totals, votedIds] = await Promise.all([
    getFeaturedPoll(),
    listTrending(24, 6),
    listPolls({ order: "new", limit: 6, sponsored: false }),
    listPolls({ sponsored: true, limit: 3 }),
    getCountryRanking(5),
    getSiteTotals(),
    getVotedPollIds(user?.id ?? null, anonId),
  ]);
  const existing = featured ? await findExistingVote(featured.id, user?.id ?? null, anonId) : null;
  const initial = featured && existing ? { results: await getResults(featured.id), myOptionId: existing.optionId, myWriteInId: existing.writeInId } : null;
  const base = await getBaseUrl();
  const cat = featured ? getCategory(featured.category) : null;

  return (
    <div className="space-y-10">
      <TrackView path="/" />
      <section className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 pt-2 lg:pt-8">
          <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            El mundo opina.
            <br />
            <span className="text-gradient">¿Y tú?</span>
          </h1>
          <p className="hidden max-w-md text-lg text-muted sm:block">
            Vota preguntas divertidas y polémicas en un toque, mira al instante qué piensa la gente y compártelo.
          </p>
          <dl className="hidden gap-6 text-sm sm:flex">
            <div>
              <dt className="text-muted">Votos</dt>
              <dd className="font-display text-2xl font-extrabold">{formatCount(totals.votes)}</dd>
            </div>
            <div>
              <dt className="text-muted">Encuestas</dt>
              <dd className="font-display text-2xl font-extrabold">{formatCount(totals.polls)}</dd>
            </div>
            <div>
              <dt className="text-muted">Países</dt>
              <dd className="font-display text-2xl font-extrabold">{totals.countries}</dd>
            </div>
          </dl>
        </div>

        {featured ? (
          <article className="card relative overflow-hidden p-5 sm:p-6" aria-labelledby="featured-title">
            <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="bg-brand-gradient rounded-full px-3 py-1 text-white">⭐ Pregunta del día</span>
              <span className="text-muted">
                {cat?.emoji} {cat?.name}
              </span>
            </div>
            <h2 id="featured-title" className="mb-4 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              <Link href={`/p/${featured.slug}`}>{featured.title}</Link>
            </h2>
            <PollVoter
              poll={featured}
              initial={initial}
              verified={Boolean(user?.profileCompleted)}
              shareUrl={`${base}/p/${featured.slug}`}
              compact
            />
            {featured.isDemo && <p className="mt-3 text-center text-[11px] text-amber-300/80">Datos de demostración ficticios</p>}
          </article>
        ) : (
          <div className="card p-6 text-center text-muted">Aún no hay encuestas publicadas.</div>
        )}
      </section>

      <form action="/buscar" role="search" className="relative">
        <label htmlFor="home-search" className="sr-only">
          Buscar encuestas
        </label>
        <input
          id="home-search"
          name="q"
          placeholder="Busca: Messi, pizza, series, países…"
          className="w-full rounded-2xl border border-line bg-ink-2 px-5 py-4 pl-12 text-base outline-none focus:border-fuchsia-400"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2" aria-hidden>
          🔍
        </span>
      </form>

      <section aria-labelledby="cats">
        <h2 id="cats" className="sr-only">
          Categorías
        </h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:flex-wrap">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className={`shrink-0 rounded-full bg-gradient-to-r ${c.gradient} px-4 py-2 text-sm font-bold text-white shadow`}
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="trending" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="trending" className="font-display text-2xl font-extrabold">
            🔥 En tendencia
          </h2>
          <Link href="/rankings" className="text-sm font-bold text-fuchsia-300">
            Ver rankings →
          </Link>
        </div>
        <PollGrid polls={trending} votedIds={votedIds} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-extrabold">🆕 Últimas preguntas</h2>
            <Link href="/descubrir" className="text-sm font-bold text-fuchsia-300">
              Modo descubrir ⚡
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {latest.map((p) => (
              <PollCard key={p.id} poll={p} voted={votedIds.has(p.id)} />
            ))}
          </div>
        </div>
        <aside className="card h-fit space-y-3 p-5" aria-labelledby="world">
          <h2 id="world" className="font-display text-xl font-extrabold">
            🌍 Ranking mundial
          </h2>
          <p className="text-sm text-muted">Países que más votan</p>
          <ol className="space-y-2">
            {countries.map((c, i) => (
              <li key={c.country} className="flex items-center gap-3">
                <span className="w-5 text-right font-black text-muted">{i + 1}</span>
                <span className="text-2xl" aria-hidden>
                  {countryFlag(c.country)}
                </span>
                <span className="flex-1 font-semibold">{countryName(c.country)}</span>
                <span className="text-sm text-muted">{formatCount(c.n)}</span>
              </li>
            ))}
          </ol>
          <Link href="/rankings" className="block pt-2 text-sm font-bold text-fuchsia-300">
            Todas las clasificaciones →
          </Link>
        </aside>
      </section>

      <section aria-labelledby="sponsored" className="space-y-4">
        <h2 id="sponsored" className="font-display text-2xl font-extrabold">
          🤝 Encuestas patrocinadas
        </h2>
        {sponsored.length ? (
          <PollGrid polls={sponsored} votedIds={votedIds} />
        ) : (
          <div className="card flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
            <span className="text-4xl" aria-hidden>
              📣
            </span>
            <p className="flex-1 text-muted">
              Próximamente: marcas y creadores lanzarán aquí sus preguntas, siempre señalizadas como patrocinadas.
            </p>
            <Link href="/empresas" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">
              Soy una marca
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
