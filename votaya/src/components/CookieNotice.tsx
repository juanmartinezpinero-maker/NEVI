"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const KEY = "vy_cookie_notice";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

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
  if (seen) return null;
  return (
    <div role="region" aria-label="Aviso de cookies" className="card fixed inset-x-3 bottom-20 z-40 flex items-center gap-3 p-3 text-sm sm:bottom-4 sm:left-auto sm:max-w-sm">
      <p className="text-muted">
        Usamos solo cookies técnicas y medición propia, sin publicidad ni terceros.{" "}
        <Link href="/privacidad" className="underline">
          Más info
        </Link>
      </p>
      <button
        className="shrink-0 rounded-full bg-white px-3 py-1.5 font-bold text-ink"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
            window.dispatchEvent(new Event("storage"));
          } catch {}
        }}
      >
        Vale
      </button>
    </div>
  );
}
