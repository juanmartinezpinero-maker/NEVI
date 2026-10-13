import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBrandPoll, getPollAnalytics, isBrandMember } from "@/lib/brands";

const cell = (v: string | number) => {
  const s = String(v);
  // Evita inyección de fórmulas al abrir el CSV en Excel.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** CSV con resultados y desgloses agregados de una encuesta de la marca (sin datos individuales). */
export async function GET(_req: Request, ctx: RouteContext<"/api/marca/[sponsorId]/[pollId]/csv">) {
  const { sponsorId, pollId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(sponsorId) || !(await isBrandMember(user, sponsorId))) {
    return new NextResponse("No autorizado", { status: 403 });
  }
  const poll = await getBrandPoll(sponsorId, pollId);
  const a = await getPollAnalytics(poll.id);
  const label = (id: string) => a.results.rows.find((r) => r.id === id)?.label ?? "Otra respuesta";
  const lines: (string | number)[][] = [["seccion", "grupo", "opcion", "votos", "porcentaje"]];
  for (const r of a.results.rows) lines.push(["total", "todos", r.isOther ? "Otra respuesta" : r.label, r.count, r.pct]);
  for (const w of a.results.writeIns) lines.push(["respuesta_escrita", "todos", w.label, w.count, ""]);
  for (const [dim, data] of Object.entries(a.segments)) {
    for (const s of data.segments) for (const r of s.rows) lines.push([dim, s.key, label(r.id), r.count, r.pct]);
  }
  for (const d of a.series) lines.push(["votos_por_dia", d.day, "", d.n, ""]);
  for (const s of a.sources) lines.push(["visitas_por_origen", s.label, "", s.n, ""]);
  const csv = "﻿" + lines.map((l) => l.map(cell).join(";")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="voppi-${poll.slug}.csv"`,
      "cache-control": "no-store",
    },
  });
}
