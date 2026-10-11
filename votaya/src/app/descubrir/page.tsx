import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRecommended } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Descubrir" };

/** Modo descubrimiento continuo: lleva a la siguiente pregunta sin votar. */
export default async function DiscoverPage() {
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const [next] = await getRecommended(user?.id ?? null, anonId, 1);
  if (next) redirect(`/p/${next.slug}`);
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="text-5xl" aria-hidden>
        🏆
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold">¡Has votado todas las preguntas!</h1>
      <p className="mt-2 text-muted">Vuelve mañana o propón la tuya para que el mundo opine.</p>
      <Link href="/crear" className="bg-brand-gradient mt-5 inline-block rounded-full px-6 py-3 font-bold text-white">
        Crear una pregunta
      </Link>
    </div>
  );
}
