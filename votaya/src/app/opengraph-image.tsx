import { ImageResponse } from "next/og";
import { INK, LIME, loadFonts, Wordmark } from "@/lib/share-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "voppi! — El mundo opina. ¿Y tú?";

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
          background: LIME,
          color: INK,
          fontFamily: "Inter",
        }}
      >
        <Wordmark size={190} />
        <div style={{ display: "flex", fontSize: 50, marginTop: 16 }}>El mundo opina. ¿Y tú?</div>
      </div>
    ),
    { ...size, fonts: await loadFonts() },
  );
}
