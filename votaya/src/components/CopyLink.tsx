"use client";

import { useState } from "react";

/** Botón para copiar el enlace de una encuesta. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copia el enlace:", url);
        }
      }}
      className="rounded-full bg-lime px-4 py-2.5 text-sm font-extrabold"
    >
      {copied ? "Enlace copiado" : "Copiar enlace"}
    </button>
  );
}
