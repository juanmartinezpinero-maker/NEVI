"use client";

import { useState } from "react";

type Seg = { key: string; label: string; flag?: string; total: number; rows: { id: string; pct: number }[] };
type Tab = { id: string; label: string; segments: Seg[]; hidden: number };

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#22d3ee", "#a3e635", "#fb7185", "#38bdf8", "#34d399", "#fb923c", "#e879f9", "#cbd5e1"];

export function SegmentTabs({ tabs, options, minVotes }: { tabs: Tab[]; options: { id: string; label: string }[]; minVotes: number }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active)!;
  const colorOf = (id: string) => COLORS[Math.max(0, options.findIndex((o) => o.id === id)) % COLORS.length];
  const labelOf = (id: string) => options.find((o) => o.id === id)?.label ?? "Otra";

  return (
    <div>
      <div role="tablist" aria-label="Segmentar resultados" className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${t.id === active ? "bg-ink text-white" : "bg-slate-100 text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab.segments.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no hay suficientes votos verificados para mostrar este desglose (mínimo {minVotes} por grupo).
          </p>
        ) : (
          <ul className="space-y-3">
            {tab.segments.map((s) => (
              <li key={s.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold">
                    {s.flag ? <span aria-hidden>{s.flag} </span> : null}
                    {s.label}
                  </span>
                  <span className="text-muted">
                    gana <strong className="text-ink">{labelOf(s.rows[0].id)}</strong> · {s.total} votos
                  </span>
                </div>
                <div
                  className="flex h-3 overflow-hidden rounded-full bg-slate-100"
                  role="img"
                  aria-label={s.rows.map((r) => `${labelOf(r.id)} ${r.pct}%`).join(", ")}
                >
                  {s.rows.map((r) => (
                    <div key={r.id} style={{ width: `${r.pct}%`, background: colorOf(r.id) }} title={`${labelOf(r.id)} ${r.pct}%`} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {tab.hidden > 0 && <p className="mt-3 text-xs text-muted">{tab.hidden} grupos ocultos por tener menos de {minVotes} votos.</p>}
      </div>
      <ul className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
        {options.map((o) => (
          <li key={o.id} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colorOf(o.id) }} />
            {o.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
