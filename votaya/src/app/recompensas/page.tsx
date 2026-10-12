import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { getCurrentUser } from "@/lib/auth";
import { DAILY_VOTE_CAP, getUserRedemptions, getUserStats, listRewards, POINTS, rewardsMode } from "@/lib/points";
import { RedeemButton } from "./RedeemButton";

export const metadata: Metadata = { title: "Premios y puntos", description: "Gana puntos votando y canjéalos por premios de las marcas que patrocinan encuestas." };

export default async function RewardsPage() {
  const user = await getCurrentUser();
  const verified = Boolean(user?.profileCompleted);
  const [rewards, stats, mine] = await Promise.all([
    listRewards(),
    verified ? getUserStats(user!.id) : null,
    verified ? getUserRedemptions(user!.id) : [],
  ]);
  const balance = stats?.balance ?? 0;

  return (
    <div className="space-y-6">
      <section className="bg-hero overflow-hidden rounded-3xl p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-lg space-y-2">
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Vota, suma puntos y gana premios 🎁</h1>
            <p className="text-white/85">Las marcas patrocinan encuestas y regalan premios a la comunidad. Tú solo tienes que opinar.</p>
          </div>
          {stats ? (
            <div className="rounded-2xl bg-white/15 px-6 py-4 text-center backdrop-blur">
              <p className="text-sm text-white/80">Tus puntos</p>
              <p className="font-display text-4xl font-extrabold">⭐ {balance.toLocaleString("es-ES")}</p>
              <p className="text-sm text-white/80">
                {stats.level.emoji} {stats.level.name} · {stats.voteCount} encuestas votadas
              </p>
            </div>
          ) : (
            <Link href="/entrar?next=/recompensas" className="rounded-full bg-white px-6 py-3 font-bold text-brand">
              Regístrate y llévate {POINTS.welcome} puntos
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4" aria-label="Cómo ganar puntos">
        {[
          ["🗳️", `+${POINTS.vote}`, "por cada encuesta que votas"],
          ["👋", `+${POINTS.welcome}`, "al registrarte y completar tu perfil"],
          ["✍️", `+${POINTS.pollApproved}`, "si publicamos una pregunta tuya"],
          ["⏱️", `${DAILY_VOTE_CAP}`, "puntos máximos por votar al día"],
        ].map(([icon, n, text]) => (
          <div key={text} className="card flex items-center gap-3 p-4">
            <span className="text-3xl" aria-hidden>
              {icon}
            </span>
            <span>
              <span className="block font-display text-xl font-extrabold text-amber-700">{n}</span>
              <span className="text-sm text-muted">{text}</span>
            </span>
          </div>
        ))}
      </section>

      {rewardsMode() === "demo" && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Modo demostración:</strong> los premios y marcas de esta página son ficticios y los cupones no tienen valor. Los premios
          reales se activarán cuando haya marcas patrocinadoras y las bases legales de la promoción estén aprobadas.
        </p>
      )}

      <section aria-labelledby="catalog" className="space-y-4">
        <h2 id="catalog" className="font-display text-2xl font-extrabold">
          Premios disponibles
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rewards.map((r) => {
            const missing = Math.max(0, r.costPoints - balance);
            const pct = Math.min(100, Math.round((balance / r.costPoints) * 100));
            return (
              <article key={r.id} className="card flex flex-col overflow-hidden">
                <div className="relative">
                  <Photo src={r.imageUrl} alt={r.title} emoji="🎁" gradient="from-amber-300 to-rose-400" className="aspect-[16/9] w-full" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink">{r.sponsor ?? "VotaYa"}</span>
                  {r.isDemo && <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-ink">DEMO</span>}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-display text-lg font-bold">{r.title}</h3>
                  {r.description && <p className="text-sm text-muted">{r.description}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-display text-xl font-extrabold text-amber-700">⭐ {r.costPoints}</span>
                    <span className="text-muted">{r.stock > 0 ? `${r.stock} disponibles` : "Agotado"}</span>
                  </div>
                  {r.pollSlug && (
                    <Link href={`/p/${r.pollSlug}`} className="text-sm font-semibold text-brand hover:underline">
                      Ver la encuesta patrocinada →
                    </Link>
                  )}
                  <div className="mt-auto space-y-2 pt-2">
                    {verified ? (
                      <>
                        {missing > 0 && (
                          <div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              Te faltan {missing} puntos (≈ {Math.ceil(missing / POINTS.vote)} votos)
                            </p>
                          </div>
                        )}
                        <RedeemButton rewardId={r.id} canAfford={missing === 0 && r.stock > 0} label={r.stock > 0 ? "Canjear" : "Agotado"} />
                      </>
                    ) : (
                      <Link href="/entrar?next=/recompensas" className="block rounded-xl bg-ink py-2.5 text-center text-sm font-bold text-white">
                        Entra para canjear
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!rewards.length && <p className="card p-6 text-center text-muted">Pronto habrá premios de marcas patrocinadoras.</p>}
      </section>

      {mine.length > 0 && (
        <section className="card p-5" aria-labelledby="mine">
          <h2 id="mine" className="mb-3 font-display text-xl font-extrabold">
            Mis canjes
          </h2>
          <ul className="divide-y divide-line">
            {mine.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="flex-1 font-semibold">{m.title}</span>
                <code className="select-all rounded bg-slate-100 px-2 py-1 font-mono">{m.code}</code>
                <span className="text-muted">{{ pending: "Pendiente de entrega", delivered: "Entregado", cancelled: "Cancelado" }[m.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 text-sm text-muted" aria-labelledby="rules">
        <h2 id="rules" className="mb-2 font-display text-lg font-bold text-ink">
          Reglas del programa
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Solo las cuentas verificadas por email suman puntos. Una cuenta por persona.</li>
          <li>Cada encuesta da puntos una sola vez y hay un máximo diario para evitar abusos.</li>
          <li>Los puntos no son dinero, no se pueden vender ni transferir y no tienen valor fuera de VotaYa.</li>
          <li>Podemos anular puntos o canjes obtenidos con votos automatizados o cuentas duplicadas.</li>
          <li>Cada premio tiene sus propias condiciones, fijadas por la marca que lo patrocina.</li>
        </ul>
      </section>
    </div>
  );
}
