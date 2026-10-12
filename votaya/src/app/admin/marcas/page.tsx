import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { addBrandMemberAction, createBrandAction, removeBrandMemberAction, setBrandStatusAction } from "@/app/actions/brands";

const input = "rounded-[14px] border-2 border-line bg-white px-3 py-2 text-sm";

export default async function AdminBrandsPage() {
  const db = await getDb();
  const [brands, members, leads] = await Promise.all([
    db
      .select({
        id: schema.sponsors.id,
        name: schema.sponsors.name,
        contactEmail: schema.sponsors.contactEmail,
        status: schema.sponsors.status,
        polls: sql<number>`(select count(*)::int from polls p where p.sponsor_id = sponsors.id)`,
        votes: sql<number>`(select coalesce(sum(p.vote_count), 0)::int from polls p where p.sponsor_id = sponsors.id)`,
      })
      .from(schema.sponsors)
      .orderBy(asc(schema.sponsors.name)),
    db
      .select({ sponsorId: schema.sponsorMembers.sponsorId, userId: schema.users.id, email: schema.users.email, role: schema.sponsorMembers.role })
      .from(schema.sponsorMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.sponsorMembers.userId)),
    db.select().from(schema.businessLeads).orderBy(desc(schema.businessLeads.createdAt)).limit(10),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[22px] bg-wash p-5">
        <h2 className="mb-3 text-xl font-extrabold tracking-[-0.03em]">Nueva marca</h2>
        <form action={createBrandAction} className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="brand-name">Nombre de la marca</label>
          <input id="brand-name" name="name" required minLength={2} placeholder="Nombre de la marca" className={input} />
          <label className="sr-only" htmlFor="brand-email">Email de contacto</label>
          <input id="brand-email" name="contactEmail" type="email" placeholder="Email de contacto (opcional)" className={input} />
          <button className="rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-lime">Crear marca</button>
        </form>
      </section>

      {brands.map((b) => {
        const team = members.filter((m) => m.sponsorId === b.id);
        return (
          <section key={b.id} className="space-y-3 rounded-[22px] border-2 border-line p-5" aria-label={`Marca ${b.name}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                <Link href={`/marca/${b.id}`} className="hover:underline">
                  {b.name}
                </Link>
              </h2>
              <span className="text-sm text-muted">
                {b.polls} encuestas · {b.votes.toLocaleString("es-ES")} votos {b.contactEmail ? `· ${b.contactEmail}` : ""}
              </span>
            </div>
            <form action={setBrandStatusAction} className="flex flex-wrap gap-1.5 text-xs font-bold">
              <input type="hidden" name="sponsorId" value={b.id} />
              {(["lead", "active", "paused"] as const).map((s) => (
                <button key={s} name="status" value={s} className={`rounded-full px-3 py-1 ${b.status === s ? "bg-ink text-lime" : "bg-wash"}`}>
                  {s === "lead" ? "En prueba" : s === "active" ? "Activa" : "Pausada"}
                </button>
              ))}
            </form>
            <div>
              <h3 className="mb-1 text-sm font-bold">Acceso al panel</h3>
              {team.length ? (
                <ul className="space-y-1 text-sm">
                  {team.map((m) => (
                    <li key={m.userId} className="flex items-center gap-2">
                      <span>{m.email}</span>
                      <span className="text-xs text-muted">{m.role === "owner" ? "responsable" : "miembro"}</span>
                      <form action={removeBrandMemberAction}>
                        <input type="hidden" name="sponsorId" value={b.id} />
                        <input type="hidden" name="userId" value={m.userId} />
                        <button className="text-xs font-bold text-pink underline">Quitar</button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Nadie tiene acceso todavía.</p>
              )}
              <form action={addBrandMemberAction} className="mt-2 flex flex-wrap gap-2">
                <input type="hidden" name="sponsorId" value={b.id} />
                <label className="sr-only" htmlFor={`member-${b.id}`}>Email con acceso a {b.name}</label>
                <input id={`member-${b.id}`} name="email" type="email" required placeholder="email@marca.com" className={input} />
                <select name="role" aria-label="Rol" className={input}>
                  <option value="member">Miembro</option>
                  <option value="owner">Responsable</option>
                </select>
                <button className="rounded-full bg-pink px-4 py-2 text-sm font-extrabold text-white">Dar acceso</button>
              </form>
            </div>
          </section>
        );
      })}

      <section className="rounded-[22px] bg-wash p-5">
        <h2 className="mb-2 text-xl font-extrabold tracking-[-0.03em]">Últimas solicitudes de marcas</h2>
        {leads.length ? (
          <ul className="space-y-1 text-sm">
            {leads.map((l) => (
              <li key={l.id}>
                <b>{l.company}</b> · {l.email} · {l.createdAt.toLocaleDateString("es-ES")}
                {l.message ? <span className="block text-muted">{l.message}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Sin solicitudes todavía (llegan desde la página Empresas y marcas).</p>
        )}
      </section>
    </div>
  );
}
