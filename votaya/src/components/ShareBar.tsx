"use client";

import { ShareChannels, type ShareTarget } from "./ShareSheet";

/** Bloque de compartir visible tras votar en la página de la encuesta. */
export function ShareBar({ target }: { target: ShareTarget }) {
  return (
    <section aria-label="Compartir resultado" className="rounded-[22px] bg-wash p-4">
      <p className="mb-3 text-[15px] font-extrabold">Compártelo y mira qué votan tus amigos</p>
      <ShareChannels target={target} />
    </section>
  );
}
