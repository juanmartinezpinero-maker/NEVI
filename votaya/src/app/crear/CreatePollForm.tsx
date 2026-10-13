"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { checkSimilarAction, createPollAction, type CreatePollState } from "@/app/actions/polls";
import { CATEGORIES } from "@/lib/categories";

type Opt = { key: number; label: string; emoji: string; imageUrl: string };

const input = "w-full rounded-[16px] border-2 border-line bg-white px-4 py-3 text-base font-medium outline-none focus:border-ink";

export function CreatePollForm({ isAdmin, brand }: { isAdmin: boolean; brand?: { id: string; name: string } }) {
  const [visibility, setVisibility] = useState<"public" | "private">("private");
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
      {brand && (
        <fieldset className="space-y-2">
          <input type="hidden" name="sponsorId" value={brand.id} />
          <legend className="mb-1 text-sm font-bold">¿Dónde se publica?</legend>
          {(
            [
              ["private", "Privada", "Solo quien tenga el enlace. Ideal para tests de producto con tu equipo o tus clientes. Se activa al momento."],
              ["public", "Pública y patrocinada", `Aparece en voppi! con la etiqueta «Patrocinada por ${brand.name}». Pasa por moderación antes de publicarse.`],
            ] as const
          ).map(([value, title, text]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-[16px] border-2 p-3 ${visibility === value ? "border-ink bg-lime" : "border-line"}`}>
              <input type="radio" name="visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} className="mt-1 accent-[#eb5f7d]" />
              <span>
                <b className="block">{title}</b>
                <span className="text-sm text-ink-2">{text}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Pregunta</span>
        <input name="title" required minLength={8} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Tortilla con o sin cebolla?" className={input} />
      </label>
      {shownSimilar.length > 0 && (
        <div className="rounded-[18px] bg-lime p-3.5 text-sm" role="status">
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
            <input type="checkbox" name="confirmDuplicate" className="accent-[#eb5f7d]" /> La mía es diferente, enviarla igualmente
          </label>
        </div>
      )}
      <label className="block">
          <span className="mb-1 block text-sm font-bold">Categoría</span>
          <select name="category" required value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} className={input}>
            <option value="" disabled>
              Elige una
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">
          Descripción <span className="font-normal text-muted">(opcional)</span>
        </span>
        <textarea name="description" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} maxLength={300} rows={2} className={input} />
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-bold">Opciones ({opts.length}/10)</legend>
        {opts.map((o, i) => (
          <div key={o.key} className="space-y-2">
            <div className="flex gap-2">
              <input name="optionLabel" aria-label={`Opción ${i + 1}`} value={o.label} onChange={(e) => update(o.key, { label: e.target.value })} maxLength={60} required={i < 2} placeholder={`Opción ${i + 1}`} className={input} />
              {opts.length > 2 && (
                <button type="button" aria-label={`Quitar opción ${i + 1}`} onClick={() => setOpts((x) => x.filter((y) => y.key !== o.key))} className="rounded-full px-3 text-muted hover:text-ink">
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
            <button type="button" onClick={() => setOpts((x) => [...x, { key: Date.now(), label: "", emoji: "", imageUrl: "" }])} className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-line">
              + Añadir opción
            </button>
          )}
          <button type="button" onClick={() => setShowImages((v) => !v)} className="rounded-full bg-wash px-4 py-2 text-sm font-bold hover:bg-line">
            {showImages ? "Ocultar imágenes" : "Añadir imágenes"}
          </button>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allowOther" checked={meta.allowOther} onChange={(e) => setMeta({ ...meta, allowOther: e.target.checked })} className="h-4 w-4 accent-[#eb5f7d]" />
        Permitir «Otra» (los votantes pueden escribir su respuesta)
      </label>
      {showImages && (
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Imagen de portada (URL https, opcional)</span>
          <input name="imageUrl" value={meta.imageUrl} onChange={(e) => setMeta({ ...meta, imageUrl: e.target.value })} placeholder="https://…" className={input} />
        </label>
      )}

      {state.error && (
        <p role="alert" className="rounded-[14px] bg-pink-soft p-3 text-sm">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="w-full rounded-full bg-ink py-4 text-lg font-extrabold text-lime disabled:opacity-60">
        {pending ? "Enviando…" : brand && visibility === "private" ? "Crear encuesta privada" : isAdmin ? "Publicar ahora" : "Enviar a moderación"}
      </button>
      <p className="text-center text-xs text-muted">
        Revisamos cada pregunta antes de publicarla. Nada de insultos, datos personales ni contenido ofensivo.
      </p>
    </form>
  );
}
