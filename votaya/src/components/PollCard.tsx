import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { PollCard as PollCardData } from "@/lib/polls";
import { formatCount } from "@/lib/text";

export function PollCard({ poll, rank, voted }: { poll: PollCardData; rank?: number; voted?: boolean }) {
  const cat = getCategory(poll.category);
  const duel = poll.options.length === 2;
  return (
    <Link
      href={`/p/${poll.slug}`}
      className="card group relative flex h-full flex-row overflow-hidden transition sm:flex-col hover:-translate-y-0.5 hover:border-fuchsia-400/60"
    >
      <div className={`relative flex w-24 shrink-0 items-center justify-center bg-gradient-to-br sm:h-24 sm:w-auto ${cat?.gradient ?? "from-violet-500 to-fuchsia-600"}`}>
        {poll.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poll.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" loading="lazy" />
        ) : null}
        <span className="relative text-4xl drop-shadow-lg sm:text-5xl transition group-hover:scale-110" aria-hidden>
          {poll.emoji ?? cat?.emoji ?? "🗳️"}
        </span>
        {rank ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-black/40 px-2 sm:left-3 sm:top-3 sm:px-2.5 py-0.5 text-sm font-black">#{rank}</span>
        ) : null}
        {poll.sponsored ? (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase sm:bottom-auto sm:left-auto sm:right-3 sm:top-3 sm:translate-x-0 sm:text-[11px]">Patrocinada</span>
        ) : voted ? (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold sm:bottom-auto sm:left-auto sm:right-3 sm:top-3 sm:translate-x-0 sm:text-[11px]">✓ Votada</span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:gap-2 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{cat?.name}</p>
        <h3 className="font-display text-base font-bold leading-snug sm:text-lg">{poll.title}</h3>
        {duel ? (
          <p className="truncate text-sm text-muted">
            {poll.options[0].emoji} {poll.options[0].label} <span className="font-black text-fuchsia-400">vs</span> {poll.options[1].emoji}{" "}
            {poll.options[1].label}
          </p>
        ) : (
          <p className="text-sm text-muted">{poll.options.length} opciones{poll.allowOther ? " + la tuya" : ""}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 text-sm sm:pt-2">
          <span className="text-muted">{formatCount(poll.voteCount)} votos</span>
          <span className="font-bold text-fuchsia-300 group-hover:text-white">Votar →</span>
        </div>
      </div>
    </Link>
  );
}

export function PollGrid({ polls, votedIds }: { polls: PollCardData[]; votedIds?: Set<string> }) {
  if (!polls.length) return <p className="card p-6 text-center text-muted">Todavía no hay encuestas aquí.</p>;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {polls.map((p) => (
        <PollCard key={p.id} poll={p} voted={votedIds?.has(p.id)} />
      ))}
    </div>
  );
}
