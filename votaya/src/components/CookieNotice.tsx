"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const KEY = "vy_cookie_notice";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

function dismiss() {
  try {
    localStorage.setItem(KEY, "1");
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

/** Solo usamos cookies técnicas y analítica propia sin terceros: aviso informativo. */
export function CookieNotice() {
  const seen = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(KEY) === "1";
      } catch {
        return true;
      }
    },
    () => true,
  );
  const path = usePathname();
  if (seen) return null;
  // En el feed a pantalla completa del móvil no tapamos la pregunta: el aviso sale en el resto de páginas.
  const feed = path === "/" || path.startsWith("/descubrir");
  return (
    <div role="region" aria-label="Aviso de cookies" className={`fixed inset-x-3 bottom-[4.5rem] z-50 items-center gap-3 rounded-[18px] bg-white p-3 text-[13px] shadow-lg ring-1 ring-line lg:bottom-4 lg:left-auto lg:max-w-sm ${feed ? "hidden lg:flex" : "flex"}`}>
      <p className="text-muted">
        Usamos solo cookies técnicas y medición propia, sin publicidad ni terceros.{" "}
        <Link href="/privacidad" className="underline">
          Más info
        </Link>
      </p>
      <button
        className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 font-extrabold text-lime"
        onClick={dismiss}
      >
        Vale
      </button>
    </div>
  );
}
