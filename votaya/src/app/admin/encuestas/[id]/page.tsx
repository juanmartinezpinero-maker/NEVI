import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { mergeWriteInAction, promoteWriteInAction, toggleWriteInAction, updatePollAction } from "@/app/actions/admin";
import { setPollBrandAction } from "@/app/actions/brands";
import { getResults } from "@/lib/polls";

export default async function AdminPollDetail(props: PageProps<"/admin/encuestas/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [poll] = await db.select().from(schema.polls).where(eq(schema.polls.id, id));
  if (!poll) notFound();
  const results = await getResults(poll.id);
  const allWriteIns = await db.select().from(schema.writeIns).where(eq(schema.writeIns.pollId, poll.id));
  const brands = await db.select({ id: schema.sponsors.id, name: schema.sponsors.name }).from(schema.sponsors);
  const counts = new Map(results.writeIns.map((w) => [w.id, w.count]));

  return (
    <div className="space-y-6">
      <Link href="/admin/encuestas" className="text-sm text-muted">← Encuestas</Link>
      <section className="card space-y-4 p-5">
        <form action={updatePollAction} className="flex gap-2">
          <input type="hidden" name="id" value={poll.id} />
          <input type="hidden" name="action" value="edit" />
          <label className="sr-only" htmlFor="title">Título</label>
          <input id="title" name="title" defaultValue={poll.title} className="min-w-0 flex-1 rounded-[16px] border-2 border-line bg-white px-3 py-2 font-bold" />
          <button className="rounded-xl bg-wash px-4 font-bold">Guardar</button>
        </form>
        <p className="text-sm text-muted">
          {results.total} votos · {results.verified} verificados · estado {poll.status} · <Link className="underline" href={`/p/${poll.slug}`}>/p/{poll.slug}</Link>
        </p>
        <ul className="space-y-1 text-sm">
          {results.rows.map((r) => (
            <li key={r.id} className="flex justify-between border-b border-line py-1"><span>{r.emoji} {r.label}</span><span>{r.count} · {r.pct}%</span></li>
          ))}
        </ul>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-extrabold">Marca</h2>
        <form action={setPollBrandAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="pollId" value={poll.id} />
          <label className="sr-only" htmlFor="poll-brand">Marca de la encuesta</label>
          <select id="poll-brand" name="sponsorId" defaultValue={poll.sponsorId ?? ""} className="rounded-[14px] border-2 border-line bg-white px-3 py-2 text-sm">
            <option value="">Sin marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="poll-visibility">Visibilidad</label>
          <select id="poll-visibility" name="visibility" defaultValue={poll.visibility} className="rounded-[14px] border-2 border-line bg-white px-3 py-2 text-sm">
            <option value="public">Pública (patrocinada)</option>
            <option value="private">Privada (solo con enlace)</option>
          </select>
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-lime">Guardar</button>
        </form>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-extrabold">Respuestas «Otra» agrupadas ({allWriteIns.length})</h2>
        <p className="text-sm text-muted">
          El sistema agrupa automáticamente variantes (tildes, mayúsculas, plurales, erratas). Aquí puedes convertir una respuesta en opción oficial, unir grupos u ocultarla.
        </p>
        <ul className="divide-y divide-line">
          {allWriteIns
            .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
            .map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                <span className={`flex-1 font-semibold ${w.hidden ? "line-through opacity-50" : ""}`}>
                  {w.label} <span className="text-muted">· {counts.get(w.id) ?? 0} votos</span>
                </span>
                <form action={promoteWriteInAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold">Convertir en opción</button>
                </form>
                <form action={toggleWriteInAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button className="rounded-full bg-wash px-3 py-1 text-xs font-bold">{w.hidden ? "Mostrar" : "Ocultar"}</button>
                </form>
                {allWriteIns.length > 1 && (
                  <form action={mergeWriteInAction} className="flex gap-1">
                    <input type="hidden" name="id" value={w.id} />
                    <select name="into" aria-label={`Unir ${w.label} con`} className="rounded-full border border-line bg-white px-2 text-xs">
                      {allWriteIns.filter((x) => x.id !== w.id).map((x) => (
                        <option key={x.id} value={x.id}>{x.label}</option>
                      ))}
                    </select>
                    <button className="rounded-full bg-wash px-3 py-1 text-xs font-bold">Unir</button>
                  </form>
                )}
              </li>
            ))}
          {!allWriteIns.length && <li className="py-2 text-sm text-muted">Sin respuestas libres.</li>}
        </ul>
      </section>

      <form action={updatePollAction} className="text-right">
        <input type="hidden" name="id" value={poll.id} />
        <button name="action" value="delete" className="rounded-full bg-rose-700 px-4 py-2 text-sm font-bold">Eliminar encuesta y sus votos</button>
      </form>
    </div>
  );
}
