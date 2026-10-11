import { ImageResponse } from "next/og";
import { loadFonts, LogoSvg } from "@/lib/share-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "VotaYa — El mundo opina. ¿Y tú?";

export default async function Image() {
  return new ImageResponse(
    (
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
        <LogoSvg size={120} />
        <div style={{ display: "flex", fontSize: 130, fontWeight: 800 }}>
          Vota<span style={{ color: "#f472b6" }}>Ya</span>
        </div>
        <div style={{ display: "flex", fontSize: 50, color: "#c4b5fd", marginTop: 16 }}>El mundo opina. ¿Y tú?</div>
      </div>
    ),
    { ...size, fonts: await loadFonts() },
  );
}
