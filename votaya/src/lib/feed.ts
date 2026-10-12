import "server-only";
import { CATEGORIES } from "./categories";
import { getFeaturedPoll, getRecommended, type PollCard } from "./polls";

/** Cola del feed de historias: la pregunta del día primero y después recomendaciones sin votar. */
export async function getFeedPolls(userId: string | null, anonId: string | null, votedIds: Set<string>, limit = 30): Promise<PollCard[]> {
  const [featured, rec] = await Promise.all([getFeaturedPoll(), getRecommended(userId, anonId, limit)]);
  const list = featured && !votedIds.has(featured.id) ? [featured, ...rec.filter((p) => p.id !== featured.id)] : rec;
  return list.slice(0, limit);
}

export const CATEGORY_TONES = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.tone]));
export const CATEGORY_NAMES = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
