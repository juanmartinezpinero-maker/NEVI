import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getCategory } from "./categories";
import { getPollBySlug, getResults } from "./polls";
import { formatCount } from "./text";

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#22d3ee", "#a3e635", "#fb7185"];

type Format = "story" | "og";

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | null = null;

/** Inter (licencia OFL) incluida en el repo para que las imágenes no dependan de la red. */
export function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(process.cwd(), "assets/fonts/Inter-Medium.ttf")),
    readFile(path.join(process.cwd(), "assets/fonts/Inter-ExtraBold.ttf")),
  ]).then(([medium, bold]) => [
    { name: "Inter", data: medium, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 800 as const, style: "normal" as const },
  ]);
  return fontsPromise;
}

export function LogoSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.6" stopColor="#ec4899" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#g)" />
      <rect x="14" y="34" width="9" height="16" rx="3" fill="#fff" fillOpacity="0.55" />
      <rect x="27.5" y="24" width="9" height="26" rx="3" fill="#fff" fillOpacity="0.8" />
      <path d="M41 30 l5 5 l10 -14" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Tarjeta visual de resultados: 1080x1920 (Stories/Reels/TikTok) o 1200x630 (Open Graph). */
export async function renderShareImage(slug: string, format: Format) {
  const size = { ...(format === "story" ? { width: 1080, height: 1920 } : { width: 1200, height: 630 }), fonts: await loadFonts() };
  const poll = await getPollBySlug(slug);
  if (!poll || poll.status !== "published") {
    return new ImageResponse(<Fallback format={format} />, size);
  }
  const results = await getResults(poll.id);
  const rows = [...results.rows].sort((a, b) => b.count - a.count).slice(0, format === "story" ? 6 : 4);
  const cat = getCategory(poll.category);
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "votaya.app").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const story = format === "story";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: story ? "column" : "row",
          background: "linear-gradient(160deg, #1b1240 0%, #0c0a1d 55%, #2a0f2e 100%)",
          color: "white",
          padding: story ? 90 : 56,
          fontFamily: "Inter",
          gap: story ? 0 : 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: story ? "none" : 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <LogoSvg size={story ? 84 : 60} />
            <div style={{ display: "flex", fontSize: story ? 56 : 40, fontWeight: 800 }}>
              Vota<span style={{ color: "#f472b6" }}>Ya</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: story ? 120 : 0 }}>
            <div style={{ display: "flex", fontSize: story ? 34 : 24, color: "#c4b5fd", fontWeight: 700, textTransform: "uppercase", letterSpacing: 3 }}>
              {cat?.name ?? "Encuesta"}
            </div>
            <div style={{ display: "flex", fontSize: story ? 84 : 52, fontWeight: 800, lineHeight: 1.08, marginTop: 16 }}>
              {poll.title}
            </div>
          </div>
          {!story && (
            <div style={{ display: "flex", fontSize: 26, color: "#a7a3c7" }}>
              {formatCount(results.total)} votos · ¿Y tú? Vota en {host}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: story ? 30 : 18, marginTop: story ? 90 : 0, flex: 1, justifyContent: "center" }}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: story ? 46 : 28, fontWeight: 800 }}>
                <span style={{ display: "flex", maxWidth: "80%" }}>{r.label}</span>
                <span style={{ display: "flex" }}>{r.pct}%</span>
              </div>
              <div style={{ display: "flex", height: story ? 34 : 22, borderRadius: 999, background: "#2c2750", overflow: "hidden" }}>
                <div style={{ display: "flex", width: `${Math.max(r.pct, 2)}%`, background: COLORS[i % COLORS.length], borderRadius: 999 }} />
              </div>
            </div>
          ))}
          {poll.isDemo && <div style={{ display: "flex", fontSize: story ? 26 : 18, color: "#fcd34d" }}>Datos de demostración ficticios</div>}
        </div>

        {story && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 38, color: "#a7a3c7" }}>{formatCount(results.total)} votos</div>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 800,
                padding: "30px 60px",
                borderRadius: 999,
                background: "linear-gradient(90deg,#8b5cf6,#ec4899 60%,#f59e0b)",
              }}
            >
              ¿Y tú? Vota ya
            </div>
            <div style={{ display: "flex", fontSize: 36, color: "#e9d5ff" }}>
              {host}
            </div>
          </div>
        )}
      </div>
    ),
    { ...size, headers: { "cache-control": "public, max-age=300, s-maxage=300" } },
  );
}

function Fallback({ format }: { format: Format }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #1b1240, #0c0a1d 60%, #2a0f2e)",
        color: "white",
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", fontSize: format === "story" ? 140 : 110, fontWeight: 800 }}>
        Vota<span style={{ color: "#f472b6" }}>Ya</span>
      </div>
      <div style={{ display: "flex", fontSize: format === "story" ? 60 : 44, color: "#c4b5fd", marginTop: 20 }}>El mundo opina. ¿Y tú?</div>
    </div>
  );
}
