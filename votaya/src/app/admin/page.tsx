import { getDailyVotes, getKpis, getRefStats, getRetention, getShareChannels, getSuspiciousIps, getTrafficSources } from "@/lib/admin-stats";

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-black tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default async function AdminHome() {
  const [k, ret, daily, refs, channels, sources, suspicious] = await Promise.all([
    getKpis(),
    getRetention(),
    getDailyVotes(),
    getRefStats(),
    getShareChannels(),
    getTrafficSources(),
    getSuspiciousIps(),
  ]);
  const maxDay = Math.max(1, ...daily.map((d) => d.n));
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Votos" value={k.votes.toLocaleString("es-ES")} sub={`${k.votes_24h} hoy · ${k.votes_7d} en 7 días`} />
        <Kpi label="Usuarios" value={k.users} sub={`${k.users_24h} hoy · ${k.users_7d} en 7 días`} />
        <Kpi label="Votos verificados" value={pct(k.verified_votes, k.votes)} sub="de cuentas con email" />
        <Kpi label="Encuestas" value={k.published} sub={`${k.pending} pendientes de moderar`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-extrabold">Embudo de conversión (7 días)</h2>
          <ol className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Visitantes únicos</span><strong>{k.viewers_7d}</strong></li>
            <li className="flex justify-between"><span>→ Votantes únicos</span><strong>{k.voters_7d} <span className="text-muted">({pct(k.voters_7d, k.viewers_7d)})</span></strong></li>
            <li className="flex justify-between"><span>→ Registros</span><strong>{k.signups_7d} <span className="text-muted">({pct(k.signups_7d, k.voters_7d)})</span></strong></li>
            <li className="flex justify-between text-muted"><span>Páginas vistas</span><span>{k.views_7d}</span></li>
          </ol>
          <h3 className="mb-2 mt-5 font-bold">Retención de registrados</h3>
          <p className="text-sm">
            Día 1: <strong>{pct(ret.ret_d1, ret.cohort_d1)}</strong> <span className="text-muted">(cohorte {ret.cohort_d1})</span> · Días 1-7:{" "}
            <strong>{pct(ret.ret_d7, ret.cohort_d7)}</strong> <span className="text-muted">(cohorte {ret.cohort_d7})</span>
          </p>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-extrabold">Votos por día</h2>
          <div className="flex h-40 items-end gap-1" role="img" aria-label="Gráfico de votos de los últimos 14 días">
            {daily.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div className="bg-brand-gradient w-full rounded-t" style={{ height: `${(d.n / maxDay) * 100}%`, minHeight: 2 }} title={`${d.day}: ${d.n}`} />
                </div>
                <span className="text-[9px] text-muted">{d.day.slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-display text-lg font-extrabold">Atribución por enlace / creador</h2>
        {refs.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr><th className="py-1">Código</th><th>Clics</th><th>Visitas</th><th>Votos</th><th>Registros</th></tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.ref} className="border-t border-line">
                  <td className="py-2 font-semibold">{r.label ?? r.ref} <span className="text-muted">({r.ref})</span></td>
                  <td>{r.clicks}</td><td>{r.views}</td><td>{r.votes}</td><td>{r.signups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">Aún no hay tráfico atribuido. Crea enlaces en «Creadores».</p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-extrabold">Compartidos (30 días)</h2>
          <ul className="space-y-1 text-sm">
            {channels.length ? channels.map((c) => <li key={c.channel} className="flex justify-between"><span>{c.channel}</span><strong>{c.n}</strong></li>) : <li className="text-muted">Sin datos</li>}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-extrabold">Visitas por origen (30 días)</h2>
          <ul className="space-y-1 text-sm">
            {sources.length ? sources.map((s) => <li key={s.src} className="flex justify-between"><span>{s.src}</span><strong>{s.n}</strong></li>) : <li className="text-muted">Sin datos</li>}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-display text-lg font-extrabold">⚠️ Actividad sospechosa (24 h)</h2>
          {suspicious.length ? (
            <ul className="space-y-1 text-sm">
              {suspicious.map((s) => (
                <li key={s.ip_hash} className="flex justify-between"><code className="text-xs">{s.ip_hash.slice(0, 10)}…</code><span>{s.n} votos · {s.polls} encuestas · {s.anon} anónimos</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nada fuera de lo normal.</p>
          )}
        </div>
      </section>
    </div>
  );
}
