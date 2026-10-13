import "server-only";
import { getDb, schema } from "@/db";

export type EventType = "view" | "vote" | "signup" | "login" | "share" | "link_click" | "poll_created";

export async function track(
  type: EventType,
  data: { pollId?: string | null; userId?: string | null; anonId?: string | null; refCode?: string | null; meta?: Record<string, unknown> } = {},
) {
  try {
    const db = await getDb();
    await db.insert(schema.events).values({
      type,
      pollId: data.pollId ?? null,
      userId: data.userId ?? null,
      anonId: data.anonId ?? null,
      refCode: data.refCode ?? null,
      meta: data.meta ?? null,
    });
  } catch (err) {
    // La analítica nunca debe romper un flujo de usuario.
    console.error("track failed", err);
  }
}
