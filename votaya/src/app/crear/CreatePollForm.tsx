"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { checkSimilarAction, createPollAction, type CreatePollState } from "@/app/actions/polls";
import { CATEGORIES } from "@/lib/categories";

type Opt = { key: number; label: string; emoji: string; imageUrl: string };

const input = "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-rose-300";

export function CreatePollForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, action, pending] = useActionState<CreatePollState, FormData>(createPollAction, {});
  const [title, setTitle] = useState("");
  const [similar, setSimilar] = useState<{ slug: string; title: string; status: string }[]>([]);
  const [opts, setOpts] = useState<Opt[]>([
    { key: 1, label: "", emoji: "", imageUrl: "" },
    { key: 2, label: "", emoji: "", imageUrl: "" },
  ]);
  const [showImages, setShowImages] = useState(false);
  // Campos controlados: React resetea los no controlados tras cada envío.
  const [meta, setMeta] = useState({ category: "", emoji: "", description: "", imageUrl: "", allowOther: true });

  useEffect(() => {
    if (title.trim().length < 8) return;
    const t = setTimeout(() => {
      checkSimilarAction(title).then(setSimilar).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [title]);

  const update = (key: number, patch: Partial<Opt>) => setOpts((o) => o.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const shownSimilar = state.similar?.length ? state.similar : title.trim().length >= 8 ? similar : [];

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Pregunta</span>
        <input name="title" required minLength={8} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Tortilla con o sin cebolla?" className={input} />
      </label>
      {shownSimilar.length > 0 && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm" role="status">
          <p className="font-bold">Ya hay preguntas parecidas:</p>
          <ul className="mt-1 list-disc pl-5">
            {shownSimilar.map((s) => (
              <li key={s.slug}>
                {s.status === "published" ? (
                  <Link href={`/p/${s.slug}`} target="_blank" className="underline">
                    {s.title}
                  </Link>
                ) : (
                  <span>{s.title} (en moderación)</span>
                )}
              </li>
            ))}
          </ul>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" name="confirmDuplicate" className="accent-rose-600" /> La mía es diferente, enviarla igualmente
          </label>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Categoría</span>
          <select name="category" required value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} className={input}>
            <option value="" disabled>
              Elige una
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Emoji</span>
          <input name="emoji" value={meta.emoji} onChange={(e) => setMeta({ ...meta, emoji: e.target.value })} maxLength={8} placeholder="🥔" className={`${input} text-center`} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">
          Descripción <span className="font-normal text-muted">(opcional)</span>
        </span>
        <textarea name="description" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} maxLength={300} rows={2} className={input} />
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-bold">Opciones ({opts.length}/10)</legend>
        {opts.map((o, i) => (
          <div key={o.key} className="space-y-2 rounded-2xl border border-line p-2">
            <div className="flex gap-2">
              <input name="optionEmoji" aria-label={`Emoji opción ${i + 1}`} value={o.emoji} onChange={(e) => update(o.key, { emoji: e.target.value })} maxLength={8} placeholder="🙂" className={`${input} w-16 px-2 text-center`} />
              <input name="optionLabel" aria-label={`Opción ${i + 1}`} value={o.label} onChange={(e) => update(o.key, { label: e.target.value })} maxLength={60} required={i < 2} placeholder={`Opción ${i + 1}`} className={input} />
              {opts.length > 2 && (
                <button type="button" aria-label={`Quitar opción ${i + 1}`} onClick={() => setOpts((x) => x.filter((y) => y.key !== o.key))} className="rounded-xl px-3 text-muted hover:text-ink">
                  ✕
                </button>
              )}
            </div>
            {showImages ? (
              <input name="optionImage" aria-label={`Imagen opción ${i + 1}`} value={o.imageUrl} onChange={(e) => update(o.key, { imageUrl: e.target.value })} placeholder="https://… (imagen, opcional)" className={`${input} text-sm`} />
            ) : (
              <input type="hidden" name="optionImage" value="" />
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {opts.length < 10 && (
            <button type="button" onClick={() => setOpts((x) => [...x, { key: Date.now(), label: "", emoji: "", imageUrl: "" }])} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
              + Añadir opción
            </button>
          )}
          <button type="button" onClick={() => setShowImages((v) => !v)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
            🖼️ {showImages ? "Ocultar imágenes" : "Añadir imágenes"}
          </button>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allowOther" checked={meta.allowOther} onChange={(e) => setMeta({ ...meta, allowOther: e.target.checked })} className="h-4 w-4 accent-rose-600" />
        Permitir «Otra» (los votantes pueden escribir su respuesta)
      </label>
      {showImages && (
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Imagen de portada (URL https, opcional)</span>
          <input name="imageUrl" value={meta.imageUrl} onChange={(e) => setMeta({ ...meta, imageUrl: e.target.value })} placeholder="https://…" className={input} />
        </label>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="bg-brand-gradient w-full rounded-2xl py-3.5 font-extrabold text-white disabled:opacity-60">
        {pending ? "Enviando…" : isAdmin ? "Publicar ahora" : "Enviar a moderación"}
      </button>
      <p className="text-center text-xs text-muted">
        Revisamos cada pregunta antes de publicarla. Nada de insultos, datos personales ni contenido ofensivo.
      </p>
    </form>
  );
}
