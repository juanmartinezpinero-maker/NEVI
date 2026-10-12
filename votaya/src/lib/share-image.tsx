import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getCategory } from "./categories";
import { getPollBySlug, getResults } from "./polls";
import { formatCount } from "./text";

export const INK = "#222128";
export const LIME = "#e6ff7f";
export const PINK = "#eb5f7d";
const COLORS = [PINK, INK, "#8a8893", "#b0476a", "#5c5b63", "#c4c3bd"];

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

/** Logotipo voppi!: tinta con la exclamación rosa. */
export function Wordmark({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, fontWeight: 800, letterSpacing: -size * 0.06, color: INK, lineHeight: 1 }}>
      voppi<span style={{ color: PINK }}>!</span>
    </div>
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
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "voppi.app").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const story = format === "story";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: story ? "column" : "row",
          background: LIME,
          color: INK,
          padding: story ? 90 : 56,
          fontFamily: "Inter",
          gap: story ? 0 : 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: story ? "none" : 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Wordmark size={story ? 96 : 64} />
            <div style={{ display: "flex", fontSize: story ? 30 : 22, fontWeight: 500 }}>El mundo opina. ¿Y tú?</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: story ? 120 : 0 }}>
            <div style={{ display: "flex", fontSize: story ? 34 : 24, color: PINK, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3 }}>
              {cat?.name ?? "Encuesta"}
            </div>
            <div style={{ display: "flex", fontSize: story ? 88 : 54, fontWeight: 800, lineHeight: 1.04, letterSpacing: story ? -4 : -2.5, marginTop: 16 }}>
              {poll.title}
            </div>
          </div>
          {!story && (
            <div style={{ display: "flex", fontSize: 26, color: INK }}>
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
              <div style={{ display: "flex", height: story ? 34 : 22, borderRadius: 999, background: "rgba(34,33,40,0.12)", overflow: "hidden" }}>
                <div style={{ display: "flex", width: `${Math.max(r.pct, 2)}%`, background: COLORS[i % COLORS.length], borderRadius: 999 }} />
              </div>
            </div>
          ))}
          {poll.isDemo && <div style={{ display: "flex", fontSize: story ? 26 : 18, color: INK }}>Datos de demostración ficticios</div>}
        </div>

        {story && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 38, color: INK }}>{formatCount(results.total)} votos</div>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 800,
                padding: "30px 60px",
                borderRadius: 999,
                background: INK,
                color: LIME,
              }}
            >
              ¿Y tú? Vota
            </div>
            <div style={{ display: "flex", fontSize: 36, color: INK }}>
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
        background: LIME,
        color: INK,
        fontFamily: "Inter",
      }}
    >
      <Wordmark size={format === "story" ? 200 : 150} />
      <div style={{ display: "flex", fontSize: format === "story" ? 60 : 44, marginTop: 20 }}>El mundo opina. ¿Y tú?</div>
    </div>
  );
}
