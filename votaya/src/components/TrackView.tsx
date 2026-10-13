"use client";

import { useEffect } from "react";

/** Registra una visita (solo navegadores reales con JS; excluye prefetch y bots simples). */
export function TrackView({ pollId, path }: { pollId?: string; path?: string }) {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    const body = JSON.stringify({ type: "view", pollId, path: path ?? window.location.pathname, ref });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  }, [pollId, path]);
  return null;
}
