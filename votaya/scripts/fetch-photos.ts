/**
 * Copia las fotos de las encuestas dentro de la web (public/photos) para no depender del
 * servidor externo donde se generaron. Se ejecuta en el build de Vercel; si una descarga
 * falla no rompe el build: esa foto se sigue sirviendo desde su URL original.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PHOTOS } from "./demo-photos";

export const PHOTO_DIR = path.join(process.cwd(), "public", "photos");

export function localPhoto(key: string) {
  return existsSync(path.join(PHOTO_DIR, `${key}.png`)) ? `/photos/${key}.png` : null;
}

async function main() {
  mkdirSync(PHOTO_DIR, { recursive: true });
  let ok = 0;
  const failed: string[] = [];
  for (const [key, url] of Object.entries(PHOTOS)) {
    const file = path.join(PHOTO_DIR, `${key}.png`);
    if (existsSync(file)) {
      ok++;
      continue;
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (e) {
      failed.push(`${key} (${(e as Error).message})`);
    }
  }
  console.log(`Fotos copiadas: ${ok}/${Object.keys(PHOTOS).length}`);
  if (failed.length) console.warn(`No se pudieron copiar (se usará la URL original): ${failed.join(", ")}`);
}

if (process.argv[1]?.endsWith("fetch-photos.ts")) main();
