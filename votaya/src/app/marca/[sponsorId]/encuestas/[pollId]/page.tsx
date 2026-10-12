import type { Metadata } from "next";
import Link from "next/link";
import { BarList, DailyBars, KpiTiles, ResultBars, SegmentTable } from "@/components/BrandWidgets";
import { CopyLink } from "@/components/CopyLink";
import { ShareButton } from "@/components/ShareSheet";
import { getBrandPoll, getPollAnalytics, requireBrand } from "@/lib/brands";
import { MIN_SEGMENT } from "@/lib/polls";
import { getBaseUrl } from "@/lib/request";
import { formatCount } from "@/lib/text";

export const metadata: Metadata = { title: "Resultados de la encuesta", robots: { index: false } };

export default async function BrandPollPage(props: PageProps<"/marca/[sponsorId]/encuestas/[pollId]">) {
  const { sponsorId, pollId } = await props.params;
  const sp = await props.searchParams;
  const { brand } = await requireBrand(sponsorId, `/marca/${sponsorId}/encuestas/${pollId}`);
  const poll = await getBrandPoll(sponsorId, pollId);
  const a = await getPollAnalytics(poll.id);
  const base = await getBaseUrl();
  const link = `${base}/p/${poll.slug}`;
  const optionLabel = (id: string) => a.results.rows.find((r) => r.id === id)?.label ?? "Otra respuesta";
  const verifiedPct = a.results.total ? Math.round((a.results.verified / a.results.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {sp.creada === "1" && (
        <p role="status" className="rounded-[18px] bg-lime p-4 font-semibold">
          {poll.status === "published"
            ? "Encuesta creada. Copia el enlace y compártelo: los resultados aparecerán aquí en directo."
            : "Encuesta enviada a moderación. Te avisaremos al publicarla; mientras, puedes ver aquí su estado."}
        </p>
      )}
      <header className="space-y-3">
        <Link href={`/marca/${sponsorId}`} className="kicker hover:text-ink">
          ← {brand.name}
        </Link>
        <h1 className="text-[34px] font-black leading-[1.02] tracking-[-0.05em] sm:text-[46px]">{poll.title}</h1>
        <p className="text-sm text-muted">
          {poll.visibility === "private" ? "Privada · solo con enlace" : "Pública · patrocinada"} ·{" "}
          {poll.status === "published" ? "Activa" : poll.status === "pending" ? "En moderación" : poll.status === "rejected" ? "Rechazada" : "Archivada"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CopyLink url={`${link}?src=link`} />
          <ShareButton target={{ pollId: poll.id, slug: poll.slug, title: poll.title }} className="rounded-full bg-pink px-4 py-2.5 text-sm font-extrabold text-white">
            Compartir
          </ShareButton>
          <Link href={`/marca/${sponsorId}/encuestas/${poll.id}/informe`} className="rounded-full bg-ink px-4 py-2.5 text-sm font-extrabold text-lime">
            Informe PDF
          </Link>
          <a href={`/api/marca/${sponsorId}/${poll.id}/csv`} className="rounded-full border-2 border-ink px-4 py-2 text-sm font-extrabold">
            Descargar CSV
          </a>
          <Link href={`/p/${poll.slug}`} className="px-2 text-sm font-bold underline">
            Ver encuesta
          </Link>
        </div>
      </header>

      <KpiTiles
        items={[
          { label: "Votos", value: formatCount(a.results.total), hint: `${verifiedPct}% de cuentas verificadas` },
          { label: "Últimos 7 días", value: formatCount(a.last7), hint: "votos nuevos" },
          { label: "Visitas", value: formatCount(a.views), hint: "a la página de la encuesta" },
          { label: "Compartida", value: formatCount(a.shares), hint: "veces" },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="res-h" className="space-y-3">
          <h2 id="res-h" className="text-[24px] font-black tracking-[-0.045em]">
            Resultados
          </h2>
          {a.results.total ? <ResultBars results={a.results} /> : <p className="text-sm text-muted">Todavía no hay votos.</p>}
          {a.results.writeIns.length > 0 && (
            <div>
              <h3 className="mb-1.5 mt-4 font-extrabold">Respuestas escritas más repetidas</h3>
              <ul className="flex flex-wrap gap-1.5">
                {a.results.writeIns.slice(0, 15).map((w) => (
                  <li key={w.id} className="rounded-full bg-wash px-3 py-1 text-[13px] font-semibold">
                    {w.label} <span className="tabular-nums text-muted">· {w.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section aria-labelledby="day-h" className="space-y-3">
          <h2 id="day-h" className="text-[24px] font-black tracking-[-0.045em]">
            Votos por día
          </h2>
          <p className="text-sm text-muted">Últimos 30 días.</p>
          <DailyBars series={a.series} />
        </section>
      </div>

      <section aria-labelledby="seg-h" className="space-y-4">
        <h2 id="seg-h" className="text-[24px] font-black tracking-[-0.045em]">
          ¿Qué opina cada grupo?
        </h2>
        <div className="grid gap-8 lg:grid-cols-3">
          <SegmentTable dim="country" data={a.segments.country} optionLabel={optionLabel} minVotes={MIN_SEGMENT} />
          <SegmentTable dim="ageRange" data={a.segments.ageRange} optionLabel={optionLabel} minVotes={MIN_SEGMENT} />
          <SegmentTable dim="gender" data={a.segments.gender} optionLabel={optionLabel} minVotes={MIN_SEGMENT} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="src-h" className="space-y-3">
          <h2 id="src-h" className="text-[24px] font-black tracking-[-0.045em]">
            De dónde llegan las visitas
          </h2>
          <BarList items={a.sources.map((s) => ({ label: s.label, n: s.n }))} empty="Aún no hay visitas registradas." />
        </section>
        <section aria-labelledby="ch-h" className="space-y-3">
          <h2 id="ch-h" className="text-[24px] font-black tracking-[-0.045em]">
            Dónde la comparte la gente
          </h2>
          <BarList items={a.channels.map((c) => ({ label: c.label, n: c.n }))} empty="Todavía nadie la ha compartido." />
        </section>
      </div>

      <p className="text-xs text-muted">
        Datos agregados. Desgloses con cuentas verificadas y grupos de al menos {MIN_SEGMENT} votos. Votación abierta: no es un estudio representativo
        de la población.
      </p>
    </div>
  );
}
