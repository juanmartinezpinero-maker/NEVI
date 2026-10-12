import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createRewardAction, toggleRewardAction, updateRedemptionAction } from "@/app/actions/rewards";
import { rewardsMode } from "@/lib/points";

export default async function AdminRewardsPage() {
  const db = await getDb();
  const [rewards, reds, polls] = await Promise.all([
    db
      .select({ r: schema.rewards, sponsor: schema.sponsors.name })
      .from(schema.rewards)
      .leftJoin(schema.sponsors, eq(schema.sponsors.id, schema.rewards.sponsorId))
      .orderBy(desc(schema.rewards.createdAt)),
    db
      .select({ red: schema.redemptions, title: schema.rewards.title, email: schema.users.email })
      .from(schema.redemptions)
      .innerJoin(schema.rewards, eq(schema.rewards.id, schema.redemptions.rewardId))
      .innerJoin(schema.users, eq(schema.users.id, schema.redemptions.userId))
      .orderBy(desc(schema.redemptions.createdAt))
      .limit(100),
    db.select({ id: schema.polls.id, title: schema.polls.title }).from(schema.polls).where(eq(schema.polls.status, "published")).orderBy(desc(schema.polls.voteCount)).limit(100),
  ]);
  const input = "rounded-xl border border-line bg-white px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Modo de premios: <strong>{rewardsMode() === "live" ? "REAL" : "DEMOSTRACIÓN"}</strong>. En modo demostración solo se pueden canjear premios marcados como
        demo (cupones sin valor). Para premios reales: bases legales de la promoción, acuerdo con la marca y <code>REWARDS_MODE=live</code>.
      </p>
      <form action={createRewardAction} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="font-display text-lg font-bold sm:col-span-2">Nuevo premio</h2>
        <input name="title" required placeholder="Premio (p. ej. Pizza mediana gratis)" aria-label="Título del premio" className={input} />
        <input name="sponsor" placeholder="Marca patrocinadora" aria-label="Marca patrocinadora" className={input} />
        <input name="costPoints" type="number" min={1} required placeholder="Coste en puntos" aria-label="Coste en puntos" className={input} />
        <input name="stock" type="number" min={0} required placeholder="Unidades disponibles" aria-label="Unidades" className={input} />
        <input name="imageUrl" placeholder="URL de imagen (https)" aria-label="Imagen" className={input} />
        <select name="pollId" aria-label="Encuesta patrocinada" className={input}>
          <option value="">Sin encuesta asociada</option>
          {polls.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input name="description" placeholder="Condiciones (p. ej. válido en locales adheridos hasta el 31/12)" aria-label="Descripción" className={`${input} sm:col-span-2`} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDemo" defaultChecked className="accent-rose-600" /> Premio de demostración (sin valor real)
        </label>
        <button className="rounded-xl bg-brand px-4 py-2 font-bold text-white">Crear premio</button>
      </form>

      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Premios ({rewards.length})</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1">Premio</th>
              <th>Marca</th>
              <th>Puntos</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map(({ r, sponsor }) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-2 font-semibold">
                  {r.title} {r.isDemo && <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-800">demo</span>}
                </td>
                <td>{sponsor ?? "—"}</td>
                <td>{r.costPoints}</td>
                <td>{r.stock}</td>
                <td>
                  <form action={toggleRewardAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{r.active ? "Activo · pausar" : "Pausado · activar"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Canjes ({reds.length})</h2>
        {reds.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1">Fecha</th>
                <th>Usuario</th>
                <th>Premio</th>
                <th>Código</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reds.map(({ red, title, email }) => (
                <tr key={red.id} className="border-t border-line">
                  <td className="py-2">{red.createdAt.toLocaleDateString("es-ES")}</td>
                  <td>{email}</td>
                  <td>{title}</td>
                  <td>
                    <code>{red.code}</code>
                  </td>
                  <td>
                    {red.status === "pending" ? (
                      <form action={updateRedemptionAction} className="flex gap-1">
                        <input type="hidden" name="id" value={red.id} />
                        <button name="status" value="delivered" className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                          Entregado
                        </button>
                        <button name="status" value="cancelled" className="rounded-full bg-slate-200 px-2 py-1 text-xs font-bold">
                          Cancelar y devolver puntos
                        </button>
                      </form>
                    ) : (
                      { delivered: "Entregado", cancelled: "Cancelado" }[red.status]
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">Todavía no hay canjes.</p>
        )}
      </section>
    </div>
  );
}
