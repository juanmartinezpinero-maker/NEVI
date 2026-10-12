import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { PollCard as PollCardData } from "@/lib/polls";
import { formatCount } from "@/lib/text";
import { timeAgo } from "@/lib/time";
import { Photo } from "./Photo";

/** Tarjeta editorial: fotos redondeadas, categoría, pregunta y barra de duelo rosa/tinta. */
export function PollCard({ poll, voted, highlight, className = "" }: { poll: PollCardData; voted?: boolean; highlight?: string; className?: string }) {
  const cat = getCategory(poll.category);
  const two = poll.options.length === 2 && !poll.allowOther;
  const ranked = [...poll.options].sort((x, y) => y.count - x.count);
  const [a, b] = two ? poll.options : ranked;
  const share = a && b && a.pct + b.pct > 0 ? (a.pct / (a.pct + b.pct)) * 100 : 50;
  return (
    <Link href={`/p/${poll.slug}`} className={`group grid content-start gap-2.5 ${className}`}>
      {two ? (
        <span className="grid grid-cols-2 gap-1.5">
          {poll.options.map((o) => (
            <Photo key={o.id} src={o.imageUrl ?? poll.imageUrl} alt="" label={o.label} tone={cat?.tone} className="aspect-square rounded-[18px]" />
          ))}
        </span>
      ) : (
        <Photo src={poll.imageUrl ?? poll.options[0]?.imageUrl} alt="" label={poll.title} tone={cat?.tone} className="aspect-[2/1] rounded-[18px]" />
      )}
      <span className="flex items-baseline justify-between gap-2">
        <span className="kicker" style={{ color: cat?.tone }}>
          {cat?.name}
          {poll.sponsorName ? " · Patrocinada" : ""}
        </span>
        <span className="kicker">{highlight ?? timeAgo(poll.publishedAt)}</span>
      </span>
      <h3 className="text-[22px] font-extrabold leading-[1.1] tracking-[-0.04em] group-hover:underline">{poll.title}</h3>
      {a && b && (
        <>
          <span className="flex h-2 overflow-hidden rounded-full" aria-hidden>
            <span className="bg-pink" style={{ width: `${share}%` }} />
            <span className="flex-1 bg-ink" />
          </span>
          <span className="flex justify-between text-[12.5px] font-semibold text-ink-2">
            <span>
              {a.label} {a.pct}%
            </span>
            <span>
              {b.pct}% {b.label}
            </span>
          </span>
        </>
      )}
      <span className="flex items-center justify-between text-[13px]">
        <span className="font-semibold tabular-nums text-muted">
          {formatCount(poll.voteCount)} votos{two ? "" : ` · ${poll.options.length} opciones`}
        </span>
        {voted ? <span className="text-xs font-extrabold text-ink">Votada</span> : <span className="rounded-full bg-lime px-3 py-1 font-extrabold">Votar →</span>}
      </span>
    </Link>
  );
}

export function PollGrid({ polls, votedIds }: { polls: PollCardData[]; votedIds?: Set<string> }) {
  if (!polls.length) return <p className="rounded-3xl bg-wash p-8 text-center text-muted">Todavía no hay encuestas aquí.</p>;
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
      {polls.map((p) => (
        <PollCard key={p.id} poll={p} voted={votedIds?.has(p.id)} />
      ))}
    </div>
  );
}
