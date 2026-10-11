import "server-only";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

/**
 * Límite de frecuencia por ventana fija guardado en Postgres (sin Redis en el MVP).
 * Devuelve true si la acción está permitida.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = await getDb();
  const reset = new Date(Date.now() + windowSeconds * 1000);
  const [row] = await db
    .insert(schema.rateLimits)
    .values({ key, count: 1, resetAt: reset })
    .onConflictDoUpdate({
      target: schema.rateLimits.key,
      set: {
        count: sql`case when ${schema.rateLimits.resetAt} < now() then 1 else ${schema.rateLimits.count} + 1 end`,
        resetAt: sql`case when ${schema.rateLimits.resetAt} < now() then ${reset.toISOString()}::timestamptz else ${schema.rateLimits.resetAt} end`,
      },
    })
    .returning({ count: schema.rateLimits.count });
  return row.count <= limit;
}
