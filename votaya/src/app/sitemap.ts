import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const db = await getDb();
  const polls = await db
    .select({ slug: schema.polls.slug, publishedAt: schema.polls.publishedAt })
    .from(schema.polls)
    .where(eq(schema.polls.status, "published"))
    .orderBy(desc(schema.polls.publishedAt))
    .limit(5000);
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/rankings`, changeFrequency: "hourly" },
    ...CATEGORIES.map((c) => ({ url: `${base}/c/${c.slug}`, changeFrequency: "daily" as const })),
    ...polls.map((p) => ({ url: `${base}/p/${p.slug}`, lastModified: p.publishedAt ?? undefined })),
  ];
}
