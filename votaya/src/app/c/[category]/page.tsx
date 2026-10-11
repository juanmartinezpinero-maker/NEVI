import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PollGrid } from "@/components/PollCard";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { getVotedPollIds, listPolls } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export async function generateMetadata(props: PageProps<"/c/[category]">): Promise<Metadata> {
  const cat = getCategory((await props.params).category);
  return cat ? { title: `Encuestas de ${cat.name}`, description: `Vota las preguntas más populares de ${cat.name.toLowerCase()} en VotaYa.` } : {};
}

export default async function CategoryPage(props: PageProps<"/c/[category]">) {
  const { category } = await props.params;
  const sp = await props.searchParams;
  const cat = getCategory(category);
  if (!cat) notFound();
  const order = sp.orden === "nuevas" ? "new" : "top";
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const [polls, voted] = await Promise.all([listPolls({ category, order, limit: 30 }), getVotedPollIds(user?.id ?? null, anonId)]);
  return (
    <div className="space-y-6">
      <header className={`rounded-3xl bg-gradient-to-br ${cat.gradient} p-6 sm:p-10`}>
        <p className="text-5xl" aria-hidden>
          {cat.emoji}
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{cat.name}</h1>
      </header>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/c/${c.slug}`}
            aria-current={c.slug === category ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${c.slug === category ? "bg-white text-ink" : "bg-ink-3 text-muted"}`}
          >
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>
      <div className="flex gap-2 text-sm font-bold">
        <Link href={`/c/${category}`} className={`rounded-full px-3 py-1.5 ${order === "top" ? "bg-fuchsia-500 text-white" : "bg-ink-3"}`}>
          Más votadas
        </Link>
        <Link href={`/c/${category}?orden=nuevas`} className={`rounded-full px-3 py-1.5 ${order === "new" ? "bg-fuchsia-500 text-white" : "bg-ink-3"}`}>
          Nuevas
        </Link>
      </div>
      <PollGrid polls={polls} votedIds={voted} />
    </div>
  );
}
