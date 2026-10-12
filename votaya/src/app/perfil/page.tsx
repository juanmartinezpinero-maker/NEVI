import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { deleteAccountAction, logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { getUserBrands } from "@/lib/brands";
import { getCategory } from "@/lib/categories";
import { Photo } from "@/components/Photo";
import { countryFlag, countryName, genderLabel } from "@/lib/demographics";
import { getUserHistory } from "@/lib/polls";
import { getUserStats } from "@/lib/points";
import { rewardsEnabled } from "@/lib/site";

export const metadata: Metadata = { title: "Mi perfil", robots: { index: false } };

const STATUS: Record<string, string> = { pending: "En moderación", published: "Publicada", rejected: "Rechazada", archived: "Archivada" };

export default async function ProfilePage(props: PageProps<"/perfil">) {
  const user = await requireUser("/perfil");
  const sp = await props.searchParams;
  const db = await getDb();
  const [history, stats, mine, brands] = await Promise.all([
    getUserHistory(user.id),
    getUserStats(user.id),
    db
      .select({ slug: schema.polls.slug, title: schema.polls.title, status: schema.polls.status, voteCount: schema.polls.voteCount, note: schema.polls.moderationNote })
      .from(schema.polls)
      .where(eq(schema.polls.authorId, user.id))
      .orderBy(desc(schema.polls.createdAt)),
    getUserBrands(user),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {sp.propuesta === "ok" && (
        <p role="status" className="rounded-[18px] bg-lime p-4 font-semibold">
          ¡Gracias! Tu pregunta está en moderación y la publicaremos en cuanto la revisemos.
        </p>
      )}
      <section className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-3xl font-black text-lime">
          {user.email[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black tracking-[-0.04em]">{user.email}</h1>
          <p className="text-sm text-muted">
            {countryFlag(user.country)} {countryName(user.country)} · {user.ageRange} años · {genderLabel(user.gender)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/entrar/perfil?next=/perfil" className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-line">
            Editar
          </Link>
          <form action={logoutAction}>
            <button className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-line">Salir</button>
          </form>
        </div>
      </section>

      {brands.length > 0 && (
        <Link href="/marca" className="flex items-center justify-between rounded-[22px] bg-ink p-5 text-white">
          <span>
            <span className="block text-xs font-semibold text-white/70">Panel de marca</span>
            <span className="text-xl font-black tracking-[-0.04em] text-lime">{brands.map((b) => b.name).join(" · ")}</span>
          </span>
          <span className="rounded-full bg-lime px-4 py-2 text-sm font-extrabold text-ink">Abrir</span>
        </Link>
      )}

      <section className="space-y-3" aria-labelledby="stats">
        <h2 id="stats" className="sr-only">
          Mis estadísticas
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-[22px] bg-lime p-4">
            <p className="text-[34px] font-black leading-none tracking-[-0.05em] tabular-nums">{stats.voteCount}</p>
            <p className="mt-1 text-xs font-semibold">encuestas votadas</p>
          </div>
          <div className="rounded-[22px] bg-ink p-4 text-white">
            <p data-testid="points-balance" className="text-[34px] font-black leading-none tracking-[-0.05em] tabular-nums text-lime">{stats.balance}</p>
            <p className="mt-1 text-xs font-semibold text-white/70">puntos</p>
          </div>
          <div className="rounded-[22px] bg-wash p-4">
            <p className="text-[34px] font-black leading-none tracking-[-0.05em] tabular-nums">{mine.length}</p>
            <p className="mt-1 text-xs font-semibold text-muted">preguntas propuestas</p>
          </div>
        </div>
        <div className="rounded-[22px] bg-wash p-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Nivel {stats.level.name}</span>
            {stats.level.next && (
              <span className="text-muted">
                {stats.level.next.name} en {stats.level.next.min - stats.voteCount} votos
              </span>
            )}
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-pink" style={{ width: `${stats.level.progress}%` }} />
          </div>
          {rewardsEnabled() && (
            <Link href="/recompensas" className="mt-3 inline-block text-sm font-extrabold underline">
              Canjear mis puntos
            </Link>
          )}
        </div>
        {stats.history.length > 0 && (
          <details className="rounded-[22px] bg-wash p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Movimientos de puntos</summary>
            <ul className="mt-2 space-y-1">
              {stats.history.map((h) => (
                <li key={h.id} className="flex justify-between">
                  <span className="text-muted">
                    {{ vote: "Voto", poll_approved: "Pregunta publicada", welcome: "Bienvenida", redeem: "Canje", refund: "Devolución", adjust: "Ajuste" }[h.reason]} ·{" "}
                    {h.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span className={`font-bold tabular-nums ${h.amount < 0 ? "text-pink" : "text-ink"}`}>
                    {h.amount > 0 ? "+" : ""}
                    {h.amount}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="mine">
        <div className="flex items-center justify-between">
          <h2 id="mine" className="text-[26px] font-black tracking-[-0.045em]">
            Mis preguntas
          </h2>
          <Link href="/crear" className="rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-lime">
            + Crear
          </Link>
        </div>
        {mine.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {mine.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 py-3.5">
                <Link href={`/p/${p.slug}`} className="flex-1 font-semibold hover:underline">
                  {p.title}
                  {p.status === "rejected" && p.note && <span className="block text-xs text-pink">Motivo: {p.note}</span>}
                </Link>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.status === "published" ? "bg-lime" : p.status === "rejected" ? "bg-pink-soft" : "bg-wash"}`}>{STATUS[p.status]}</span>
                {p.status === "published" && <span className="text-xs text-muted">{p.voteCount} votos</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Aún no has propuesto ninguna pregunta.</p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="history">
        <h2 id="history" className="text-[26px] font-black tracking-[-0.045em]">
          Mi historial de votos
        </h2>
        {history.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {history.map((h) => (
              <li key={h.slug}>
                <Link href={`/p/${h.slug}`} className="group flex items-center gap-3 py-3">
                  <Photo src={h.imageUrl} alt="" label={h.title} tone={getCategory(h.category)?.tone} className="h-12 w-12 shrink-0 rounded-[14px]" initialsClass="text-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold group-hover:underline">{h.title}</span>
                    <span className="text-sm text-pink">Votaste: {h.option ?? h.writeIn}</span>
                  </span>
                  <time className="text-xs text-muted" dateTime={h.votedAt.toISOString()}>
                    {h.votedAt.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">
            Aún no has votado.{" "}
            <Link href="/descubrir" className="font-extrabold text-pink underline">
              Empieza ahora
            </Link>
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-[22px] bg-wash p-5 text-sm" aria-labelledby="privacy">
        <h2 id="privacy" className="text-lg font-extrabold tracking-[-0.03em]">
          Privacidad y datos
        </h2>
        <a href="/api/me/export" className="inline-block rounded-full bg-white px-4 py-2 font-bold ring-1 ring-line">
          Descargar mis datos (JSON)
        </a>
        <details>
          <summary className="cursor-pointer font-bold text-pink">Borrar mi cuenta</summary>
          <form action={deleteAccountAction} className="mt-3 space-y-2">
            <p className="text-muted">Se borrarán tu email y tu perfil. Tus votos se conservan de forma anónima para no alterar resultados.</p>
            {sp.error === "confirm" && <p className="text-pink">Escribe BORRAR para confirmar.</p>}
            <label className="block">
              <span className="sr-only">Escribe BORRAR para confirmar</span>
              <input name="confirm" placeholder="Escribe BORRAR" className="rounded-[14px] border-2 border-line bg-white px-3 py-2" />
            </label>
            <button className="rounded-full bg-pink px-4 py-2 font-bold text-white">Borrar definitivamente</button>
          </form>
        </details>
      </section>
    </div>
  );
}
