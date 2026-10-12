"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { voteAction, type Progress } from "@/app/actions/vote";
import type { OptionView, Results } from "@/lib/polls";
import { Photo } from "./Photo";
import { ShareBar } from "./ShareBar";

type PollProps = { id: string; slug: string; title: string; allowOther: boolean; imageUrl?: string | null; options: OptionView[] };
type State = { results: Results; myOptionId: string | null; myWriteInId: string | null };

export function PollVoter({
  poll,
  initial,
  verified,
  shareUrl,
  nextHref,
  compact = false,
  tone,
}: {
  poll: PollProps;
  initial: State | null;
  verified: boolean;
  shareUrl: string;
  nextHref?: string;
  compact?: boolean;
  tone?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State | null>(initial);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [earned, setEarned] = useState(0);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [pending, startTransition] = useTransition();
  const [animate, setAnimate] = useState(Boolean(initial));
  const duel = poll.options.length === 2 && !poll.allowOther;

  useEffect(() => {
    if (!state) return;
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, [state]);

  function vote(choice: { optionId?: string; otherText?: string }) {
    setError(null);
    startTransition(async () => {
      const res = await voteAction(poll.id, choice);
      if (res.ok) {
        setAnimate(false);
        setState({ results: res.results, myOptionId: res.myOptionId, myWriteInId: res.myWriteInId });
        setEarned(res.points);
        setProgress(res.progress);
        try {
          navigator.vibrate?.(20);
        } catch {}
        if (!compact) router.refresh();
      } else {
        if (res.error === "already_voted" && res.results) setState({ results: res.results, myOptionId: null, myWriteInId: null });
        setError({ code: res.error, message: res.message });
      }
    });
  }

  const results = state?.results;
  const pctOf = (id: string) => results?.rows.find((r) => r.id === id)?.pct ?? 0;
  const myWriteIn = results?.writeIns.find((w) => w.id === state?.myWriteInId);
  const myLabel = state ? (myWriteIn?.label ?? poll.options.find((o) => o.id === state.myOptionId)?.label ?? null) : null;

  return (
    <div className="grid gap-4">
      {earned > 0 && (
        <p role="status" className="animate-pop rounded-full bg-lime px-4 py-2.5 text-center text-sm font-extrabold">
          +{earned} puntos
          {progress && progress.streak > 1 ? ` · racha de ${progress.streak} días` : ""}
          {progress?.next ? ` · ${progress.remaining} votos para ser ${progress.next}` : ""}
        </p>
      )}

      {duel ? (
        <div>
          <div className="relative grid grid-cols-2 gap-2">
            {poll.options.map((o, i) => {
              const mine = state?.myOptionId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => !state && vote({ optionId: o.id })}
                  disabled={pending || Boolean(state)}
                  aria-label={state ? `${o.label} ${pctOf(o.id)}%` : `Votar ${o.label}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-[24px] text-left text-white disabled:cursor-default sm:aspect-[4/3]"
                >
                  <Photo src={o.imageUrl ?? poll.imageUrl} alt="" label={o.label} tone={tone} className="absolute inset-0 h-full w-full transition group-hover:scale-[1.02]" initialsClass="text-7xl sm:text-8xl" />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
                  <span className="absolute inset-x-3 bottom-3 flex flex-col items-start gap-2 sm:inset-x-5 sm:bottom-4 sm:flex-row sm:items-end sm:justify-between">
                    <b className="text-2xl font-black leading-none tracking-[-0.04em] sm:text-4xl">
                      {o.label}
                      {mine ? " ✓" : ""}
                    </b>
                    <span className={`rounded-full px-3.5 py-2 text-sm font-extrabold ${i ? "bg-lime text-ink" : "bg-pink text-white"}`}>
                      {state ? `${pctOf(o.id)}%` : "Votar"}
                    </span>
                  </span>
                </button>
              );
            })}
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-ink px-3 py-2.5 text-sm font-black text-lime">
              VS
            </span>
          </div>
          {results && (
            <div className="mt-3">
              <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={`${poll.options[0].label} ${pctOf(poll.options[0].id)}%, ${poll.options[1].label} ${pctOf(poll.options[1].id)}%`}>
                <span className="bg-pink transition-[width] duration-700" style={{ width: animate ? `${pctOf(poll.options[0].id)}%` : "50%" }} />
                <span className="flex-1 bg-ink" />
              </div>
              <div className="mt-2 flex justify-between text-[15px] font-extrabold">
                <span className="text-pink">
                  {poll.options[0].label} {pctOf(poll.options[0].id)}%
                </span>
                <span>
                  {pctOf(poll.options[1].id)}% {poll.options[1].label}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {(results ? results.rows : poll.options.map((o) => ({ id: o.id, label: o.label, pct: 0, isOther: false }))).map((r) => {
            const opt = poll.options.find((o) => o.id === r.id);
            const mine = state ? (r.isOther ? Boolean(state.myWriteInId) : state.myOptionId === r.id) : false;
            return (
              <button
                key={r.id}
                onClick={() => !state && !r.isOther && vote({ optionId: r.id })}
                disabled={pending || Boolean(state)}
                className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] border-2 bg-white py-2 pl-2 pr-4 text-left text-base font-extrabold transition disabled:cursor-default ${
                  mine ? "border-ink" : "border-line hover:border-ink"
                }`}
              >
                <span
                  className={`absolute inset-y-0 left-0 transition-[width] duration-700 ${mine ? "bg-pink" : "bg-lime"}`}
                  style={{ width: results && animate ? `${r.pct}%` : 0 }}
                  aria-hidden
                />
                <Photo src={opt?.imageUrl} alt="" label={r.isOther ? "+" : r.label} tone={r.isOther ? "#b9b7ae" : tone} className="h-12 w-12 shrink-0 rounded-[15px]" initialsClass="text-lg" />
                <span className="relative flex-1">
                  {r.isOther ? "Otra respuesta" : r.label}
                  {mine ? " ✓" : ""}
                </span>
                {results && <span className="relative text-base font-black tabular-nums">{r.pct}%</span>}
              </button>
            );
          })}
          {!state && poll.allowOther && (
            otherOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (otherText.trim()) vote({ otherText: otherText.trim() });
                }}
                className="flex gap-2 rounded-full border-2 border-ink bg-white p-1.5"
              >
                <label htmlFor={`other-${poll.id}`} className="sr-only">
                  Escribe tu respuesta
                </label>
                <input
                  id={`other-${poll.id}`}
                  autoFocus
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  maxLength={60}
                  placeholder="Escribe tu respuesta…"
                  className="min-w-0 flex-1 bg-transparent px-3 text-base font-semibold outline-none"
                />
                <button type="submit" disabled={pending || !otherText.trim()} className="rounded-full bg-ink px-5 py-2.5 font-extrabold text-lime disabled:opacity-50">
                  Votar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setOtherOpen(true)}
                className="flex w-full items-center gap-3 rounded-[22px] border-2 border-dashed border-line py-2 pl-2 pr-4 text-left font-bold text-muted hover:border-ink hover:text-ink"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-wash text-2xl font-black" aria-hidden>
                  +
                </span>
                Otra respuesta… escribe la tuya
              </button>
            )
          )}
          {results && results.writeIns.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5" aria-label="Respuestas escritas por la comunidad">
              {results.writeIns.slice(0, 12).map((w) => (
                <span key={w.id} className={`rounded-full px-3 py-1 text-[13px] font-semibold ${w.id === state?.myWriteInId ? "bg-pink text-white" : "bg-wash"}`}>
                  {w.label} <span className="tabular-nums opacity-70">· {w.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {pending && <p className="text-center text-sm text-muted">Contando tu voto…</p>}
      {error && (
        <div role="alert" className="rounded-[18px] bg-pink-soft p-3.5 text-sm">
          <p>{error.message}</p>
          {error.code === "needs_signup" && (
            <Link href={`/entrar?next=/p/${poll.slug}`} className="mt-2 inline-block font-extrabold underline">
              Crear cuenta gratis
            </Link>
          )}
        </div>
      )}

      {!state && <p className="text-sm text-muted">Vota para ver los resultados. Es gratis y sin registro.</p>}

      {results && (
        <div className="animate-rise grid gap-3">
          {myLabel && (
            <p className="text-sm">
              ✓ Tu voto: <b>{myLabel}</b> · {results.total.toLocaleString("es-ES")} {results.total === 1 ? "voto" : "votos"} · votación popular, no representativa
            </p>
          )}
          {!verified && (
            <Link href={`/entrar?next=/p/${poll.slug}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-lime p-4">
              <span className="font-semibold">Guarda tu voto, suma puntos y mira qué opina tu país.</span>
              <span className="rounded-full bg-ink px-4 py-2 text-sm font-extrabold text-lime">Crear cuenta gratis</span>
            </Link>
          )}
          {compact ? (
            <Link href={`/p/${poll.slug}`} className="rounded-full bg-ink py-3 text-center font-extrabold text-lime">
              Ver resultados completos
            </Link>
          ) : (
            <>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${myLabel ? `Yo voté «${myLabel}». ` : ""}${poll.title} ¿Y tú? ${shareUrl}?src=reto`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1fae54] py-3.5 text-center text-base font-extrabold text-white"
              >
                Reta a un amigo por WhatsApp
              </a>
              <ShareBar pollId={poll.id} slug={poll.slug} url={shareUrl} text={`${myLabel ? `He votado «${myLabel}» en «${poll.title}». ` : `«${poll.title}». `}¿Y tú?`} />
              {nextHref && (
                <Link href={nextHref} className="rounded-full bg-ink py-3.5 text-center text-base font-extrabold text-lime">
                  Siguiente pregunta
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
