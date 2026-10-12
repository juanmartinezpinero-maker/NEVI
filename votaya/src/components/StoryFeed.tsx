"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { voteAction, type Progress } from "@/app/actions/vote";
import type { PollCard, Results } from "@/lib/polls";
import { Photo } from "./Photo";
import { ShareChannels, ShareSheet } from "./ShareSheet";

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
  category,
  topicsOpen = false,
  covers = {},
  className = "",
}: {
  polls: PollCard[];
  tones: Record<string, string>;
  categoryNames: Record<string, string>;
  loggedIn: boolean;
  category?: string;
  topicsOpen?: boolean;
  covers?: Record<string, string | null>;
  className?: string;
}) {
  const [topics, setTopics] = useState(topicsOpen && !category);
  const [sharing, setSharing] = useState(false);
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
    setSharing(false);
    setIndex((i) => i + 1);
  }, []);

  // Paso automático a la siguiente historia tras votar.
  useEffect(() => {
    if (!done || paused || sharing) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [done, paused, sharing, next]);

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

  const chips = [{ slug: "", name: "Todas" }, ...Object.entries(categoryNames).map(([slug, name]) => ({ slug, name }))];
  const topBar = (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-full bg-white/10 p-1 text-[14px] font-bold" role="tablist" aria-label="Tipo de encuestas">
          <Link href="/descubrir" role="tab" aria-selected={!topics && !category} onClick={() => setTopics(false)} className={`rounded-full px-3.5 py-1.5 ${!topics && !category ? "bg-lime text-ink" : "text-white/70"}`}>
            Rápidas
          </Link>
          <button role="tab" aria-selected={topics || Boolean(category)} onClick={() => setTopics(true)} className={`rounded-full px-3.5 py-1.5 ${topics || category ? "bg-lime text-ink" : "text-white/70"}`}>
            Por temas
          </button>
        </div>
        {loggedIn ? (
          <span className="text-xs font-bold tabular-nums text-white/80">{done?.progress ? `${done.progress.streak}d · ${done.progress.votes} votos` : ""}</span>
        ) : (
          <Link href="/entrar" className="text-xs font-bold underline">
            Entrar
          </Link>
        )}
      </div>
      {!topics && (
        <nav aria-label="Filtrar por tema" className="no-scrollbar -mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4">
          {chips.map((c) => {
            const on = (category ?? "") === c.slug;
            return (
              <Link
                key={c.slug || "all"}
                href={c.slug ? `/descubrir?cat=${c.slug}` : "/descubrir"}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold ${on ? "bg-white text-ink" : "bg-white/10 text-white/85"}`}
              >
                {c.slug && <span className="h-2 w-2 rounded-full" style={{ background: tones[c.slug] }} aria-hidden />}
                {c.name}
              </Link>
            );
          })}
          <Link href={category ? `/encuestas?cat=${category}` : "/encuestas"} className="shrink-0 rounded-full border border-white/30 px-3 py-1.5 text-[13px] font-bold text-white/85">
            Ver en lista
          </Link>
        </nav>
      )}
    </div>
  );

  // Selector de temas a pantalla completa: fotos grandes, un toque y empiezas a votar ese tema.
  const picker = (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h1 className="text-[30px] font-black tracking-[-0.05em]">Elige un tema</h1>
        <button onClick={() => setTopics(false)} className="text-sm font-bold text-white/70 underline">
          Cerrar
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-2.5">
        {chips.slice(1).map((c) => (
          <li key={c.slug}>
            <Link href={`/descubrir?cat=${c.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-[20px]">
              <Photo src={covers[c.slug]} alt="" label={c.name} tone={tones[c.slug]} className="absolute inset-0 h-full w-full" initialsClass="text-5xl opacity-40" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
              <span className={`absolute bottom-2.5 left-3 text-lg font-black tracking-[-0.04em] ${category === c.slug ? "text-lime" : ""}`}>{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/encuestas" className="mt-4 block rounded-full border border-white/30 py-3 text-center text-sm font-bold">
        Ver todas las encuestas en lista
      </Link>
    </div>
  );

  if (topics) {
    return (
      <section className={shell} aria-label="Historias">
        {topBar}
        {picker}
      </section>
    );
  }

  if (!poll) {
    return (
      <section className={shell} aria-label="Historias">
        {topBar}
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.05em]">{category ? `Has votado todo en ${categoryNames[category]}` : "Has votado todo"}</h1>
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
        <span className="flex items-center gap-3">
          <span className="kicker !text-white/70 tabular-nums">{total.toLocaleString("es-ES")} votos</span>
          <button onClick={() => setSharing(true)} aria-label="Compartir esta encuesta" className="flex items-center gap-1.5 rounded-full bg-pink px-3 py-1.5 text-[13px] font-extrabold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
            Compartir
          </button>
        </span>
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
                  data-option=""
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
          <div className={`relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 ${done ? "pb-72" : "pb-3.5"} justify-end`}>
            <Photo src={poll.imageUrl} alt="" label={poll.title} tone={tone} className="absolute inset-0 h-full w-full opacity-90" initialsClass="text-[140px] opacity-30" />
            <span className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/80" aria-hidden />
            {(done ? rows : poll.options.map((o) => ({ id: o.id, label: o.label, pct: 0, isOther: false }))).map((r) => {
              const mine = done ? (r.isOther ? !done.myOptionId : done.myOptionId === r.id) : false;
              return (
                <button
                  key={r.id}
                  onClick={() => !done && vote({ optionId: r.id }, r.label)}
                  data-option=""
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
          <div className="absolute inset-x-3 bottom-3.5 z-20 grid gap-3 rounded-[22px] bg-ink/90 p-3.5 backdrop-blur" role="status" onPointerDown={() => setPaused(true)}>
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
            <div>
              <p className="mb-2 text-[13px] font-extrabold">Comparte tu voto</p>
              <ShareChannels
                dark
                only={["whatsapp", "instagram", "tiktok", "x", "more"]}
                target={{ pollId: poll.id, slug: poll.slug, title: poll.title, myLabel: done.label !== "ya votaste" ? done.label : null }}
                onDone={() => setPaused(true)}
                onMore={() => setSharing(true)}
              />
            </div>
            <button onClick={next} className="rounded-full bg-white py-3 text-[15px] font-extrabold text-ink">
              Siguiente pregunta
            </button>
            <Link href={`/p/${poll.slug}`} onClick={() => setPaused(true)} className="-mt-0.5 text-center text-xs font-semibold text-white/70 underline">
              Ver resultados por país, edad y género
            </Link>
          </div>
        )}
        {sharing && <ShareSheet target={{ pollId: poll.id, slug: poll.slug, title: poll.title, myLabel: done && done.label !== "ya votaste" ? done.label : null }} onClose={() => setSharing(false)} />}
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
