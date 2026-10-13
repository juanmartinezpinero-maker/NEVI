/**
 * Paso previo al build en Vercel: copia las fotos dentro de la web, aplica migraciones y carga
 * las encuestas iniciales (solo la primera vez: el seed no hace nada si ya existen).
 *  - SEED_MODE=launch → preguntas a cero votos, listas para el lanzamiento real.
 *  - SEED_DEMO=1      → preguntas con votos ficticios marcados como demostración.
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL: añádela en Vercel → Settings → Environment Variables");
  process.exit(1);
}
execSync("npx tsx scripts/fetch-photos.ts", { stdio: "inherit" });
execSync("npx tsx scripts/migrate.ts", { stdio: "inherit" });
if (process.env.SEED_MODE === "launch") execSync("npx tsx scripts/seed.ts --launch", { stdio: "inherit" });
else if (process.env.SEED_DEMO === "1") execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });
