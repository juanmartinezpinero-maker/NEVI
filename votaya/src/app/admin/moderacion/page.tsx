import { asc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { moderatePollAction } from "@/app/actions/admin";
import { getCategory } from "@/lib/categories";
import { findSimilarPolls } from "@/lib/polls";

export default async function ModerationPage() {
  const db = await getDb();
  const pending = await db
    .select({ poll: schema.polls, author: schema.users.email })
    .from(schema.polls)
    .leftJoin(schema.users, eq(schema.users.id, schema.polls.authorId))
    .where(eq(schema.polls.status, "pending"))
    .orderBy(asc(schema.polls.createdAt));
  const options = pending.length
    ? await db.select().from(schema.pollOptions).where(inArray(schema.pollOptions.pollId, pending.map((p) => p.poll.id))).orderBy(asc(schema.pollOptions.position))
    : [];
  const similar = await Promise.all(pending.map((p) => findSimilarPolls(p.poll.title)));

  if (!pending.length) return <p className="card p-6 text-center text-muted">🎉 No hay preguntas pendientes de moderar.</p>;
  return (
    <ul className="space-y-4">
      {pending.map(({ poll, author }, i) => (
        <li key={poll.id} className="card space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{getCategory(poll.category)?.name}</span>·<span>{author ?? "—"}</span>·<span>{poll.createdAt.toLocaleString("es-ES")}</span>
          </div>
          <h2 className="font-display text-xl font-extrabold">{poll.emoji} {poll.title}</h2>
          {poll.description && <p className="text-sm text-muted">{poll.description}</p>}
          <ul className="flex flex-wrap gap-2 text-sm">
            {options.filter((o) => o.pollId === poll.id).map((o) => (
              <li key={o.id} className="rounded-full bg-ink-3 px-3 py-1">{o.emoji} {o.label}</li>
            ))}
            {poll.allowOther && <li className="rounded-full border border-dashed border-line px-3 py-1">✍️ Otra</li>}
          </ul>
          {similar[i].filter((s) => s.id !== poll.id).length > 0 && (
            <p className="text-sm text-amber-200">
              Posible duplicado de: {similar[i].filter((s) => s.id !== poll.id).map((s) => s.title).join(" · ")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <form action={moderatePollAction}>
              <input type="hidden" name="id" value={poll.id} />
              <input type="hidden" name="decision" value="approve" />
              <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold">✓ Aprobar y publicar</button>
            </form>
            <form action={moderatePollAction} className="flex flex-1 gap-2">
              <input type="hidden" name="id" value={poll.id} />
              <input type="hidden" name="decision" value="reject" />
              <input name="note" placeholder="Motivo del rechazo" aria-label="Motivo del rechazo" className="min-w-0 flex-1 rounded-full border border-line bg-ink-2 px-4 text-sm" />
              <button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-bold">Rechazar</button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
