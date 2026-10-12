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
    { id: "whatsapp", label: "WhatsApp", bg: "bg-[#25D366]", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${withSrc("wa")}`)}` },
    { id: "x", label: "X", bg: "bg-black", href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(withSrc("x"))}` },
    { id: "telegram", label: "Telegram", bg: "bg-[#229ED9]", href: `https://t.me/share/url?url=${encodeURIComponent(withSrc("tg"))}&text=${encodeURIComponent(text)}` },
    { id: "facebook", label: "Facebook", bg: "bg-[#1877F2]", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(withSrc("fb"))}` },
  ];

  async function nativeShare() {
    trackShare(pollId, "native");
    setBusy(true);
    try {
      const shareData: ShareData = { title: "VotaYa", text, url: withSrc("native") };
      // En móvil, compartir la imagen 9:16 permite publicarla directamente en Stories de Instagram/TikTok.
      try {
        const blob = await fetch(storyUrl).then((r) => r.blob());
        const file = new File([blob], `votaya-${slug}.png`, { type: "image/png" });
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

  return (
    <div className="space-y-3">
      <button
        onClick={nativeShare}
        disabled={busy}
        className="bg-brand-gradient w-full rounded-2xl py-3.5 text-base font-extrabold text-white shadow-lg shadow-rose-200 disabled:opacity-70"
      >
        {busy ? "Preparando…" : "📤 Compartir resultado"}
      </button>
      <div className="grid grid-cols-4 gap-2 text-xs font-bold">
        {links.map((l) => (
          <a
            key={l.id}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare(pollId, l.id)}
            className={`${l.bg} rounded-xl py-2.5 text-center text-white`}
          >
            {l.label}
          </a>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
        <a
          href={storyUrl}
          download={`votaya-${slug}-story.png`}
          onClick={() => trackShare(pollId, "story_download")}
          className="rounded-xl border border-line bg-slate-100 py-2.5 text-center hover:bg-slate-200"
          title="Imagen vertical 9:16 para Stories de Instagram y TikTok"
        >
          📲 Imagen para Stories
        </a>
        <button onClick={copy} className="rounded-xl border border-line bg-slate-100 py-2.5 hover:bg-slate-200">
          {copied ? "✓ Copiado" : "🔗 Copiar enlace"}
        </button>
      </div>
      <p className="text-center text-xs text-muted">
        Instagram y TikTok no permiten compartir enlaces desde la web: descarga la imagen y súbela a tu Story o vídeo.
      </p>
    </div>
  );
}
