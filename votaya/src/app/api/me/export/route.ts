import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserHistory } from "@/lib/polls";

/** Derecho de acceso/portabilidad (RGPD): exporta los datos del usuario. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });
  const db = await getDb();
  const polls = await db
    .select({ slug: schema.polls.slug, title: schema.polls.title, status: schema.polls.status, createdAt: schema.polls.createdAt })
    .from(schema.polls)
    .where(eq(schema.polls.authorId, user.id));
  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      ageRange: user.ageRange,
      gender: user.gender,
      country: user.country,
      marketingOptIn: user.marketingOptIn,
      termsAcceptedAt: user.termsAcceptedAt,
      createdAt: user.createdAt,
    },
    votes: await getUserHistory(user.id),
    proposedPolls: polls,
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="votaya-mis-datos.json"' },
  });
}
