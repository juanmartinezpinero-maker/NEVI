"use client";

import { useState } from "react";

export function ShareIconButton({ slug, title }: { slug: string; title: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = `${window.location.origin}/p/${slug}?src=card`;
    try {
      if (navigator.share) await navigator.share({ title: "VotaYa", text: `${title} ¿Y tú?`, url });
      else {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }
    } catch {}
  }
  return (
    <button
      onClick={share}
      aria-label={`Compartir «${title}»`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted hover:bg-slate-50 hover:text-ink"
    >
      {done ? "✓" : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      )}
    </button>
  );
}
