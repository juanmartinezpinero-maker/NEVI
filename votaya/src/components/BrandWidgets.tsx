import { countryFlag, countryName, genderLabel } from "@/lib/demographics";
import type { Results, Segment } from "@/lib/polls";
import { formatCount } from "@/lib/text";

/** Cifras clave del panel de marca. */
export function KpiTiles({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.label} className={`rounded-[22px] p-4 ${i === 0 ? "bg-lime" : i === 1 ? "bg-ink text-white" : "bg-wash"}`}>
          <dt className={`text-xs font-semibold ${i === 1 ? "text-white/70" : "text-muted"}`}>{it.label}</dt>
          <dd className={`mt-1 text-[30px] font-black leading-none tracking-[-0.05em] tabular-nums ${i === 1 ? "text-lime" : ""}`}>{it.value}</dd>
          {it.hint && <dd className={`mt-1 text-xs ${i === 1 ? "text-white/60" : "text-muted"}`}>{it.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Resultados por opción: barras horizontales con el porcentaje y los votos escritos. */
export function ResultBars({ results }: { results: Results }) {
  const max = Math.max(1, ...results.rows.map((r) => r.pct));
  return (
    <ul className="space-y-3">
      {[...results.rows]
        .sort((a, b) => b.count - a.count)
        .map((r, i) => (
          <li key={r.id}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="font-bold">{r.isOther ? "Otra respuesta (escrita)" : r.label}</span>
              <span className="tabular-nums text-ink-2">
                {r.pct}% · {r.count.toLocaleString("es-ES")} {r.count === 1 ? "voto" : "votos"}
              </span>
            </div>
            <div className="h-3 rounded-full bg-wash">
              <div className={`h-full rounded-full ${i === 0 ? "bg-pink" : "bg-ink"}`} style={{ width: `${(r.pct / max) * 100}%` }} />
            </div>
          </li>
        ))}
    </ul>
  );
}

/** Votos por día (últimos N días). Pasar el ratón por una barra muestra el día y los votos. */
export function DailyBars({ series }: { series: { day: string; n: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.n));
  const total = series.reduce((a, d) => a + d.n, 0);
  const W = 600;
  const H = 140;
  const bw = W / series.length;
  const fmtDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-auto w-full" role="img" aria-label={`Votos por día: ${total} en ${series.length} días`}>
        <line x1="0" x2={W} y1={H} y2={H} stroke="#e7e6e1" strokeWidth="1" />
        {series.map((d, i) => {
          const h = d.n ? Math.max(3, (d.n / max) * (H - 24)) : 0;
          return (
            <g key={d.day}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent">
                <title>{`${fmtDay(d.day)}: ${d.n} votos`}</title>
              </rect>
              {h > 0 && (
                <rect x={i * bw + 1} y={H - h} width={Math.max(1, bw - 2)} height={h} rx="3" fill="#222128" pointerEvents="none" />
              )}
            </g>
          );
        })}
        <text x="0" y={H + 15} fontSize="11" fill="#6f6e77">
          {fmtDay(series[0].day)}
        </text>
        <text x={W} y={H + 15} fontSize="11" fill="#6f6e77" textAnchor="end">
          {fmtDay(series[series.length - 1].day)}
        </text>
        <text x={W} y="11" fontSize="11" fill="#6f6e77" textAnchor="end">
          máx. {max}/día
        </text>
      </svg>
      <figcaption className="sr-only">
        {series
          .filter((d) => d.n)
          .map((d) => `${fmtDay(d.day)}: ${d.n}`)
          .join(", ") || "Sin votos en este periodo"}
      </figcaption>
    </figure>
  );
}

/** Lista con barra proporcional: origen de las visitas, canales de compartir… */
export function BarList({ items, empty }: { items: { label: string; n: number }[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate font-semibold">{it.label}</span>
          <span className="h-2.5 rounded-full bg-wash">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${(it.n / max) * 100}%` }} />
          </span>
          <span className="tabular-nums text-ink-2">{formatCount(it.n)}</span>
        </li>
      ))}
    </ul>
  );
}

const DIM_LABEL = { country: "País", ageRange: "Edad", gender: "Género" } as const;

function segLabel(dim: keyof typeof DIM_LABEL, key: string) {
  if (dim === "country") return `${countryFlag(key)} ${countryName(key)}`;
  if (dim === "gender") return genderLabel(key);
  return `${key} años`;
}

/** Desglose por grupo como tabla: opción ganadora y su porcentaje (solo grupos con votos suficientes). */
export function SegmentTable({
  dim,
  data,
  optionLabel,
  minVotes,
}: {
  dim: keyof typeof DIM_LABEL;
  data: { segments: Segment[]; hidden: number };
  optionLabel: (id: string) => string;
  minVotes: number;
}) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-extrabold tracking-[-0.03em]">Por {DIM_LABEL[dim].toLowerCase()}</h3>
      {data.segments.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-1.5 font-semibold">{DIM_LABEL[dim]}</th>
              <th className="py-1.5 font-semibold">Gana</th>
              <th className="py-1.5 text-right font-semibold">%</th>
              <th className="py-1.5 text-right font-semibold">Votos</th>
            </tr>
          </thead>
          <tbody>
            {data.segments.map((s) => (
              <tr key={s.key} className="border-b border-line last:border-0">
                <td className="py-1.5 font-semibold">{segLabel(dim, s.key)}</td>
                <td className="py-1.5">{optionLabel(s.rows[0].id)}</td>
                <td className="py-1.5 text-right tabular-nums">{s.rows[0].pct}%</td>
                <td className="py-1.5 text-right tabular-nums">{s.total.toLocaleString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted">Aún no hay grupos con {minVotes} votos verificados o más.</p>
      )}
      {data.hidden > 0 && <p className="mt-1 text-xs text-muted">{data.hidden} grupos ocultos por tener menos de {minVotes} votos (privacidad).</p>}
    </div>
  );
}
