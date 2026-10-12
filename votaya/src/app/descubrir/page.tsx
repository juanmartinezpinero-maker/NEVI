import type { Metadata } from "next";
import { SwipeDeck } from "@/components/SwipeDeck";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { getRecommended } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Modo rápido", description: "Vota una pregunta tras otra en VotaYa." };

/** Modo rápido tipo TikTok: cola de preguntas sin votar. */
export default async function DiscoverPage() {
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const polls = await getRecommended(user?.id ?? null, anonId, 25);
  const gradients = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.gradient]));
  return <SwipeDeck polls={polls} gradients={gradients} />;
}
