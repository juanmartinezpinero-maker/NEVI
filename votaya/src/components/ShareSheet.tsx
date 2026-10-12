"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandIcon, BRANDS, type Brand } from "./BrandIcons";

export type ShareTarget = { pollId: string; slug: string; title: string; myLabel?: string | null };

function trackShare(pollId: string, channel: string) {
  try {
    const body = JSON.stringify({ type: "share", pollId, meta: { channel } });
    navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
  } catch {}
}

function shareText(t: ShareTarget) {
  return t.myLabel ? `Yo voté «${t.myLabel}» en «${t.title}». ¿Y tú?` : `«${t.title}» ¿Tú qué votas?`;
}

/** Botones de compartir por red: enlaces directos y, para Instagram/TikTok, la imagen 9:16 del resultado. */
export function ShareChannels({
  target,
  onDone,
  onMore,
  dark = false,
  only,
}: {
  target: ShareTarget;
  onDone?: () => void;
  /** Si se pasa, «Más» abre esto (p. ej. la hoja completa) en lugar del menú del sistema. */
  onMore?: () => void;
  dark?: boolean;
  /** Muestra solo estas redes, en fila compacta. */
  only?: string[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = (src: string) => `${origin}/p/${target.slug}?src=${src}`;
  const text = shareText(target);
  const storyUrl = `/api/story/${target.slug}`;

  const open = (id: string, href: string) => {
    trackShare(target.pollId, id);
    window.open(href, "_blank", "noopener,noreferrer");
    onDone?.();
  };

  async function storyFile() {
    const blob = await fetch(storyUrl).then((r) => r.blob());
    return new File([blob], `voppi-${target.slug}.png`, { type: "image/png" });
  }

  // Instagram y TikTok no aceptan enlaces desde la web: compartimos la imagen (o la descargamos).
  async function shareImage(id: "instagram" | "tiktok") {
    trackShare(target.pollId, id);
    setBusy(id);
    try {
      const file = await storyFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${url(id === "instagram" ? "ig" : "tt")}` });
        onDone?.();
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        setMsg(`Imagen guardada. Súbela a tu historia de ${id === "instagram" ? "Instagram" : "TikTok"} y añade el enlace.`);
      }
    } catch {
      // Cancelado por el usuario.
    } finally {
      setBusy(null);
    }
  }

  async function copy() {
    trackShare(target.pollId, "copy");
    try {
      await navigator.clipboard.writeText(url("link"));
      setMsg("Enlace copiado.");
    } catch {
      setMsg(url("link"));
    }
  }

  async function more() {
    trackShare(target.pollId, "native");
    try {
      if (navigator.share) {
        await navigator.share({ title: "voppi!", text, url: url("native") });
        onDone?.();
      } else await copy();
    } catch {}
  }

  const items: { id: string; label: string; brand?: Brand; bg: string; run: () => void }[] = [
    { id: "whatsapp", label: "WhatsApp", brand: "whatsapp", bg: BRANDS.whatsapp.hex, run: () => open("whatsapp", `https://wa.me/?text=${encodeURIComponent(`${text} ${url("wa")}`)}`) },
    { id: "instagram", label: "Instagram", brand: "instagram", bg: "linear-gradient(45deg,#f9a83b,#ee2a7b 55%,#6228d7)", run: () => shareImage("instagram") },
    { id: "tiktok", label: "TikTok", brand: "tiktok", bg: "#000", run: () => shareImage("tiktok") },
    { id: "x", label: "X", brand: "x", bg: "#000", run: () => open("x", `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url("x"))}`) },
    { id: "facebook", label: "Facebook", brand: "facebook", bg: BRANDS.facebook.hex, run: () => open("facebook", `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url("fb"))}`) },
    { id: "telegram", label: "Telegram", brand: "telegram", bg: BRANDS.telegram.hex, run: () => open("telegram", `https://t.me/share/url?url=${encodeURIComponent(url("tg"))}&text=${encodeURIComponent(text)}`) },
    { id: "copy", label: "Copiar enlace", bg: dark ? "#3b3a42" : "#222128", run: copy },
    { id: "more", label: "Más", bg: dark ? "#3b3a42" : "#e7e6e1", run: onMore ?? more },
  ];
  const shown = only ? items.filter((it) => only.includes(it.id)) : items;

  return (
    <div>
      <ul className={only ? "flex justify-between gap-1" : "grid grid-cols-4 gap-x-2 gap-y-3"}>
        {shown.map((it) => (
          <li key={it.id}>
            <button onClick={it.run} disabled={busy === it.id} className="flex w-full flex-col items-center gap-1.5 text-[12px] font-semibold disabled:opacity-60" aria-label={`Compartir en ${it.label}`}>
              <span className={`grid place-items-center rounded-full text-white ${only ? "h-11 w-11" : "h-[52px] w-[52px]"}`} style={{ background: it.bg }}>
                {it.brand ? (
                  <BrandIcon name={it.brand} />
                ) : it.id === "copy" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={dark ? "#fff" : "#222128"} aria-hidden>
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                )}
              </span>
              <span className="truncate">{busy === it.id ? "Preparando…" : it.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {msg && (
        <p role="status" className={`mt-3 rounded-[14px] px-3 py-2 text-[13px] font-semibold ${dark ? "bg-white/10" : "bg-lime"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

/** Hoja inferior para compartir: vista previa de la imagen y todas las redes. */
export function ShareSheet({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // Portal al body: el feed crea su propio contexto de apilado y la barra inferior taparía la hoja.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compartir encuesta"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise w-full max-w-md rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink sm:rounded-[28px]"
      >
        <div className="mb-4 flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/story/${target.slug}`} alt="Imagen para compartir" className="aspect-[9/16] w-20 shrink-0 rounded-[12px] bg-lime object-cover" />
          <div className="min-w-0 flex-1">
            <p className="kicker">Compartir</p>
            <p className="text-xl font-black leading-tight tracking-[-0.04em]">{target.title}</p>
            <p className="mt-1 text-[13px] text-muted">{target.myLabel ? `Tu voto: ${target.myLabel}` : "Reta a tus amigos a votar"}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-wash text-lg font-bold">
            ×
          </button>
        </div>
        <ShareChannels target={target} onDone={onClose} />
      </div>
    </div>,
    document.body,
  );
}

/** Botón que abre la hoja de compartir. */
export function ShareButton({ target, className = "", children = "Compartir" }: { target: ShareTarget; className?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <ShareSheet target={target} onClose={() => setOpen(false)} />}
    </>
  );
}
