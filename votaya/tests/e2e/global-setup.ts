import { execSync } from "node:child_process";
import postgres from "postgres";

/** Base de datos limpia + migraciones + datos demo antes de las pruebas E2E. */
export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL ?? "postgres://votaya:votaya@localhost:5432/votaya_e2e";
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql`drop schema if exists public cascade`;
  await sql`drop schema if exists drizzle cascade`;
  await sql`create schema public`;
  await sql.end();
  const env = { ...process.env, DATABASE_URL: url };
  execSync("npx tsx scripts/migrate.ts", { stdio: "inherit", env });
  execSync("npx tsx scripts/seed.ts", { stdio: "inherit", env });
}
