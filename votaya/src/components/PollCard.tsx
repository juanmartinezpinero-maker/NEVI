import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { PollCard as PollCardData } from "@/lib/polls";
import { formatCount } from "@/lib/text";
import { timeAgo } from "@/lib/time";
import { Photo } from "./Photo";
import { rewardsEnabled } from "@/lib/site";
import { ShareIconButton } from "./ShareIconButton";

export function PollCard({ poll, voted, highlight, className = "" }: { poll: PollCardData; voted?: boolean; highlight?: string; className?: string }) {
  const cat = getCategory(poll.category);
  const [a, b] = poll.options;
  const extra = poll.options.length - 2;
  const leader = a && b ? (a.count >= b.count ? a.id : b.id) : null;
  return (
    <article className={`card h-full flex-col gap-2.5 p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg sm:gap-3 sm:p-4 ${className || "flex"}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <Link href={`/encuestas?cat=${poll.category}`} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-ink/80 hover:bg-slate-200">
          <span aria-hidden>{cat?.emoji}</span> {cat?.name}
        </Link>
        <span className="text-muted">{highlight ?? timeAgo(poll.publishedAt)}</span>
      </div>
      <h3 className="font-display text-[17px] font-bold leading-snug text-ink sm:text-lg">
        <Link href={`/p/${poll.slug}`} className="hover:text-brand">
          {poll.title}
        </Link>
      </h3>
      {poll.sponsorName && (
        <p className="-mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Patrocinada por {poll.sponsorName}</span>
          {poll.reward && rewardsEnabled() && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">🎁 {poll.reward.title}</span>}
        </p>
      )}
      {a && b && (
        <Link href={`/p/${poll.slug}`} className="grid grid-cols-2 gap-2" tabIndex={-1} aria-hidden>
          {[a, b].map((o) => (
            <div key={o.id} className="relative">
              <Photo src={o.imageUrl ?? (o === a ? poll.imageUrl : null)} alt={o.label} emoji={o.emoji ?? poll.emoji} gradient={cat?.gradient} className="aspect-square w-full rounded-xl sm:aspect-[4/3]" />
              {o === b && extra > 0 && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">+{extra} opciones</span>
              )}
            </div>
          ))}
        </Link>
      )}
      {a && b && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[a, b].map((o) => (
            <div key={o.id}>
              <p className="truncate font-bold text-ink">{o.label}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${o.id === leader ? "bg-brand" : "bg-slate-400"}`} style={{ width: `${o.pct}%` }} />
                </div>
                <span className="w-8 text-right font-semibold tabular-nums text-ink/80">{o.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="hidden text-xs text-muted sm:block">{formatCount(poll.voteCount)} votos</p>
      <div className="mt-auto flex items-center gap-2">
        <Link
          href={`/p/${poll.slug}`}
          className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold ${voted ? "border border-line text-ink hover:bg-slate-50" : "bg-brand text-white hover:bg-brand-dark"}`}
        >
          {voted ? "✓ Ver resultados" : "Votar"}
        </Link>
        <ShareIconButton slug={poll.slug} title={poll.title} />
      </div>
    </article>
  );
}

export function PollGrid({ polls, votedIds, cols = 3 }: { polls: PollCardData[]; votedIds?: Set<string>; cols?: 2 | 3 }) {
  if (!polls.length) return <p className="card p-6 text-center text-muted">Todavía no hay encuestas aquí.</p>;
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cols === 3 ? "xl:grid-cols-3" : ""}`}>
      {polls.map((p) => (
        <PollCard key={p.id} poll={p} voted={votedIds?.has(p.id)} />
      ))}
    </div>
  );
}
