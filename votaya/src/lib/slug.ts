import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { randomToken } from "./crypto";
import { slugify } from "./text";

export async function uniqueSlug(title: string) {
  const db = await getDb();
  const base = slugify(title) || "encuesta";
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? base : `${base}-${randomToken(3).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const [exists] = await db.select({ id: schema.polls.id }).from(schema.polls).where(eq(schema.polls.slug, slug));
    if (!exists) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

