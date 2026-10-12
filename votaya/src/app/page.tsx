import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { Photo } from "@/components/Photo";
import { PollCard, PollGrid } from "@/components/PollCard";
import { PollVoter } from "@/components/PollVoter";
import { RankRow } from "@/components/RankRow";
import { CommunityBox, CountriesBox, TrendingBox } from "@/components/Sidebar";
import { TrackView } from "@/components/TrackView";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { findExistingVote, getFeaturedPoll, getResults, getSiteTotals, getVotedPollIds, listPolls, listTrending } from "@/lib/polls";
import { getAnonId, getBaseUrl } from "@/lib/request";
import { formatCount } from "@/lib/text";

const h2 = "text-[28px] font-black tracking-[-0.045em] sm:text-[34px]";

/** Portada: resumen de toda la web (pregunta del día, tendencias, categorías, populares, ranking). */
export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const cat = typeof sp.cat === "string" && getCategory(sp.cat) ? sp.cat : undefined;
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const [votedIds, featured, popular, trending, top, totals] = await Promise.all([
    getVotedPollIds(user?.id ?? null, anonId),
    getFeaturedPoll(),
    listPolls({ order: "top", limit: 10, sponsored: false, category: cat }),
    listTrending(24, 8),
    listPolls({ order: "top", limit: 5 }),
    getSiteTotals(),
  ]);
  const existing = featured ? await findExistingVote(featured.id, user?.id ?? null, anonId) : null;
  const initial = featured && existing ? { results: await getResults(featured.id), myOptionId: existing.optionId, myWriteInId: existing.writeInId } : null;
  const base = await getBaseUrl();
  const fcat = featured ? getCategory(featured.category) : null;
  const grid = popular.filter((p) => p.id !== featured?.id).slice(0, 6);

  // Portada de cada categoría: la foto de su encuesta más votada.
  const all = await listPolls({ order: "top", limit: 60 });
  const covers = new Map<string, string | null>();
  for (const p of all) if (!covers.has(p.category)) covers.set(p.category, p.imageUrl ?? p.options[0]?.imageUrl ?? null);

  return (
    <div className="space-y-12 sm:space-y-14">
      <TrackView path="/" />

      {/* Presentación */}
      <section className="grid items-end gap-5 pt-2 lg:grid-cols-[minmax(0,1fr)_auto]" aria-labelledby="hero">
        <div>
          <h1 id="hero" className="text-[46px] font-black leading-[0.95] tracking-[-0.06em] sm:text-[72px]">
            El mundo opina.
            <br />
            ¿Y tú<span className="text-pink">?</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink-2">Vota en segundos, mira qué piensa la gente de tu país y reta a tus amigos. Gratis y sin contraseña.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/descubrir" className="rounded-full bg-ink px-6 py-3.5 font-extrabold text-lime">
              Empezar a votar
            </Link>
            <Link href="/encuestas" className="rounded-full border-2 border-ink px-6 py-3 font-extrabold">
              Explorar encuestas
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[420px]">
          {[
            [formatCount(totals.votes), "votos"],
            [String(totals.polls), "encuestas"],
            [String(totals.countries), "países"],
          ].map(([n, l], i) => (
            <div key={l} className={`rounded-[22px] p-4 ${i === 0 ? "bg-lime" : i === 1 ? "bg-ink text-white" : "bg-wash"}`}>
              <dt className="sr-only">{l}</dt>
              <dd className={`whitespace-nowrap text-[24px] font-black leading-none sm:text-[30px] tracking-[-0.05em] tabular-nums ${i === 1 ? "text-lime" : ""}`}>{n}</dd>
              <dd className={`mt-1 text-xs font-semibold ${i === 1 ? "text-white/70" : "text-muted"}`}>{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Pregunta del día + columna lateral */}
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        {featured && (
          <section className="rounded-[28px] bg-lime p-5 sm:p-7" aria-labelledby="daily">
            <span className="kicker !text-ink">Pregunta del día · {fcat?.name}</span>
            <h2 id="daily" className="mb-5 mt-2 text-[34px] font-black leading-[1] tracking-[-0.055em] sm:text-[56px]">
              {featured.title}
            </h2>
            <PollVoter poll={featured} initial={initial} verified={Boolean(user?.profileCompleted)} shareUrl={`${base}/p/${featured.slug}`} compact tone={fcat?.tone} />
          </section>
        )}
        <aside className="hidden gap-4 lg:grid">
          <TrendingBox />
          <CommunityBox />
        </aside>
      </div>

      {/* Tendencias */}
      <section aria-labelledby="trend-h" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 id="trend-h" className={h2}>
            Tendencias hoy
          </h2>
          <Link href="/tendencias" className="text-sm font-extrabold underline">
            Ver todas
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-2">
          {trending.map((p) => (
            <PollCard key={p.id} poll={p} voted={votedIds.has(p.id)} className="w-[260px] shrink-0 snap-start" />
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section aria-labelledby="cats-h" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 id="cats-h" className={h2}>
            Categorías
          </h2>
          <Link href="/encuestas" className="text-sm font-extrabold underline">
            Explorar
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/encuestas?cat=${c.slug}`} className="group relative aspect-[4/3] overflow-hidden rounded-[22px] text-white">
              <Photo src={covers.get(c.slug)} alt="" label={c.name} tone={c.tone} className="absolute inset-0 h-full w-full transition group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
              <span className="absolute bottom-3 left-3.5 text-lg font-black tracking-[-0.04em] sm:text-xl">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Populares */}
      <section aria-labelledby="popular" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 id="popular" className={h2}>
            Encuestas populares
          </h2>
          <Link href="/encuestas" className="text-sm font-extrabold underline">
            Ver todas
          </Link>
        </div>
        <CategoryChips active={cat} base="/" />
        <PollGrid polls={grid} votedIds={votedIds} />
      </section>

      {/* Ranking y países */}
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="rank-h">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="rank-h" className={h2}>
              Ranking
            </h2>
            <Link href="/rankings" className="text-sm font-extrabold underline">
              Ranking completo
            </Link>
          </div>
          <ol>
            {top.map((p, i) => (
              <RankRow key={p.id} poll={p} rank={i + 1} value={p.voteCount} />
            ))}
          </ol>
        </section>
        <CountriesBox />
      </div>

      {/* Llamada final */}
      <section className="grid gap-4 rounded-[28px] bg-ink p-6 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
        <div>
          <h2 className="text-[30px] font-black leading-none tracking-[-0.05em] sm:text-[40px]">
            ¿Tienes una pregunta<span className="text-pink">?</span>
          </h2>
          <p className="mt-2 text-white/75">Propón tu encuesta y mira qué opina el mundo. La revisamos y la publicamos.</p>
        </div>
        <Link href="/crear" className="rounded-full bg-lime px-6 py-3.5 text-center font-extrabold text-ink">
          Crear encuesta
        </Link>
      </section>
    </div>
  );
}
