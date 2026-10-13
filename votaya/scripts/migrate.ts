import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "../src/db/connect";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // PGlite migra automáticamente al conectar.
    await getDb();
    console.log("PGlite local migrado (.data/pglite)");
    process.exit(0);
  }
  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await client.end();
  console.log("Migraciones aplicadas");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
