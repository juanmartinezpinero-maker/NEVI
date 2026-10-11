"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { voteAction } from "@/app/actions/vote";
import type { OptionView, Results } from "@/lib/polls";
import { ShareBar } from "./ShareBar";

type PollProps = {
  id: string;
  slug: string;
  title: string;
  allowOther: boolean;
  options: OptionView[];
};

const BAR_COLORS = ["bg-violet-500", "bg-pink-500", "bg-amber-400", "bg-cyan-400", "bg-lime-400", "bg-rose-400", "bg-sky-400", "bg-emerald-400", "bg-orange-400", "bg-fuchsia-400", "bg-slate-300"];

export function PollVoter({
  poll,
  initial,
  verified,
  shareUrl,
  nextHref,
  compact = false,
}: {
  poll: PollProps;
  initial: { results: Results; myOptionId: string | null; myWriteInId: string | null } | null;
  verified: boolean;
  shareUrl: string;
  nextHref?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [pending, startTransition] = useTransition();
  const otherRef = useRef<HTMLInputElement>(null);
  const duel = poll.options.length === 2 && !poll.allowOther;

  useEffect(() => {
    if (otherOpen) otherRef.current?.focus();
  }, [otherOpen]);

  function vote(choice: { optionId?: string; otherText?: string }) {
    setError(null);
    setSelected(choice.optionId ?? "other");
    startTransition(async () => {
      const res = await voteAction(poll.id, choice);
      if (res.ok) {
        setState({ results: res.results, myOptionId: res.myOptionId, myWriteInId: res.myWriteInId });
        if (navigator.vibrate) navigator.vibrate(30);
        if (!compact) router.refresh();
      } else {
        setSelected(null);
        if (res.error === "already_voted" && res.results) {
          setState({ results: res.results, myOptionId: null, myWriteInId: null });
        }
        setError({ code: res.error, message: res.message });
      }
    });
  }

  if (state) {
    return <ResultsView poll={poll} state={state} verified={verified} shareUrl={shareUrl} nextHref={nextHref} compact={compact} />;
  }

  return (
    <div className="space-y-3">
      {duel ? (
        <div className="relative grid grid-cols-2 gap-3">
          {poll.options.map((o, i) => (
            <button
              key={o.id}
              onClick={() => vote({ optionId: o.id })}
              disabled={pending}
              aria-label={`Votar ${o.label}`}
              className={`relative flex aspect-[4/5] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl p-4 text-center font-display text-xl font-extrabold shadow-xl transition active:scale-95 disabled:opacity-80 sm:aspect-square sm:text-2xl ${
                i === 0 ? "bg-gradient-to-br from-violet-600 to-indigo-700" : "bg-gradient-to-br from-pink-500 to-orange-500"
              } ${selected === o.id ? "animate-pop ring-4 ring-white" : ""}`}
            >
              {o.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              ) : null}
              <span className="relative text-6xl sm:text-7xl" aria-hidden>
                {o.emoji ?? (i === 0 ? "🅰️" : "🅱️")}
              </span>
              <span className="relative leading-tight drop-shadow">{o.label}</span>
            </button>
          ))}
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-ink bg-white font-display text-lg font-black text-ink shadow-2xl">
            VS
          </span>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {poll.options.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => vote({ optionId: o.id })}
                disabled={pending}
                className={`flex w-full items-center gap-3 rounded-2xl border border-line bg-ink-3 px-4 py-3.5 text-left text-base font-bold transition hover:border-fuchsia-400 hover:bg-line active:scale-[0.98] disabled:opacity-70 ${
                  selected === o.id ? "animate-pop border-fuchsia-400 bg-line" : ""
                }`}
              >
                {o.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <span className="text-2xl" aria-hidden>
                    {o.emoji ?? "•"}
                  </span>
                )}
                <span className="flex-1">{o.label}</span>
                <span className="text-muted" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          ))}
          {poll.allowOther && (
            <li>
              {otherOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otherText.trim()) vote({ otherText: otherText.trim() });
                  }}
                  className="flex items-center gap-2 rounded-2xl border-2 border-fuchsia-400 bg-ink-3 p-2 pl-4"
                >
                  <span className="text-2xl" aria-hidden>
                    ✍️
                  </span>
                  <label htmlFor={`other-${poll.id}`} className="sr-only">
                    Escribe tu respuesta
                  </label>
                  <input
                    id={`other-${poll.id}`}
                    ref={otherRef}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    maxLength={60}
                    placeholder="Escribe tu respuesta…"
                    className="min-w-0 flex-1 bg-transparent py-2 text-base font-bold outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={pending || !otherText.trim()}
                    className="bg-brand-gradient rounded-xl px-4 py-2 font-extrabold text-white disabled:opacity-50"
                  >
                    Votar
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setOtherOpen(true)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3.5 text-left text-base font-bold text-muted hover:border-fuchsia-400 hover:text-white"
                >
                  <span className="text-2xl" aria-hidden>
                    ✍️
                  </span>
                  Otra… escribe la tuya
                </button>
              )}
            </li>
          )}
        </ul>
      )}
      {pending && <p className="text-center text-sm text-muted">Contando tu voto…</p>}
      {error && (
        <div role="alert" className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm">
          <p>{error.message}</p>
          {error.code === "needs_signup" && (
            <Link href={`/entrar?next=/p/${poll.slug}`} className="mt-2 inline-block font-bold text-amber-300 underline">
              Registrarme gratis →
            </Link>
          )}
        </div>
      )}
      <p className="text-center text-xs text-muted">Vota para ver qué opina el mundo · Gratis y sin registro</p>
    </div>
  );
}

