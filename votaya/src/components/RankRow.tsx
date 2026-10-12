import Link from "next/link";
import { getCategory } from "@/lib/categories";
import type { PollCard } from "@/lib/polls";
import { formatCount } from "@/lib/text";
import { Photo } from "./Photo";

export function RankRow({ poll, rank, value, note }: { poll: PollCard; rank: number; value: number; note?: string }) {
  const cat = getCategory(poll.category);
  return (
    <li className="border-b border-line last:border-0">
      <Link href={`/p/${poll.slug}`} className="group grid grid-cols-[44px_60px_1fr_auto] items-center gap-3 py-3">
        <span className="text-xl font-black tabular-nums text-pink">{String(rank).padStart(2, "0")}</span>
        <Photo src={poll.imageUrl ?? poll.options[0]?.imageUrl} alt="" label={poll.title} tone={cat?.tone} className="h-14 w-14 rounded-[15px]" initialsClass="text-xl" />
        <span className="min-w-0">
          <span className="kicker" style={{ color: cat?.tone }}>
            {cat?.name}
          </span>
          <span className="block text-lg font-extrabold leading-tight tracking-[-0.03em] group-hover:underline">{poll.title}</span>
        </span>
        <span className="text-right">
          <span className="block font-extrabold tabular-nums">{formatCount(value)}</span>
          <span className="text-xs text-muted">{note ?? "votos"}</span>
        </span>
      </Link>
    </li>
  );
}
