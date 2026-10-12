"use client";

import { useState } from "react";

function trackShare(pollId: string, channel: string) {
  const body = JSON.stringify({ type: "share", pollId, meta: { channel } });
  navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
}

export function ShareBar({ pollId, slug, url, text }: { pollId: string; slug: string; url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const withSrc = (src: string) => `${url}${url.includes("?") ? "&" : "?"}src=${src}`;
  const storyUrl = `/api/story/${slug}`;

  const links = [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${withSrc("wa")}`)}` },
    { id: "x", label: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(withSrc("x"))}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(withSrc("tg"))}&text=${encodeURIComponent(text)}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withSrc("fb"))}` },
  ];

  async function nativeShare() {
    trackShare(pollId, "native");
    setBusy(true);
    try {
      const shareData: ShareData = { title: "voppi!", text, url: withSrc("native") };
      // En móvil, compartir la imagen 9:16 permite publicarla en Stories de Instagram o TikTok.
      try {
        const blob = await fetch(storyUrl).then((r) => r.blob());
        const file = new File([blob], `voppi-${slug}.png`, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) shareData.files = [file];
      } catch {}
      if (navigator.share) await navigator.share(shareData);
      else await copy();
    } catch {
      // El usuario canceló el diálogo de compartir.
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    trackShare(pollId, "copy");
    try {
      await navigator.clipboard.writeText(withSrc("link"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const pill = "rounded-full bg-wash px-3.5 py-2 text-center text-[13px] font-bold hover:bg-line";
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={nativeShare} disabled={busy} className="rounded-full border-2 border-ink py-2.5 text-sm font-extrabold disabled:opacity-60">
          {busy ? "Preparando…" : "Compartir resultado"}
        </button>
        <a href={storyUrl} download={`voppi-${slug}-story.png`} onClick={() => trackShare(pollId, "story_download")} className="rounded-full border-2 border-ink py-2.5 text-center text-sm font-extrabold">
          Imagen para Stories
        </a>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {links.map((l) => (
          <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => trackShare(pollId, l.id)} className={pill}>
            {l.label}
          </a>
        ))}
        <button onClick={copy} className={pill}>
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
      <p className="text-xs text-muted">Instagram y TikTok no permiten compartir enlaces desde la web: descarga la imagen y súbela a tu Story.</p>
    </div>
  );
}
