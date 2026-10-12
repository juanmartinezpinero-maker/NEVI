import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { PollCard } from "@/lib/polls";
import { formatCount } from "@/lib/text";
import { Photo } from "./Photo";

export function RankRow({ poll, rank, value, max, note }: { poll: PollCard; rank: number; value: number; max: number; note?: string }) {
  const cat = getCategory(poll.category);
  const medal = ["🥇", "🥈", "🥉"][rank - 1];
  return (
    <li>
      <Link href={`/p/${poll.slug}`} className="group flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50 sm:gap-4">
        <span className="w-8 text-center font-display text-xl font-extrabold text-muted">{medal ?? rank}</span>
        <Photo
          src={poll.imageUrl ?? poll.options[0]?.imageUrl}
          alt=""
          emoji={poll.emoji}
          gradient={cat?.gradient}
          className="h-14 w-14 shrink-0 rounded-xl sm:h-16 sm:w-20 [&>span]:text-2xl"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-muted">
            {cat?.emoji} {cat?.name}
          </span>
          <span className="block font-bold leading-snug group-hover:text-brand">{poll.title}</span>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-brand-gradient" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
          </span>
        </span>
        <span className="text-right">
          <span className="block font-display text-lg font-extrabold tabular-nums">{formatCount(value)}</span>
          <span className="text-xs text-muted">{note ?? "votos"}</span>
        </span>
      </Link>
    </li>
  );
}
