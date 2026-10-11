import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { setRoleAction } from "@/app/actions/admin";
import { countryFlag } from "@/lib/demographics";

export default async function UsersPage() {
  const db = await getDb();
  const [users, leads] = await Promise.all([
    db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(100),
    db.select().from(schema.businessLeads).orderBy(desc(schema.businessLeads.createdAt)).limit(50),
  ]);
  return (
    <div className="space-y-6">
      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-extrabold">Últimos usuarios</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted"><tr><th className="py-1">Email</th><th>Perfil</th><th>Origen</th><th>Alta</th><th>Rol</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="py-2">{u.email}</td>
                <td>{u.profileCompleted ? `${countryFlag(u.country)} ${u.ageRange} ${u.gender}` : "incompleto"}</td>
                <td>{u.refCode ?? "—"}</td>
                <td>{u.createdAt.toLocaleDateString("es-ES")}</td>
                <td>
                  <form action={setRoleAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button name="role" value={u.role === "admin" ? "user" : "admin"} className="rounded-full bg-ink-3 px-2 py-0.5 text-xs font-bold">
                      {u.role} ⇄
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-display text-lg font-extrabold">Lista de espera de marcas ({leads.length})</h2>
        <ul className="space-y-2 text-sm">
          {leads.map((l) => (
            <li key={l.id} className="border-b border-line pb-2"><strong>{l.company}</strong> · {l.email}{l.message && <p className="text-muted">{l.message}</p>}</li>
          ))}
          {!leads.length && <li className="text-muted">Sin solicitudes todavía.</li>}
        </ul>
      </section>
    </div>
  );
}
