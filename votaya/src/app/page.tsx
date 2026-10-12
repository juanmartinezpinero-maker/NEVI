import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { PollGrid } from "@/components/PollCard";
import { PollVoter } from "@/components/PollVoter";
import { CommunityBox, CountriesBox, TrendingBox } from "@/components/Sidebar";
import { StoryFeed } from "@/components/StoryFeed";
import { TrackView } from "@/components/TrackView";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { CATEGORY_NAMES, CATEGORY_TONES, getFeedPolls } from "@/lib/feed";
import { findExistingVote, getFeaturedPoll, getResults, getVotedPollIds, listPolls } from "@/lib/polls";
import { getAnonId, getBaseUrl } from "@/lib/request";

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const cat = typeof sp.cat === "string" && getCategory(sp.cat) ? sp.cat : undefined;
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const votedIds = await getVotedPollIds(user?.id ?? null, anonId);
  const [featured, popular, feed] = await Promise.all([
    getFeaturedPoll(),
    listPolls({ order: "top", limit: 10, sponsored: false, category: cat }),
    getFeedPolls(user?.id ?? null, anonId, votedIds),
  ]);
  const existing = featured ? await findExistingVote(featured.id, user?.id ?? null, anonId) : null;
  const initial = featured && existing ? { results: await getResults(featured.id), myOptionId: existing.optionId, myWriteInId: existing.writeInId } : null;
  const base = await getBaseUrl();
  const fcat = featured ? getCategory(featured.category) : null;
  const grid = popular.filter((p) => p.id !== featured?.id).slice(0, 9);

  return (
    <>
      <TrackView path="/" />
      {/* Móvil: feed de historias a pantalla completa. */}
      <div className="lg:hidden">
        <StoryFeed polls={feed} tones={CATEGORY_TONES} categoryNames={CATEGORY_NAMES} loggedIn={Boolean(user?.profileCompleted)} />
      </div>

      {/* Escritorio: portada editorial. */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-7">
          {featured ? (
            <section className="rounded-[28px] bg-lime p-7" aria-labelledby="daily">
              <span className="kicker !text-ink">Pregunta del día · {fcat?.name}</span>
              <h1 id="daily" className="mb-5 mt-2 text-[64px] font-black leading-[1] tracking-[-0.055em]">
                {featured.title}
              </h1>
              <PollVoter poll={featured} initial={initial} verified={Boolean(user?.profileCompleted)} shareUrl={`${base}/p/${featured.slug}`} compact tone={fcat?.tone} />
              <p className="mt-4 text-sm">
                <Link href="/descubrir" className="font-bold underline">
                  Seguir votando en modo historias
                </Link>
              </p>
            </section>
          ) : (
            <section className="rounded-[28px] bg-lime p-7">
              <h1 className="text-5xl font-black tracking-[-0.05em]">El mundo opina. ¿Y tú?</h1>
            </section>
          )}
          <aside className="grid gap-4">
            <TrendingBox />
            <CountriesBox />
            <CommunityBox />
          </aside>
        </div>

        <section className="mt-12" aria-labelledby="popular">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="popular" className="text-[34px] font-extrabold tracking-[-0.045em]">
              Encuestas populares
            </h2>
            <Link href="/encuestas" className="text-sm font-extrabold underline">
              Ver todas
            </Link>
          </div>
          <div className="mb-6">
            <CategoryChips active={cat} base="/" />
          </div>
          <PollGrid polls={grid} votedIds={votedIds} />
        </section>
      </div>
    </>
  );
}
