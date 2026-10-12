"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { voteAction, type Progress } from "@/app/actions/vote";
import type { PollCard, Results } from "@/lib/polls";
import { Photo } from "./Photo";

const AUTO_MS = 2600;

type Done = { results: Results; myOptionId: string | null; label: string; points: number; progress: Progress | null };

/**
 * Feed a pantalla completa tipo historias: pregunta y opciones ocupan la pantalla,
 * al votar se muestran los porcentajes y pasa sola a la siguiente.
 */
export function StoryFeed({
  polls,
  tones,
  categoryNames,
  loggedIn,
  className = "",
}: {
  polls: PollCard[];
  tones: Record<string, string>;
  categoryNames: Record<string, string>;
  loggedIn: boolean;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [paused, setPaused] = useState(false);
  const [pending, start] = useTransition();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const poll = polls[index];

  const next = useCallback(() => {
    setDone(null);
    setError(null);
    setOtherOpen(false);
    setOtherText("");
    setPaused(false);
    setIndex((i) => i + 1);
  }, []);

  // Paso automático a la siguiente historia tras votar.
  useEffect(() => {
    if (!done || paused) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [done, paused, next]);

  function vote(choice: { optionId?: string; otherText?: string }, label: string) {
    setError(null);
    start(async () => {
      const res = await voteAction(poll.id, choice);
      if (res.ok) {
        const matched = res.myOptionId ? poll.options.find((o) => o.id === res.myOptionId)?.label : null;
        setDone({ results: res.results, myOptionId: res.myOptionId, label: matched ?? label, points: res.points, progress: res.progress });
        try {
          navigator.vibrate?.(20);
        } catch {}
      } else if (res.error === "already_voted" && res.results) {
        setDone({ results: res.results, myOptionId: null, label: "ya votaste", points: 0, progress: null });
      } else {
        setError(res.message);
      }
    });
  }

  const shell = `fixed inset-x-0 top-0 bottom-14 z-[35] flex flex-col bg-ink text-white lg:static lg:mx-auto lg:h-[min(820px,calc(100dvh-9rem))] lg:max-w-[420px] lg:overflow-hidden lg:rounded-[28px] ${className}`;

  const topBar = (
    <div className="flex items-center justify-between px-4 pt-3">
      <div className="flex gap-4 text-[15px] font-bold">
        <span className="text-lime">Para ti</span>
        <Link href="/encuestas" className="text-white/55">
          Explorar
        </Link>
      </div>
      {loggedIn ? (
        <span className="text-xs font-bold tabular-nums text-white/80">{done?.progress ? `${done.progress.streak}d · ${done.progress.votes} votos` : ""}</span>
      ) : (
        <Link href="/entrar" className="text-xs font-bold underline">
          Entrar
        </Link>
      )}
    </div>
  );

  if (!poll) {
    return (
      <section className={shell} aria-label="Historias">
        {topBar}
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.05em]">Has votado todo</h1>
            <p className="mb-5 mt-2 text-white/70">Vuelve mañana para mantener tu racha o crea tu propia pregunta.</p>
            <Link href="/crear" className="rounded-full bg-lime px-5 py-3 font-extrabold text-ink">
              Crear una pregunta
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const tone = tones[poll.category];
  const duel = poll.options.length === 2 && !poll.allowOther;
  const rows = done?.results.rows ?? [];
  const pctOf = (id: string) => rows.find((r) => r.id === id)?.pct ?? 0;
  const from = Math.max(0, Math.min(index - 4, polls.length - 10));
  const segs = polls.slice(from, from + 10);
  const total = done?.results.total ?? poll.voteCount;

  return (
    <section
      className={shell}
      aria-label="Historias"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current || !done) return;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        if (dy < -70 || dx < -70) next();
        touch.current = null;
      }}
    >
      <div className="flex gap-[3px] px-2.5 pt-2.5" aria-hidden>
        {segs.map((p, k) => {
          const j = from + k;
          return (
            <span key={p.id} className={`h-[3px] flex-1 overflow-hidden rounded-full ${j < index ? "bg-lime" : "bg-white/25"}`}>
              {j === index && done && !paused && <span className="block h-full animate-grow bg-lime" style={{ ["--auto-ms" as string]: `${AUTO_MS}ms` }} />}
              {j === index && done && paused && <span className="block h-full w-full bg-lime" />}
            </span>
          );
        })}
      </div>
      {topBar}
      <div className="flex items-baseline justify-between px-4 pt-3">
        <span className="kicker !text-white/70">{categoryNames[poll.category]}</span>
        <span className="kicker !text-white/70 tabular-nums">{total.toLocaleString("es-ES")} votos</span>
      </div>
      <h1 key={poll.id} className="animate-rise px-4 pb-3 pt-1.5 text-[30px] font-extrabold leading-[1.05] tracking-[-0.045em]">
        {poll.title}
      </h1>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {duel ? (
          <div className="relative grid min-h-0 flex-1 grid-rows-2 gap-1.5 px-2 pb-2">
            {poll.options.map((o, i) => {
              const mine = done?.myOptionId === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => !done && vote({ optionId: o.id }, o.label)}
                  disabled={pending || Boolean(done)}
                  aria-label={done ? `${o.label} ${pctOf(o.id)}%` : `Votar ${o.label}`}
                  className="relative min-h-0 overflow-hidden rounded-[20px] text-left disabled:cursor-default"
                >
                  <Photo src={o.imageUrl ?? poll.imageUrl} alt="" label={o.label} tone={tone} className="absolute inset-0 h-full w-full" initialsClass="text-8xl" />
                  <span className={`absolute inset-0 transition-opacity duration-300 ${done ? "opacity-45" : "opacity-0"} ${i ? "bg-lime" : "bg-pink"}`} aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
                  {done && <span className="absolute right-4 top-3 text-5xl font-black tabular-nums tracking-[-0.04em]">{pctOf(o.id)}%</span>}
                  <span className="absolute inset-x-4 bottom-3.5 flex items-end justify-between gap-2">
                    <b className="text-[32px] font-black leading-none tracking-[-0.04em]">
                      {o.label}
                      {mine ? " ✓" : ""}
                    </b>
                    {!done && <span className={`rounded-full px-3.5 py-2 text-[13px] font-extrabold ${i ? "bg-lime text-ink" : "bg-pink text-white"}`}>Votar</span>}
                  </span>
                </button>
              );
            })}
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-lime px-3 py-2 text-sm font-black text-ink">
              VS
            </span>
          </div>
        ) : (
          <div className={`relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 ${done ? "pb-44" : "pb-3.5"} justify-end`}>
            <Photo src={poll.imageUrl} alt="" label={poll.title} tone={tone} className="absolute inset-0 h-full w-full opacity-90" initialsClass="text-[140px] opacity-30" />
            <span className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/80" aria-hidden />
            {(done ? rows : poll.options.map((o) => ({ id: o.id, label: o.label, pct: 0, isOther: false }))).map((r) => {
              const mine = done ? (r.isOther ? !done.myOptionId : done.myOptionId === r.id) : false;
              return (
                <button
                  key={r.id}
                  onClick={() => !done && vote({ optionId: r.id }, r.label)}
                  disabled={pending || Boolean(done)}
                  className="relative z-[1] flex w-full shrink-0 items-center justify-between gap-3 overflow-hidden rounded-full bg-white px-[18px] py-3.5 text-left text-base font-extrabold text-ink disabled:cursor-default"
                >
                  <span className={`absolute inset-y-0 left-0 transition-[width] duration-700 ${mine ? "bg-pink" : "bg-lime"}`} style={{ width: done ? `${r.pct}%` : 0 }} aria-hidden />
                  <span className="relative">
                    {r.isOther ? "Otra respuesta" : r.label}
                    {mine ? " ✓" : ""}
                  </span>
                  {done && <span className="relative tabular-nums">{r.pct}%</span>}
                </button>
              );
            })}
            {!done && poll.allowOther && (
              otherOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otherText.trim()) vote({ otherText: otherText.trim() }, otherText.trim());
                  }}
                  className="relative z-[1] flex shrink-0 gap-1.5 rounded-full bg-white p-1.5"
                >
                  <label htmlFor="story-other" className="sr-only">
                    Escribe tu respuesta
                  </label>
                  <input
                    id="story-other"
                    autoFocus
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    maxLength={60}
                    placeholder="Tu serie, película, lo que sea…"
                    className="min-w-0 flex-1 bg-transparent px-3 text-base font-semibold text-ink outline-none"
                  />
                  <button disabled={pending || !otherText.trim()} className="rounded-full bg-pink px-4 py-2.5 font-extrabold text-white disabled:opacity-50">
                    Votar
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setOtherOpen(true)}
                  className="relative z-[1] flex shrink-0 items-center justify-between rounded-full border border-dashed border-white/70 bg-white/15 px-[18px] py-3.5 text-left font-bold"
                >
                  Otra respuesta… escribe la tuya <span aria-hidden>+</span>
                </button>
              )
            )}
            {done && !done.myOptionId && (
              <p className="relative z-[1] text-xs font-semibold text-white/85">Tu respuesta «{done.label}» se suma a las de la comunidad.</p>
            )}
          </div>
        )}

        {done && (
          <div className="absolute inset-x-3 bottom-3.5 z-20 grid gap-2.5 rounded-[22px] bg-ink/90 p-3.5 backdrop-blur" role="status">
            <div className="flex items-center justify-between gap-2 text-[13px]">
              <span>
                <b>Tu voto:</b> {done.label}
              </span>
              {done.points > 0 && <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-black text-ink">+{done.points} pts</span>}
            </div>
            {done.progress?.next && (
              <p className="-mt-1 text-xs text-white/75">
                {done.progress.remaining} votos para ser {done.progress.next}
              </p>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Yo voté «${done.label}» en «${poll.title}» ¿Y tú? ${typeof window !== "undefined" ? window.location.origin : ""}/p/${poll.slug}?src=reto`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPaused(true)}
                className="rounded-full bg-[#1fae54] py-2.5 text-center text-[13px] font-extrabold"
              >
                Retar
              </a>
              <Link href={`/p/${poll.slug}`} onClick={() => setPaused(true)} className="rounded-full border border-white/50 py-2.5 text-center text-[13px] font-bold">
                Detalle
              </Link>
              <button onClick={next} className="rounded-full bg-white py-2.5 text-[13px] font-extrabold text-ink">
                Siguiente
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="absolute inset-x-3 bottom-3.5 z-20 rounded-2xl bg-white p-3 text-sm text-ink">
            {error}{" "}
            <Link href="/entrar" className="font-bold underline">
              Crear cuenta
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
