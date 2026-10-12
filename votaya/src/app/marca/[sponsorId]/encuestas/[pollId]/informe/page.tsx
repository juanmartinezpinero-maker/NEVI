import type { Metadata } from "next";
import Link from "next/link";
import { BarList, DailyBars, KpiTiles, ResultBars, SegmentTable } from "@/components/BrandWidgets";
import { PrintButton } from "@/components/PrintButton";
import { getBrandPoll, getPollAnalytics, requireBrand } from "@/lib/brands";
import { MIN_SEGMENT } from "@/lib/polls";
import { formatCount } from "@/lib/text";

export const metadata: Metadata = { title: "Informe de resultados", robots: { index: false } };

/** Informe listo para imprimir o guardar como PDF desde el navegador. */
export default async function BrandReport(props: PageProps<"/marca/[sponsorId]/encuestas/[pollId]/informe">) {
  const { sponsorId, pollId } = await props.params;
  const { brand } = await requireBrand(sponsorId, `/marca/${sponsorId}/encuestas/${pollId}/informe`);
  const poll = await getBrandPoll(sponsorId, pollId);
  const a = await getPollAnalytics(poll.id);
  const optionLabel = (id: string) => a.results.rows.find((r) => r.id === id)?.label ?? "Otra respuesta";
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const top = [...a.results.rows].sort((x, y) => y.count - x.count)[0];

  return (
    <article className="mx-auto max-w-3xl space-y-8 bg-white">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-wash p-3">
        <Link href={`/marca/${sponsorId}/encuestas/${poll.id}`} className="text-sm font-bold underline">
          ← Volver al panel
        </Link>
        <PrintButton />
      </div>

      <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-5">
        <div>
          <p className="kicker">Informe de resultados · {brand.name}</p>
          <h1 className="mt-1 text-[34px] font-black leading-[1.02] tracking-[-0.05em]">{poll.title}</h1>
          <p className="mt-2 text-sm text-muted">
            Generado el {today} · {poll.visibility === "private" ? "Encuesta privada" : "Encuesta pública patrocinada"}
          </p>
        </div>
        <span className="shrink-0 text-3xl font-black tracking-[-0.06em]">
          voppi<span className="text-pink">!</span>
        </span>
      </header>

      {top && a.results.total > 0 && (
        <p className="print-break rounded-[18px] bg-lime p-4 text-lg">
          <b>Resumen:</b> con {a.results.total.toLocaleString("es-ES")} votos, gana <b>«{top.isOther ? "Otra respuesta" : top.label}»</b> con el {top.pct}%.
        </p>
      )}

      <section className="print-break">
        <KpiTiles
          items={[
            { label: "Votos", value: formatCount(a.results.total) },
            { label: "Verificados", value: formatCount(a.results.verified), hint: "cuentas con perfil" },
            { label: "Últimos 7 días", value: formatCount(a.last7), hint: "votos nuevos" },
            { label: "Visitas", value: formatCount(a.views), hint: "a la página" },
          ]}
        />
      </section>

      <section className="print-break space-y-3">
        <h2 className="text-2xl font-black tracking-[-0.04em]">Resultados</h2>
        {a.results.total ? <ResultBars results={a.results} /> : <p className="text-sm text-muted">Todavía no hay votos.</p>}
        {a.results.writeIns.length > 0 && (
          <p className="text-sm">
            <b>Respuestas escritas más repetidas:</b> {a.results.writeIns.slice(0, 10).map((w) => `${w.label} (${w.count})`).join(", ")}.
          </p>
        )}
      </section>

      <section className="print-break space-y-3">
        <h2 className="text-2xl font-black tracking-[-0.04em]">Votos por día (últimos 30 días)</h2>
        <DailyBars series={a.series} />
      </section>

      <section className="space-y-5">
        <div className="print-break space-y-5">
          <h2 className="text-2xl font-black tracking-[-0.04em]">¿Qué opina cada grupo?</h2>
          <SegmentTable dim="country" data={a.segments.country} optionLabel={optionLabel} minVotes={MIN_SEGMENT} />
        </div>
        <div className="print-break">
          <SegmentTable dim="ageRange" data={a.segments.ageRange} optionLabel={optionLabel} minVotes={MIN_SEGMENT} />
        </div>
        <div className="print-break">
          <SegmentTable dim="gender" data={a.segments.gender} optionLabel={optionLabel} minVotes={MIN_SEGMENT} />
        </div>
      </section>

      <section className="print-break space-y-3">
        <h2 className="text-2xl font-black tracking-[-0.04em]">Origen de las visitas</h2>
        <BarList items={a.sources.map((s) => ({ label: s.label, n: s.n }))} empty="Aún no hay visitas registradas." />
      </section>

      <footer className="border-t border-line pt-4 text-xs text-muted">
        Metodología: votación abierta en voppi!, un voto por persona y dispositivo, con controles antifraude. Los desgloses solo incluyen cuentas
        verificadas y grupos con al menos {MIN_SEGMENT} votos. No es un estudio representativo de la población. Datos agregados y anónimos.
      </footer>
    </article>
  );
}
