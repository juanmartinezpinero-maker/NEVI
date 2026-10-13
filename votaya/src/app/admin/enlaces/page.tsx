import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createShareLinkAction } from "@/app/actions/admin";
import { getBaseUrl } from "@/lib/request";

export default async function LinksPage() {
  const db = await getDb();
  const [links, polls] = await Promise.all([
    db
      .select({
        code: schema.shareLinks.code,
        label: schema.shareLinks.label,
        slug: schema.polls.slug,
        clicks: sql<number>`(select count(*)::int from events e where e.ref_code = ${schema.shareLinks.code} and e.type = 'link_click')`,
        votes: sql<number>`(select count(*)::int from events e where e.ref_code = ${schema.shareLinks.code} and e.type = 'vote')`,
        signups: sql<number>`(select count(*)::int from events e where e.ref_code = ${schema.shareLinks.code} and e.type = 'signup')`,
      })
      .from(schema.shareLinks)
      .leftJoin(schema.polls, eq(schema.polls.id, schema.shareLinks.pollId))
      .orderBy(desc(schema.shareLinks.createdAt)),
    db.select({ id: schema.polls.id, title: schema.polls.title }).from(schema.polls).where(eq(schema.polls.status, "published")).orderBy(desc(schema.polls.voteCount)).limit(100),
  ]);
  const base = await getBaseUrl();
  return (
    <div className="space-y-6">
      <form action={createShareLinkAction} className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
        <input name="label" required placeholder="Creador (p. ej. @lucia_tiktok)" aria-label="Nombre del creador" className="rounded-[16px] border-2 border-line bg-white px-3 py-2" />
        <input name="code" placeholder="código (opcional)" aria-label="Código" className="rounded-[16px] border-2 border-line bg-white px-3 py-2" />
        <select name="pollId" aria-label="Encuesta de destino" className="rounded-[16px] border-2 border-line bg-white px-3 py-2">
          <option value="">Portada</option>
          {polls.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button className="bg-ink text-lime rounded-xl px-4 py-2 font-bold text-white">Crear enlace</button>
      </form>
      <ul className="card divide-y divide-line">
        {links.map((l) => (
          <li key={l.code} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{l.label}</p>
              <code className="select-all text-xs text-pink">{base}/r/{l.code}</code>
              <p className="text-xs text-muted">Destino: {l.slug ? `/p/${l.slug}` : "portada"}</p>
            </div>
            <span>{l.clicks} clics</span><span>{l.votes} votos</span><span>{l.signups} registros</span>
          </li>
        ))}
        {!links.length && <li className="p-6 text-center text-muted">Crea el primer enlace para un creador de contenido.</li>}
      </ul>
      <p className="text-xs text-muted">También funciona añadir <code>?ref=codigo</code> a cualquier URL de voppi!</p>
    </div>
  );
}
