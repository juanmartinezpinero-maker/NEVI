import type { Metadata } from "next";
import { PollCard } from "@/components/PollCard";
import { RankRow } from "@/components/RankRow";
import { CommunityBox } from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getVotedPollIds, listPolls, listTrending } from "@/lib/polls";
import { getAnonId } from "@/lib/request";

export const metadata: Metadata = { title: "Tendencias", description: "Las encuestas que más están creciendo hoy y esta semana." };

export default async function TrendsPage() {
  const [user, anonId] = await Promise.all([getCurrentUser(), getAnonId()]);
  const [today, week, fresh, voted] = await Promise.all([
    listTrending(24, 6),
    listTrending(168, 10),
    listPolls({ order: "new", limit: 6, sponsored: false }),
    getVotedPollIds(user?.id ?? null, anonId),
  ]);
  const wmax = Math.max(1, ...week.map((p) => p.recentVotes || p.voteCount));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-8">
        <section className="space-y-4" aria-labelledby="today">
          <div>
            <h1 id="today" className="font-display text-3xl font-extrabold">
              🔥 Subiendo hoy
            </h1>
            <p className="text-muted">Las preguntas con más votos en las últimas 24 horas.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {today.map((p) => (
              <PollCard key={p.id} poll={p} voted={voted.has(p.id)} highlight={p.recentVotes ? `+${p.recentVotes} votos hoy` : undefined} />
            ))}
          </div>
        </section>
        <section className="card p-4 sm:p-6" aria-labelledby="week">
          <h2 id="week" className="mb-3 font-display text-2xl font-extrabold">
            📈 Tendencias de la semana
          </h2>
          <ol className="space-y-1">
            {week.map((p, i) => (
              <RankRow key={p.id} poll={p} rank={i + 1} value={p.recentVotes || p.voteCount} max={wmax} note="votos en 7 días" />
            ))}
          </ol>
        </section>
        <section className="space-y-4" aria-labelledby="new">
          <h2 id="new" className="font-display text-2xl font-extrabold">
            🆕 Recién publicadas
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {fresh.map((p) => (
              <PollCard key={p.id} poll={p} voted={voted.has(p.id)} />
            ))}
          </div>
        </section>
      </div>
      <aside className="space-y-4">
        <CommunityBox />
      </aside>
    </div>
  );
}