function ResultsView({
  poll,
  state,
  verified,
  shareUrl,
  nextHref,
  compact,
}: {
  poll: PollProps;
  state: { results: Results; myOptionId: string | null; myWriteInId: string | null };
  verified: boolean;
  shareUrl: string;
  nextHref?: string;
  compact: boolean;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const { results, myOptionId, myWriteInId } = state;
  const max = Math.max(...results.rows.map((r) => r.count));
  const myRow = results.rows.find((r) => (myWriteInId ? r.isOther : r.id === myOptionId));
  const myWriteIn = results.writeIns.find((w) => w.id === myWriteInId);
  const leader = results.rows.find((r) => r.count === max && max > 0);
  const duel = results.rows.length === 2 && !results.rows.some((r) => r.isOther);
  const verifiedPct = results.total ? Math.round((results.verified / results.total) * 100) : 0;
  const shareText = myRow
    ? `He votado «${myWriteIn?.label ?? myRow.label}» en «${poll.title}». ¿Y tú? 🗳️`
    : `«${poll.title}» — mira qué opina el mundo 🗳️`;

  return (
    <div className="animate-rise space-y-4" aria-live="polite">
      {myRow && (
        <p className="text-center text-sm font-semibold text-fuchsia-200">
          ✓ Tu voto: <strong>{myWriteIn?.label ?? myRow.label}</strong>
          {myRow.pct ? ` · coincides con el ${myWriteIn ? Math.round((myWriteIn.count / results.total) * 100) : myRow.pct}%` : ""}
        </p>
      )}

      {duel ? (
        <div>
          <div className="flex justify-between font-display text-3xl font-black sm:text-4xl">
            <span className="text-violet-300">{results.rows[0].pct}%</span>
            <span className="text-pink-300">{results.rows[1].pct}%</span>
          </div>
          <div className="mt-2 flex h-6 overflow-hidden rounded-full bg-ink-3" role="img" aria-label={`${results.rows[0].label} ${results.rows[0].pct}%, ${results.rows[1].label} ${results.rows[1].pct}%`}>
            <div className="bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-1000" style={{ width: animate ? `${results.rows[0].pct}%` : "50%" }} />
            <div className="flex-1 bg-gradient-to-r from-pink-400 to-orange-400" />
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold">
            <span>
              {results.rows[0].emoji} {results.rows[0].label} {myOptionId === results.rows[0].id && "· tu voto"}
            </span>
            <span className="text-right">
              {myOptionId === results.rows[1].id && "tu voto · "}
              {results.rows[1].label} {results.rows[1].emoji}
            </span>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {results.rows.map((r, i) => {
            const mine = myWriteInId ? r.isOther : r.id === myOptionId;
            return (
              <li key={r.id} className={`relative overflow-hidden rounded-2xl border bg-ink-3 ${mine ? "border-fuchsia-400" : "border-line"}`}>
                <div
                  className={`absolute inset-y-0 left-0 ${BAR_COLORS[i % BAR_COLORS.length]} opacity-30 transition-all duration-1000 ease-out`}
                  style={{ width: animate ? `${r.pct}%` : "0%" }}
                  aria-hidden
                />
                <div className="relative flex items-center gap-3 px-4 py-3">
                  <span className="text-xl" aria-hidden>
                    {r.emoji ?? "•"}
                  </span>
                  <span className="flex-1 font-bold">
                    {r.label}
                    {r === leader && <span className="ml-1" aria-label="ganando">👑</span>}
                    {mine && <span className="ml-2 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[11px] font-black uppercase">Tu voto</span>}
                  </span>
                  <span className="font-display text-lg font-black tabular-nums">{r.pct}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {results.writeIns.length > 0 && (
        <details className="rounded-2xl border border-line bg-ink-2 p-3 text-sm" open={!compact && Boolean(myWriteInId)}>
          <summary className="cursor-pointer font-bold">✍️ Respuestas escritas por la comunidad ({results.writeIns.length})</summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {results.writeIns.slice(0, 12).map((w) => (
              <li key={w.id} className={`rounded-full px-3 py-1 ${w.id === myWriteInId ? "bg-fuchsia-500" : "bg-ink-3"}`}>
                {w.label} <span className="text-muted">· {w.count}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-center text-xs text-muted">
        {results.total.toLocaleString("es-ES")} {results.total === 1 ? "voto" : "votos"} · {verifiedPct}% de cuentas verificadas · Votación popular, no representativa
      </p>

      {!verified && (
        <Link
          href={`/entrar?next=/p/${poll.slug}`}
          className="block rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/10 p-4 text-center"
        >
          <span className="block font-display text-lg font-extrabold">🔒 Guarda tu voto</span>
          <span className="text-sm text-muted">Regístrate en 30 segundos y descubre qué opina tu país, tu edad y tu género.</span>
        </Link>
      )}

      {compact ? (
        <Link href={`/p/${poll.slug}`} className="block rounded-2xl bg-white py-3 text-center font-extrabold text-ink">
          Ver resultados completos y compartir →
        </Link>
      ) : (
        <>
          <ShareBar pollId={poll.id} slug={poll.slug} url={shareUrl} text={shareText} />
          {nextHref && (
            <Link href={nextHref} className="block rounded-2xl bg-white py-3.5 text-center text-base font-extrabold text-ink">
              Siguiente pregunta →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
