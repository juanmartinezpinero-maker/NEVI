import type { Metadata } from "next";
import Link from "next/link";
import { KpiTiles } from "@/components/BrandWidgets";
import { getBrandOverview, requireBrand } from "@/lib/brands";
import { formatCount } from "@/lib/text";

export const metadata: Metadata = { title: "Panel de marca", robots: { index: false } };

const STATUS: Record<string, string> = { pending: "En moderación", published: "Activa", rejected: "Rechazada", archived: "Archivada" };

export default async function BrandDashboard(props: PageProps<"/marca/[sponsorId]">) {
  const { sponsorId } = await props.params;
  const { brand } = await requireBrand(sponsorId, `/marca/${sponsorId}`);
  const { polls, totals } = await getBrandOverview(sponsorId);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Panel de marca</p>
          <h1 className="text-[40px] font-black leading-none tracking-[-0.05em] sm:text-[52px]">{brand.name}</h1>
        </div>
        <Link href={`/marca/${sponsorId}/nueva`} className="rounded-full bg-pink px-5 py-3 font-extrabold text-white">
          Nueva encuesta
        </Link>
      </header>

      <KpiTiles
        items={[
          { label: "Votos", value: formatCount(totals.votes) },
          { label: "Encuestas", value: String(polls.length) },
          { label: "Visitas", value: formatCount(totals.views), hint: "a las páginas de tus encuestas" },
          { label: "Compartidas", value: formatCount(totals.shares), hint: "veces que la gente las ha compartido" },
        ]}
      />

      <section aria-labelledby="polls-h" className="space-y-3">
        <h2 id="polls-h" className="text-[26px] font-black tracking-[-0.045em]">
          Tus encuestas
        </h2>
        {polls.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 font-semibold">Encuesta</th>
                  <th className="py-2 font-semibold">Estado</th>
                  <th className="py-2 text-right font-semibold">Votos</th>
                  <th className="py-2 text-right font-semibold">Visitas</th>
                  <th className="py-2 text-right font-semibold">Compartida</th>
                </tr>
              </thead>
              <tbody>
                {polls.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3">
                      <Link href={`/marca/${sponsorId}/encuestas/${p.id}`} className="font-bold hover:underline">
                        {p.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-muted">{p.visibility === "private" ? "Privada · solo con enlace" : "Pública · patrocinada"}</span>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.status === "published" ? "bg-lime" : p.status === "rejected" ? "bg-pink-soft" : "bg-wash"}`}>
                        {STATUS[p.status]}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{p.voteCount.toLocaleString("es-ES")}</td>
                    <td className="py-3 text-right tabular-nums">{p.views.toLocaleString("es-ES")}</td>
                    <td className="py-3 text-right tabular-nums">{p.shares.toLocaleString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-[22px] bg-wash p-6">
            <p className="font-bold">Aún no tienes encuestas.</p>
            <p className="mt-1 text-sm text-ink-2">
              Empieza con una privada: compártela con tu equipo o tus clientes y verás los resultados aquí en directo.
            </p>
          </div>
        )}
      </section>

      <p className="text-xs text-muted">
        Todos los datos son agregados: nunca mostramos votos ni perfiles individuales. Los desgloses solo usan cuentas verificadas y grupos con un
        mínimo de votos. Las votaciones abiertas no son estudios representativos.
      </p>
    </div>
  );
}
