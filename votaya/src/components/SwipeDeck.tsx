"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { voteAction, type Progress } from "@/app/actions/vote";
import type { PollCard, Results } from "@/lib/polls";
import { Photo } from "./Photo";

type Done = { results: Results; myOptionId: string | null; points: number; progress: Progress | null };

/** Modo rápido: una pregunta a pantalla completa; votas, ves el resultado y deslizas a la siguiente. */
export function SwipeDeck({ polls, gradients }: { polls: PollCard[]; gradients: Record<string, string> }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [total, setTotal] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const poll = polls[index];

  const next = useCallback(() => {
    if (!done) return;
    setDone(null);
    setError(null);
    setIndex((i) => i + 1);
  }, [done]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next]);

  function vote(optionId: string) {
    setError(null);
    start(async () => {
      const res = await voteAction(poll.id, { optionId });
      if (res.ok) {
        setDone({ results: res.results, myOptionId: res.myOptionId, points: res.points, progress: res.progress });
        setTotal((t) => t + 1);
        try {
          navigator.vibrate?.(25);
        } catch {}
      } else if (res.error === "already_voted" && res.results) {
        setDone({ results: res.results, myOptionId: null, points: 0, progress: null });
      } else {
        setError(res.message);
      }
    });
  }

  if (!poll) {
    return (
      <div className="card mx-auto mt-6 max-w-md p-8 text-center">
        <p className="text-5xl" aria-hidden>
          🏆
        </p>
        <h1 className="mt-3 font-display text-2xl font-extrabold">¡Has votado {total ? `${total} preguntas` : "todo"}!</h1>
        <p className="mt-2 text-muted">Vuelve mañana para mantener tu racha 🔥 o propón tu propia pregunta.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/crear" className="rounded-full bg-brand px-5 py-2.5 font-bold text-white">
            Crear pregunta
          </Link>
          <Link href="/encuestas" className="rounded-full border border-line px-5 py-2.5 font-bold">
            Ver encuestas
          </Link>
        </div>
      </div>
    );
  }

  const opts = poll.options;
  const duel = opts.length === 2;
  const grad = gradients[poll.category];

  return (
    <div
      className="mx-auto flex h-[calc(100dvh-10.5rem)] max-w-md flex-col gap-3 lg:h-[calc(100dvh-7rem)]"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (dy < -60 || dx < -60) next();
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span>⚡ Modo rápido</span>
        <span>
          {index + 1} / {polls.length}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((index + (done ? 1 : 0)) / polls.length) * 100}%` }} />
      </div>
      <h1 key={poll.id} className="animate-rise font-display text-2xl font-extrabold leading-tight">
        {poll.title}
      </h1>

      {!done ? (
        duel ? (
          <div className="relative grid min-h-0 flex-1 grid-rows-2 gap-3">
            {opts.map((o) => (
              <button
                key={o.id}
                onClick={() => vote(o.id)}
                disabled={pending}
                aria-label={`Votar ${o.label}`}
                className="group relative min-h-0 overflow-hidden rounded-3xl text-left shadow-lg active:scale-[0.98] disabled:opacity-80"
              >
                <Photo src={o.imageUrl ?? poll.imageUrl} alt="" emoji={o.emoji ?? poll.emoji} gradient={grad} className="absolute inset-0 h-full w-full [&>span]:text-7xl" />
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
                <span className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-display text-2xl font-extrabold text-white drop-shadow">
                  {o.label}
                  <span className="rounded-full bg-white px-4 py-1.5 font-sans text-sm font-bold text-brand">Votar</span>
                </span>
              </button>
            ))}
            <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-brand font-display font-black text-white shadow-xl">
              VS
            </span>
          </div>
        ) : (
          <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {opts.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => vote(o.id)}
                  disabled={pending}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-2.5 text-left font-bold shadow-sm active:scale-[0.98]"
                >
                  <Photo src={o.imageUrl} alt="" emoji={o.emoji} gradient={grad} className="h-12 w-14 shrink-0 rounded-xl [&>span]:text-2xl" />
                  {o.label}
                </button>
              </li>
            ))}
            {poll.allowOther && (
              <li>
                <Link href={`/p/${poll.slug}`} className="block rounded-2xl border border-dashed border-line p-3 text-center text-sm font-semibold text-muted">
                  ✍️ Escribir otra respuesta
                </Link>
              </li>
            )}
          </ul>
        )
      ) : (
        <div className="animate-rise flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {done.points > 0 && (
            <p className="rounded-2xl bg-amber-50 p-2.5 text-center text-sm font-bold text-amber-800 ring-1 ring-amber-200">
              ⭐ +{done.points} puntos{done.progress && done.progress.streak > 1 ? ` · 🔥 ${done.progress.streak} días seguidos` : ""}
              {done.progress?.next && <span className="block font-semibold">Te faltan {done.progress.remaining} votos para ser {done.progress.next}</span>}
            </p>
          )}
          {done.results.rows.map((r) => {
            const mine = r.id === done.myOptionId;
            return (
              <div key={r.id} className={`relative overflow-hidden rounded-2xl border bg-white ${mine ? "border-brand ring-1 ring-brand" : "border-line"}`}>
                <div className={`absolute inset-y-0 left-0 ${mine ? "bg-rose-200" : "bg-slate-200"} transition-all duration-700`} style={{ width: `${r.pct}%` }} aria-hidden />
                <div className="relative flex items-center gap-2 px-4 py-3 font-bold">
                  <span className="flex-1">
                    {r.label}
                    {mine && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] uppercase text-white">Tu voto</span>}
                  </span>
                  <span className="font-display text-lg">{r.pct}%</span>
                </div>
              </div>
            );
          })}
          <p className="text-center text-xs text-muted">{done.results.total.toLocaleString("es-ES")} votos</p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${poll.title} ¿Y tú? 👉 ${typeof window !== "undefined" ? window.location.origin : ""}/p/${poll.slug}?src=reto`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#25D366] py-3.5 text-center font-bold text-white"
            >
              💬 Retar
            </a>
            <button onClick={next} className="rounded-2xl bg-ink py-3.5 font-bold text-white">
              Siguiente ↑
            </button>
          </div>
          <p className="text-center text-xs text-muted">Desliza hacia arriba para la siguiente</p>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          {error}{" "}
          <Link href="/entrar?next=/descubrir" className="font-bold underline">
            Registrarme
          </Link>
        </p>
      )}
    </div>
  );
}
