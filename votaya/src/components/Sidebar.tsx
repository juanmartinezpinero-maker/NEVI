import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { countryFlag, countryName } from "@/lib/demographics";
import { getUserStats, POINTS } from "@/lib/points";
import { getCountryRanking, listTrending } from "@/lib/polls";
import { formatCount } from "@/lib/text";
import { Photo } from "./Photo";

export async function TrendingBox({ limit = 5 }: { limit?: number }) {
  const trending = await listTrending(24, limit);
  return (
    <section className="card p-4" aria-labelledby="side-trending">
      <h2 id="side-trending" className="mb-3 flex items-center gap-2 font-display text-base font-bold">
        <span aria-hidden>🔥</span> Encuestas en tendencia
      </h2>
      <ol className="space-y-3">
        {trending.map((p, i) => (
          <li key={p.id}>
            <Link href={`/p/${p.slug}`} className="group flex items-center gap-3">
              <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
              <Photo
                src={p.imageUrl ?? p.options[0]?.imageUrl}
                alt=""
                emoji={p.emoji}
                gradient={getCategory(p.category)?.gradient}
                className="h-11 w-11 shrink-0 rounded-lg [&>span]:text-xl"
              />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-semibold leading-tight group-hover:text-brand">{p.title}</span>
                <span className="text-xs text-muted">{formatCount(p.voteCount)} votos</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export async function CountriesBox({ limit = 5 }: { limit?: number }) {
  const countries = await getCountryRanking(limit);
  return (
    <section className="card p-4" aria-labelledby="side-countries">
      <h2 id="side-countries" className="mb-3 flex items-center gap-2 font-display text-base font-bold">
        <span aria-hidden>🌍</span> Ranking: países más votados
      </h2>
      <ol className="space-y-2.5">
        {countries.map((c, i) => (
          <li key={c.country} className="flex items-center gap-3 text-sm">
            <span className="w-4 font-bold text-muted">{i + 1}</span>
            <span className="text-xl" aria-hidden>
              {countryFlag(c.country)}
            </span>
            <span className="flex-1 font-medium">{countryName(c.country)}</span>
            <span className="tabular-nums text-muted">{c.n.toLocaleString("es-ES")}</span>
          </li>
        ))}
      </ol>
      <Link href="/rankings" className="mt-3 block text-center text-sm font-semibold text-brand hover:underline">
        Ver ranking completo →
      </Link>
    </section>
  );
}

export async function CommunityBox() {
  const user = await getCurrentUser();
  if (user?.profileCompleted) {
    const s = await getUserStats(user.id);
    return (
      <section className="card p-4" aria-labelledby="side-me">
        <h2 id="side-me" className="mb-3 font-display text-base font-bold">
          {s.level.emoji} Nivel {s.level.name}
        </h2>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-display text-2xl font-extrabold">{s.voteCount}</p>
            <p className="text-xs text-muted">encuestas votadas</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="font-display text-2xl font-extrabold text-amber-700">{s.balance}</p>
            <p className="text-xs text-muted">puntos</p>
          </div>
        </div>
        {s.level.next && (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${s.level.progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {s.level.next.min - s.voteCount} votos para nivel {s.level.next.name} {s.level.next.emoji}
            </p>
          </div>
        )}
        <Link href="/recompensas" className="mt-3 block rounded-xl bg-ink py-2.5 text-center text-sm font-bold text-white">
          🎁 Canjear puntos
        </Link>
      </section>
    );
  }
  return (
    <section className="card p-4" aria-labelledby="side-join">
      <h2 id="side-join" className="mb-3 flex items-center gap-2 font-display text-base font-bold">
        <span aria-hidden>👥</span> Únete a la comunidad
      </h2>
      <ul className="space-y-2 text-sm">
        {["Vota en miles de encuestas", "Guarda tus resultados", `Gana ${POINTS.vote} puntos por voto`, "Canjea puntos por premios de marcas"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white" aria-hidden>
              ✓
            </span>
            {t}
          </li>
        ))}
      </ul>
      <Link href="/entrar" className="mt-4 block rounded-xl bg-brand py-2.5 text-center text-sm font-bold text-white hover:bg-brand-dark">
        Registrarse gratis · +{POINTS.welcome} puntos
      </Link>
    </section>
  );
}
