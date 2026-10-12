import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { deleteAccountAction, logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { countryFlag, countryName, genderLabel } from "@/lib/demographics";
import { getUserHistory } from "@/lib/polls";
import { getUserStats } from "@/lib/points";

export const metadata: Metadata = { title: "Mi perfil", robots: { index: false } };

const STATUS: Record<string, string> = { pending: "⏳ En moderación", published: "✅ Publicada", rejected: "❌ Rechazada", archived: "📦 Archivada" };

export default async function ProfilePage(props: PageProps<"/perfil">) {
  const user = await requireUser("/perfil");
  const sp = await props.searchParams;
  const db = await getDb();
  const [history, stats, mine] = await Promise.all([
    getUserHistory(user.id),
    getUserStats(user.id),
    db
      .select({ slug: schema.polls.slug, title: schema.polls.title, status: schema.polls.status, voteCount: schema.polls.voteCount, note: schema.polls.moderationNote })
      .from(schema.polls)
      .where(eq(schema.polls.authorId, user.id))
      .orderBy(desc(schema.polls.createdAt)),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {sp.propuesta === "ok" && (
        <p role="status" className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
          🎉 ¡Gracias! Tu pregunta está en moderación y la publicaremos en cuanto la revisemos.
        </p>
      )}
      <section className="card flex flex-wrap items-center gap-4 p-5">
        <div className="bg-brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl font-black">
          {user.email[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-extrabold">{user.email}</h1>
          <p className="text-sm text-muted">
            {countryFlag(user.country)} {countryName(user.country)} · {user.ageRange} años · {genderLabel(user.gender)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/entrar/perfil?next=/perfil" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
            Editar
          </Link>
          <form action={logoutAction}>
            <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">Salir</button>
          </form>
        </div>
      </section>

      <section className="card overflow-hidden" aria-labelledby="stats">
        <h2 id="stats" className="sr-only">
          Mis estadísticas
        </h2>
        <div className="grid grid-cols-3 divide-x divide-line text-center">
          <div className="p-4">
            <p className="font-display text-3xl font-extrabold">{stats.voteCount}</p>
            <p className="text-xs text-muted">encuestas votadas</p>
          </div>
          <div className="bg-amber-50 p-4">
            <p className="font-display text-3xl font-extrabold text-amber-700">⭐ {stats.balance}</p>
            <p className="text-xs text-muted">puntos</p>
          </div>
          <div className="p-4">
            <p className="font-display text-3xl font-extrabold">{mine.length}</p>
            <p className="text-xs text-muted">preguntas propuestas</p>
          </div>
        </div>
        <div className="border-t border-line p-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>
              {stats.level.emoji} Nivel {stats.level.name}
            </span>
            {stats.level.next && (
              <span className="text-muted">
                {stats.level.next.emoji} {stats.level.next.name} en {stats.level.next.min - stats.voteCount} votos
              </span>
            )}
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${stats.level.progress}%` }} />
          </div>
          <Link href="/recompensas" className="mt-3 inline-block text-sm font-bold text-brand hover:underline">
            🎁 Canjear mis puntos →
          </Link>
        </div>
        {stats.history.length > 0 && (
          <details className="border-t border-line p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Movimientos de puntos</summary>
            <ul className="mt-2 space-y-1">
              {stats.history.map((h) => (
                <li key={h.id} className="flex justify-between">
                  <span className="text-muted">
                    {{ vote: "Voto", poll_approved: "Pregunta publicada", welcome: "Bienvenida", redeem: "Canje", refund: "Devolución", adjust: "Ajuste" }[h.reason]} ·{" "}
                    {h.createdAt.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span className={`font-bold tabular-nums ${h.amount < 0 ? "text-rose-600" : "text-emerald-700"}`}>
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
          <h2 id="mine" className="font-display text-2xl font-extrabold">
            Mis preguntas
          </h2>
          <Link href="/crear" className="bg-brand-gradient rounded-full px-4 py-2 text-sm font-bold text-white">
            + Crear
          </Link>
        </div>
        {mine.length ? (
          <ul className="card divide-y divide-line">
            {mine.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 p-4">
                <Link href={`/p/${p.slug}`} className="flex-1 font-semibold hover:underline">
                  {p.title}
                  {p.status === "rejected" && p.note && <span className="block text-xs text-rose-600">Motivo: {p.note}</span>}
                </Link>
                <span className="text-xs text-muted">{STATUS[p.status]}</span>
                {p.status === "published" && <span className="text-xs text-muted">{p.voteCount} votos</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Aún no has propuesto ninguna pregunta.</p>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="history">
        <h2 id="history" className="font-display text-2xl font-extrabold">
          Mi historial de votos
        </h2>
        {history.length ? (
          <ul className="card divide-y divide-line">
            {history.map((h) => (
              <li key={h.slug}>
                <Link href={`/p/${h.slug}`} className="flex items-center gap-3 p-4 hover:bg-slate-100">
                  <span className="text-2xl" aria-hidden>
                    {h.emoji ?? getCategory(h.category)?.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{h.title}</span>
                    <span className="text-sm text-brand">Votaste: {h.option ?? h.writeIn}</span>
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
            <Link href="/descubrir" className="font-bold text-brand underline">
              Empieza ahora
            </Link>
          </p>
        )}
      </section>

      <section className="card space-y-3 p-5 text-sm" aria-labelledby="privacy">
        <h2 id="privacy" className="font-display text-lg font-extrabold">
          Privacidad y datos
        </h2>
        <a href="/api/me/export" className="inline-block rounded-full bg-slate-100 px-4 py-2 font-bold">
          ⬇️ Descargar mis datos (JSON)
        </a>
        <details>
          <summary className="cursor-pointer font-bold text-rose-600">Borrar mi cuenta</summary>
          <form action={deleteAccountAction} className="mt-3 space-y-2">
            <p className="text-muted">Se borrarán tu email y tu perfil. Tus votos se conservan de forma anónima para no alterar resultados.</p>
            {sp.error === "confirm" && <p className="text-rose-600">Escribe BORRAR para confirmar.</p>}
            <label className="block">
              <span className="sr-only">Escribe BORRAR para confirmar</span>
              <input name="confirm" placeholder="Escribe BORRAR" className="rounded-xl border border-line bg-white px-3 py-2" />
            </label>
            <button className="rounded-full bg-rose-600 px-4 py-2 font-bold">Borrar definitivamente</button>
          </form>
        </details>
      </section>
    </div>
  );
}
