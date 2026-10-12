import "server-only";
import { CATEGORIES } from "./categories";
import { getFeaturedPoll, getRecommended, listPolls, type PollCard } from "./polls";

/** Cola del feed de historias: la pregunta del día primero y después recomendaciones sin votar. */
export async function getFeedPolls(userId: string | null, anonId: string | null, votedIds: Set<string>, limit = 30, category?: string): Promise<PollCard[]> {
  // Por temas: las encuestas de esa categoría que aún no ha votado, las más votadas primero.
  if (category) return (await listPolls({ category, order: "top", limit: 100 })).filter((p) => !votedIds.has(p.id)).slice(0, limit);
  const [featured, rec] = await Promise.all([getFeaturedPoll(), getRecommended(userId, anonId, limit)]);
  const list = featured && !votedIds.has(featured.id) ? [featured, ...rec.filter((p) => p.id !== featured.id)] : rec;
  return list.slice(0, limit);
}

export const CATEGORY_TONES = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.tone]));
export const CATEGORY_NAMES = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));
