import type { Metadata } from "next";
import { StoryFeed } from "@/components/StoryFeed";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { CATEGORY_NAMES, CATEGORY_TONES, getFeedPolls } from "@/lib/feed";
import { getVotedPollIds, listPolls } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Encuestas", description: "Vota una pregunta tras otra a pantalla completa en voppi!, o filtra por tema." };

export default async function StoriesPage(props: PageProps<"/descubrir">) {
  const sp = await props.searchParams;
  const category = typeof sp.cat === "string" && getCategory(sp.cat) ? sp.cat : undefined;
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const voted = await getVotedPollIds(user?.id ?? null, anonId);
  const [polls, all] = await Promise.all([getFeedPolls(user?.id ?? null, anonId, voted, 30, category), listPolls({ order: "top", limit: 60 })]);
  // Foto de cada tema para el selector: la de su encuesta más votada.
  const covers: Record<string, string | null> = {};
  for (const p of all) if (!(p.category in covers)) covers[p.category] = p.imageUrl ?? p.options[0]?.imageUrl ?? null;
  return (
    <StoryFeed
      key={category ?? "all"}
      polls={polls}
      tones={CATEGORY_TONES}
      categoryNames={CATEGORY_NAMES}
      loggedIn={Boolean(user?.profileCompleted)}
      category={category}
      topicsOpen={sp.temas === "1"}
      covers={covers}
    />
  );
}
