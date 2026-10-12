import Link from "next/link";
import { gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { CategoryChips } from "@/components/CategoryChips";
import { Photo } from "@/components/Photo";
import { PollCard } from "@/components/PollCard";
import { CommunityBox, CountriesBox, TrendingBox } from "@/components/Sidebar";
import { TrackView } from "@/components/TrackView";
import { getCurrentUser } from "@/lib/auth";
import { HERO_IMAGE } from "@/lib/site";
import { listRewards } from "@/lib/points";
import { getFeaturedPoll, getVotedPollIds, listPolls, listTrending } from "@/lib/polls";
import { getAnonId } from "@/lib/request";
import { formatCount } from "@/lib/text";

async function weeklyVotes() {
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.votes)
    .where(gte(schema.votes.createdAt, new Date(Date.now() - 7 * 864e5)));
  return n;
}

export default async function Home() {
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const [featured, trending, latest, week, votedIds, rewards] = await Promise.all([
    getFeaturedPoll(),
    listTrending(24, 9),
    listPolls({ order: "new", limit: 6, sponsored: false }),
    weeklyVotes(),
    getVotedPollIds(user?.id ?? null, anonId),
    listRewards(),
  ]);
  const seen = new Set<string>();
  const grid = [featured, ...trending].filter((p): p is NonNullable<typeof p> => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, 9);
  const fresh = latest.filter((p) => !seen.has(p.id)).slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <TrackView path="/" />
      <div className="min-w-0 space-y-6">
        <section className="bg-hero relative overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="relative z-10 max-w-md space-y-4">
            <h1 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl">
              El mundo opina
              <br />
              <span className="text-gradient">¿Y tú?</span>
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              Vota en las mejores encuestas, descubre lo que piensa la gente de todo el mundo, gana puntos y comparte tus resultados.
            </p>
            <Link
              href={featured ? `/p/${featured.slug}` : "/encuestas"}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold shadow-lg shadow-black/20 hover:bg-brand-dark"
            >
              Empieza a votar →
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-10 top-1/2 hidden h-72 w-72 -translate-y-1/2 sm:block md:right-6 md:h-80 md:w-80" aria-hidden>
            <Photo src={HERO_IMAGE} alt="" emoji="🌍" gradient="from-indigo-400 to-fuchsia-500" className="h-full w-full rounded-full shadow-2xl shadow-fuchsia-900/50 [&>span]:text-8xl" />
            {[
              ["❤️", "left-2 top-6", "0s"],
              ["🤔", "right-6 top-0", "1s"],
              ["😊", "-left-6 bottom-16", "2s"],
              ["🔥", "right-0 bottom-20", "1.5s"],
            ].map(([e, pos, delay]) => (
              <span key={e} className={`animate-float absolute ${pos} flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg`} style={{ animationDelay: delay }}>
                {e}
              </span>
            ))}
          </div>
          <div className="relative z-10 mt-6 inline-flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-2.5 backdrop-blur sm:absolute sm:bottom-6 sm:right-6 sm:mt-0">
            <span className="text-2xl" aria-hidden>
              👥
            </span>
            <span>
              <span className="block font-display text-xl font-extrabold leading-none">{formatCount(week)}</span>
              <span className="text-xs text-white/80">votos esta semana</span>
            </span>
          </div>
        </section>

        <CategoryChips />

        <section aria-label="Encuestas destacadas">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grid.map((p) => (
              <PollCard key={p.id} poll={p} voted={votedIds.has(p.id)} highlight={p.id === featured?.id ? "⭐ Pregunta del día" : undefined} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link href="/encuestas" className="inline-block rounded-full border border-line bg-white px-6 py-2.5 text-sm font-bold hover:border-rose-300">
              Ver todas las encuestas →
            </Link>
          </div>
        </section>

        {rewards.length > 0 && (
          <section className="card overflow-hidden" aria-labelledby="rewards-teaser">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line bg-gradient-to-r from-amber-50 to-rose-50 px-5 py-4">
              <div>
                <h2 id="rewards-teaser" className="font-display text-xl font-extrabold">
                  🎁 Vota, suma puntos y gana premios
                </h2>
                <p className="text-sm text-muted">Cada voto suma puntos. Canjéalos por premios de las marcas que patrocinan encuestas.</p>
              </div>
              <Link href="/recompensas" className="text-sm font-bold text-brand hover:underline">
                Ver todos los premios →
              </Link>
            </div>
            <ul className="grid gap-px bg-line sm:grid-cols-3">
              {rewards.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-center gap-3 bg-white p-4">
                  <Photo src={r.imageUrl} alt="" emoji="🎁" gradient="from-amber-300 to-rose-400" className="h-14 w-14 shrink-0 rounded-xl [&>span]:text-2xl" />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.title}</p>
                    <p className="text-xs text-muted">{r.sponsor}</p>
                    <p className="text-sm font-bold text-amber-700">⭐ {r.costPoints} puntos</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {fresh.length > 0 && (
          <section className="space-y-3" aria-labelledby="latest">
            <h2 id="latest" className="font-display text-xl font-extrabold">
              🆕 Últimas preguntas
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {fresh.map((p) => (
                <PollCard key={p.id} poll={p} voted={votedIds.has(p.id)} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <TrendingBox />
        <CountriesBox />
        <CommunityBox />
      </aside>
    </div>
  );
}
