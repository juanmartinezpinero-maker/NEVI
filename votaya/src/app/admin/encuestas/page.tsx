import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { updatePollAction } from "@/app/actions/admin";
import { todayISO } from "@/lib/polls";

const STATUSES = ["published", "pending", "rejected", "archived"] as const;
const LABEL: Record<string, string> = { published: "Publicadas", pending: "Pendientes", rejected: "Rechazadas", archived: "Archivadas" };

export default async function AdminPolls(props: PageProps<"/admin/encuestas">) {
  const sp = await props.searchParams;
  const status = STATUSES.find((s) => s === sp.estado) ?? "published";
  const db = await getDb();
  const polls = await db.select().from(schema.polls).where(eq(schema.polls.status, status)).orderBy(desc(schema.polls.voteCount)).limit(200);
  const today = todayISO();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/encuestas?estado=${s}`} className={`rounded-full px-3 py-1.5 text-sm font-bold ${s === status ? "bg-ink text-white" : "bg-wash"}`}>
            {LABEL[s]}
          </Link>
        ))}
        <Link href="/crear" className="bg-ink text-lime ml-auto rounded-full px-4 py-1.5 text-sm font-bold text-white">+ Nueva encuesta</Link>
      </div>
      <ul className="card divide-y divide-line">
        {polls.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/encuestas/${p.id}`} className="font-semibold hover:underline">
                {p.emoji} {p.title}
              </Link>
              <p className="text-xs text-muted">
                {p.voteCount} votos · {p.category}
                {p.isDemo && " · DEMO"}
                {p.featuredOn === today && " · Pregunta del día"}
              </p>
            </div>
            <form action={updatePollAction} className="flex flex-wrap gap-1.5 text-xs font-bold">
              <input type="hidden" name="id" value={p.id} />
              {status === "published" &&
                (p.featuredOn === today ? (
                  <button name="action" value="unfeature" className="rounded-full bg-wash px-3 py-1.5">Quitar destacada</button>
                ) : (
                  <button name="action" value="feature" className="rounded-full bg-lime px-3 py-1.5 text-ink">Destacar hoy</button>
                ))}
              {status === "published" ? (
                <button name="action" value="archive" className="rounded-full bg-wash px-3 py-1.5">Archivar</button>
              ) : (
                <button name="action" value="publish" className="rounded-full bg-emerald-600 px-3 py-1.5">Publicar</button>
              )}
              <Link href={`/p/${p.slug}`} className="rounded-full bg-wash px-3 py-1.5">Ver</Link>
            </form>
          </li>
        ))}
        {!polls.length && <li className="p-6 text-center text-muted">Sin encuestas en este estado.</li>}
      </ul>
    </div>
  );
}
