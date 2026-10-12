import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { countryFlag, countryName } from "@/lib/demographics";
import { getStreak, getUserStats, POINTS } from "@/lib/points";
import { getCountryRanking, listTrending } from "@/lib/polls";
import { formatCount } from "@/lib/text";

const pad = (n: number) => String(n).padStart(2, "0");

export async function TrendingBox({ limit = 6 }: { limit?: number }) {
  const trending = await listTrending(24, limit);
  return (
    <section className="rounded-[22px] bg-wash p-5" aria-labelledby="side-trending">
      <h2 id="side-trending" className="mb-2 text-[22px] font-extrabold tracking-[-0.04em]">
        Tendencias
      </h2>
      <ol>
        {trending.map((p, i) => (
          <li key={p.id} className="border-b border-line last:border-0">
            <Link href={`/p/${p.slug}`} className="grid grid-cols-[28px_1fr_auto] items-baseline gap-2 py-2.5 hover:underline">
              <span className="text-[15px] font-black text-pink">{pad(i + 1)}</span>
              <span className="text-sm font-semibold leading-snug">{p.title}</span>
              <span className="text-xs tabular-nums text-muted">{formatCount(p.voteCount)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export async function CountriesBox({ limit = 6 }: { limit?: number }) {
  const countries = await getCountryRanking(limit);
  return (
    <section className="rounded-[22px] bg-wash p-5" aria-labelledby="side-countries">
      <h2 id="side-countries" className="mb-2 text-[22px] font-extrabold tracking-[-0.04em]">
        Países que más votan
      </h2>
      <ol>
        {countries.map((c, i) => (
          <li key={c.country} className="grid grid-cols-[28px_24px_1fr_auto] items-center gap-2 border-b border-line py-2 text-sm last:border-0">
            <span className="font-black text-pink">{pad(i + 1)}</span>
            <span aria-hidden>{countryFlag(c.country)}</span>
            <span className="font-medium">{countryName(c.country)}</span>
            <span className="font-bold tabular-nums">{c.n.toLocaleString("es-ES")}</span>
          </li>
        ))}
      </ol>
      <Link href="/rankings" className="mt-3 inline-block text-sm font-extrabold underline">
        Ranking completo
      </Link>
    </section>
  );
}

export async function CommunityBox() {
  const user = await getCurrentUser();
  if (user?.profileCompleted) {
    const [s, streak] = await Promise.all([getUserStats(user.id), getStreak(user.id)]);
    return (
      <section className="rounded-[22px] bg-lime p-5" aria-labelledby="side-me">
        <h2 id="side-me" className="text-[22px] font-extrabold tracking-[-0.04em]">
          Tu actividad
        </h2>
        <p className="mt-2 text-sm font-semibold tabular-nums">
          {s.voteCount} votos · {s.balance} pts · racha {streak} d
        </p>
        <p className="text-sm text-ink-2">
          Nivel {s.level.name}
          {s.level.next ? ` · ${s.level.next.min - s.voteCount} votos para ${s.level.next.name}` : ""}
        </p>
        {s.level.next && (
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full bg-pink" style={{ width: `${s.level.progress}%` }} />
          </div>
        )}
      </section>
    );
  }
  return (
    <section className="rounded-[22px] bg-lime p-5" aria-labelledby="side-join">
      <h2 id="side-join" className="text-[22px] font-extrabold tracking-[-0.04em]">
        Únete
      </h2>
      <p className="mb-4 mt-1 text-sm text-ink-2">Guarda tus votos, gana {POINTS.vote} puntos por voto y mira qué opina tu país.</p>
      <Link href="/entrar" className="inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-lime">
        Crear cuenta gratis
      </Link>
    </section>
  );
}
