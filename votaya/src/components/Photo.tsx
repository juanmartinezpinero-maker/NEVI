"use client";

import { useEffect, useRef, useState } from "react";

/** Imagen con respaldo: si la foto no carga, muestra un degradado con emoji. */
export function Photo({
  src,
  alt,
  emoji,
  gradient = "from-rose-300 to-violet-400",
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  emoji?: string | null;
  gradient?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Si la imagen falló antes de hidratar, onError ya no se dispara: lo comprobamos al montar.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`} role="img" aria-label={alt}>
        <span className="text-4xl drop-shadow" aria-hidden>
          {emoji ?? "🗳️"}
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
