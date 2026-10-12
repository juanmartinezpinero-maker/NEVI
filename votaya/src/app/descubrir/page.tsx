import type { Metadata } from "next";
import { StoryFeed } from "@/components/StoryFeed";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_NAMES, CATEGORY_TONES, getFeedPolls } from "@/lib/feed";
import { getVotedPollIds } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Encuestas", description: "Vota una pregunta tras otra a pantalla completa en voppi!" };

export default async function StoriesPage() {
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const voted = await getVotedPollIds(user?.id ?? null, anonId);
  const polls = await getFeedPolls(user?.id ?? null, anonId, voted);
  return <StoryFeed polls={polls} tones={CATEGORY_TONES} categoryNames={CATEGORY_NAMES} loggedIn={Boolean(user?.profileCompleted)} />;
}
