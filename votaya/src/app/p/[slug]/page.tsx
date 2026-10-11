import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PollCard } from "@/components/PollCard";
import { PollVoter } from "@/components/PollVoter";
import { SegmentTabs } from "@/components/SegmentTabs";
import { TrackView } from "@/components/TrackView";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { countryFlag, countryName, genderLabel } from "@/lib/demographics";
import { findExistingVote, getPollBySlug, getRecommended, getResults, getSegments, MIN_SEGMENT } from "@/lib/polls";
import { getAnonId, getBaseUrl } from "@/lib/request";
import { formatCount } from "@/lib/text";

const loadPoll = cache(getPollBySlug);

export async function generateMetadata(props: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const poll = await loadPoll(slug);
  if (!poll || poll.status !== "published") return { title: "Encuesta no encontrada", robots: { index: false } };
  const desc = poll.options.length === 2 ? `${poll.options[0].label} o ${poll.options[1].label}? Vota y mira qué opina el mundo.` : `${poll.options.map((o) => o.label).slice(0, 4).join(", ")}… Vota y mira qué opina el mundo.`;
  return {
    title: poll.title,
    description: desc,
    alternates: { canonical: `/p/${poll.slug}` },
    openGraph: { title: `${poll.title} · VotaYa`, description: desc, url: `/p/${poll.slug}`, type: "article" },
    twitter: { card: "summary_large_image", title: poll.title, description: desc },
  };
}

export default async function PollPage(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const poll = await loadPoll(slug);
  const user = await getCurrentUser();
  if (!poll) notFound();
  const canPreview = user && (user.role === "admin" || user.id === poll.authorId);
  if (poll.status !== "published" && !canPreview) notFound();

  const anonId = await getAnonId();
  const existing = await findExistingVote(poll.id, user?.id ?? null, anonId);
  const verified = Boolean(user?.profileCompleted);
  const [results, recommended] = await Promise.all([
    existing ? getResults(poll.id) : null,
    getRecommended(user?.id ?? null, anonId, 4, poll.id),
  ]);
  const segments =
    existing && verified
      ? await Promise.all((["country", "ageRange", "gender"] as const).map((d) => getSegments(poll.id, d)))
      : null;
  const base = await getBaseUrl();
  const cat = getCategory(poll.category);
  const nextHref = recommended[0] ? `/p/${recommended[0].slug}` : "/descubrir";
  const optionList = [...poll.options.map((o) => ({ id: o.id, label: o.label })), { id: "other", label: "Otra" }];

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_340px]">
      <TrackView pollId={poll.id} />
      <div className="space-y-6">
        {poll.status !== "published" && (
          <p className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm">
            Vista previa · Estado: <strong>{poll.status === "pending" ? "pendiente de moderación" : poll.status}</strong>
          </p>
        )}
        <article className="card p-5 sm:p-7">
          <nav className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted" aria-label="Categoría">
            <Link href={`/c/${poll.category}`} className="rounded-full bg-ink-3 px-3 py-1 hover:text-white">
              {cat?.emoji} {cat?.name}
            </Link>
            {poll.sponsored && <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-200">Patrocinada</span>}
            <span className="rounded-full bg-ink-3 px-3 py-1" title="Cualquiera puede votar: no es una muestra representativa">
              {poll.kind === "study" ? "📊 Estudio representativo" : "🗳️ Votación popular"}
            </span>
            <span>{formatCount(results?.total ?? poll.voteCount)} votos</span>
          </nav>
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {poll.emoji && <span aria-hidden>{poll.emoji} </span>}
            {poll.title}
          </h1>
          {poll.description && <p className="mt-2 text-muted">{poll.description}</p>}
          {poll.isDemo && (
            <p className="mt-3 rounded-xl bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ Encuesta de demostración: los votos iniciales son datos ficticios generados para mostrar la plataforma.
            </p>
          )}
          <div className="mt-6">
            <PollVoter
              key={existing ? "voted" : "new"}
              poll={poll}
              initial={results ? { results, myOptionId: existing!.optionId, myWriteInId: existing!.writeInId } : null}
              verified={verified}
              shareUrl={`${base}/p/${poll.slug}`}
              nextHref={nextHref}
            />
          </div>
        </article>

        {existing && (
          <section className="card p-5 sm:p-7" aria-labelledby="segments">
            <h2 id="segments" className="mb-4 font-display text-2xl font-extrabold">
              ¿Qué opina cada grupo?
            </h2>
            {segments ? (
              <SegmentTabs
                minVotes={MIN_SEGMENT}
                options={optionList}
                tabs={[
                  {
                    id: "country",
                    label: "Países",
                    hidden: segments[0].hidden,
                    segments: segments[0].segments.map((s) => ({ ...s, label: countryName(s.key), flag: countryFlag(s.key) })),
                  },
                  { id: "age", label: "Edad", hidden: segments[1].hidden, segments: segments[1].segments.map((s) => ({ ...s, label: `${s.key} años` })) },
                  {
                    id: "gender",
                    label: "Género",
                    hidden: segments[2].hidden,
                    segments: segments[2].segments.map((s) => ({ ...s, label: genderLabel(s.key) })),
                  },
                ]}
              />
            ) : (
              <div className="relative overflow-hidden rounded-2xl">
                <div className="pointer-events-none space-y-3 blur-sm" aria-hidden>
                  {["🇪🇸 España", "🇲🇽 México", "🇦🇷 Argentina"].map((c) => (
                    <div key={c}>
                      <p className="mb-1 text-sm font-bold">{c}</p>
                      <div className="flex h-3 overflow-hidden rounded-full bg-ink-3">
                        <div className="w-3/5 bg-violet-500" />
                        <div className="w-2/5 bg-pink-500" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/60 text-center">
                  <p className="font-bold">Resultados por país, edad y género</p>
                  <Link href={`/entrar?next=/p/${poll.slug}`} className="bg-brand-gradient rounded-full px-5 py-2 font-bold text-white">
                    Regístrate gratis para verlos
                  </Link>
                </div>
              </div>
            )}
            <p className="mt-4 text-xs text-muted">
              Solo se usan votos de cuentas verificadas y grupos con al menos {MIN_SEGMENT} votos. Es una votación abierta: no representa a
              toda la población.
            </p>
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <h2 className="font-display text-xl font-extrabold">Más preguntas para ti</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {recommended.map((p) => (
            <PollCard key={p.id} poll={p} />
          ))}
        </div>
      </aside>
    </div>
  );
}
