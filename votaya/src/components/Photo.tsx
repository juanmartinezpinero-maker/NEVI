"use client";

import { useEffect, useRef, useState } from "react";

const initials = (s: string) =>
  s
    .replace(/[¿?¡!()«»"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Foto con respaldo: si no hay imagen o falla, muestra las iniciales sobre el tono de la categoría. */
export function Photo({
  src,
  alt,
  label,
  tone = "#b9b7ae",
  className = "",
  initialsClass = "text-4xl",
}: {
  src: string | null | undefined;
  alt: string;
  label: string;
  tone?: string;
  className?: string;
  initialsClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Si la imagen falló antes de hidratar, onError ya no se dispara: lo comprobamos al montar.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  return (
    <span className={`${/(^|\s)!?(absolute|fixed)\b/.test(className) ? "" : "relative "}grid place-items-center overflow-hidden ${className}`} style={{ background: tone }} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <span className={`font-black tracking-[-0.06em] text-white/90 ${initialsClass}`} aria-hidden>
        {initials(label)}
      </span>
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={ref} src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  );
}
