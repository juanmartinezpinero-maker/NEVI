/**
 * Paso previo al build en Vercel: aplica migraciones y, si SEED_DEMO=1, carga las encuestas demo
 * (solo la primera vez: el seed no hace nada si ya existen).
 */
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL: añádela en Vercel → Settings → Environment Variables");
  process.exit(1);
}
execSync("npx tsx scripts/migrate.ts", { stdio: "inherit" });
if (process.env.SEED_DEMO === "1") execSync("npx tsx scripts/seed.ts", { stdio: "inherit" });
