import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser, type SessionUser } from "./auth";
import { getResults, getSegments, type Dimension } from "./polls";

const { sponsors, sponsorMembers, polls, votes, events } = schema;

export type Brand = { id: string; name: string; status: string; role: "owner" | "member" | "admin" };

/** Marcas a las que tiene acceso un usuario (un administrador las ve todas). */
export const getUserBrands = cache(async (user: SessionUser | null): Promise<Brand[]> => {
  if (!user) return [];
  const db = await getDb();
  if (user.role === "admin") {
    const rows = await db.select({ id: sponsors.id, name: sponsors.name, status: sponsors.status }).from(sponsors).orderBy(asc(sponsors.name));
    return rows.map((r) => ({ ...r, role: "admin" as const }));
  }
  return db
    .select({ id: sponsors.id, name: sponsors.name, status: sponsors.status, role: sponsorMembers.role })
    .from(sponsorMembers)
    .innerJoin(sponsors, eq(sponsors.id, sponsorMembers.sponsorId))
    .where(eq(sponsorMembers.userId, user.id))
    .orderBy(asc(sponsors.name));
});

/** Exige sesión y acceso a la marca; si no lo tiene, 404 (no revelamos que existe). */
export async function requireBrand(sponsorId: string, next: string) {
  const user = await requireUser(next);
  if (!/^[0-9a-f-]{36}$/i.test(sponsorId)) notFound();
  const brand = (await getUserBrands(user)).find((b) => b.id === sponsorId);
  if (!brand) notFound();
  return { user, brand };
}

export async function isBrandMember(user: SessionUser, sponsorId: string) {
  return (await getUserBrands(user)).some((b) => b.id === sponsorId);
}

/** Encuesta de la marca (o 404 si no le pertenece). */
export async function getBrandPoll(sponsorId: string, pollId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(pollId)) notFound();
  const db = await getDb();
  const [poll] = await db
    .select()
    .from(polls)
    .where(and(eq(polls.id, pollId), eq(polls.sponsorId, sponsorId)));
  if (!poll) notFound();
  return poll;
}

/** Resumen de la marca: sus encuestas con votos, visitas y veces compartidas. */
export async function getBrandOverview(sponsorId: string) {
  const db = await getDb();
  const viewsSq = db
    .select({ pollId: events.pollId, n: sql<number>`count(*)::int`.as("views") })
    .from(events)
    .where(eq(events.type, "view"))
    .groupBy(events.pollId)
    .as("v");
  const sharesSq = db
    .select({ pollId: events.pollId, n: sql<number>`count(*)::int`.as("shares") })
    .from(events)
    .where(eq(events.type, "share"))
    .groupBy(events.pollId)
    .as("s");
  const rows = await db
    .select({
      id: polls.id,
      slug: polls.slug,
      title: polls.title,
      status: polls.status,
      visibility: polls.visibility,
      voteCount: polls.voteCount,
      createdAt: polls.createdAt,
      views: sql<number>`coalesce(${viewsSq.n}, 0)::int`,
      shares: sql<number>`coalesce(${sharesSq.n}, 0)::int`,
    })
    .from(polls)
    .leftJoin(viewsSq, eq(viewsSq.pollId, polls.id))
    .leftJoin(sharesSq, eq(sharesSq.pollId, polls.id))
    .where(eq(polls.sponsorId, sponsorId))
    .orderBy(desc(polls.createdAt));
  const totals = rows.reduce((a, r) => ({ votes: a.votes + r.voteCount, views: a.views + r.views, shares: a.shares + r.shares }), {
    votes: 0,
    views: 0,
    shares: 0,
  });
  return { polls: rows, totals };
}

export const SOURCE_LABELS: Record<string, string> = {
  ig: "Instagram",
  tt: "TikTok",
  wa: "WhatsApp",
  x: "X",
  fb: "Facebook",
  tg: "Telegram",
  link: "Enlace copiado",
  native: "Compartir del móvil",
  reto: "Reto por WhatsApp",
  bio: "Bio de redes",
  qr: "Código QR",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
  telegram: "Telegram",
  copy: "Enlace copiado",
  native: "Compartir del móvil",
  more: "Otras apps",
  story_download: "Imagen para Stories",
};

/** Analítica completa de una encuesta: resultados, evolución, desgloses y origen del tráfico. Solo datos agregados. */
export async function getPollAnalytics(pollId: string, days = 30) {
  const db = await getDb();
  const since = new Date(Date.now() - days * 864e5);
  const dims: Dimension[] = ["country", "ageRange", "gender"];
  const [results, segments, byDay, sources, channels, [counts]] = await Promise.all([
    getResults(pollId),
    Promise.all(dims.map((d) => getSegments(pollId, d))),
    db
      .select({ day: sql<string>`to_char(${votes.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
      .from(votes)
      .where(and(eq(votes.pollId, pollId), gte(votes.createdAt, since)))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({ src: sql<string>`coalesce(${events.meta}->>'src', 'directo')`, n: sql<number>`count(*)::int` })
      .from(events)
      .where(and(eq(events.pollId, pollId), eq(events.type, "view")))
      .groupBy(sql`1`)
      .orderBy(desc(sql`2`)),
    db
      .select({ channel: sql<string>`coalesce(${events.meta}->>'channel', 'otro')`, n: sql<number>`count(*)::int` })
      .from(events)
      .where(and(eq(events.pollId, pollId), eq(events.type, "share")))
      .groupBy(sql`1`)
      .orderBy(desc(sql`2`)),
    db
      .select({
        views: sql<number>`(select count(*)::int from ${events} where ${events.pollId} = ${pollId} and ${events.type} = 'view')`,
        shares: sql<number>`(select count(*)::int from ${events} where ${events.pollId} = ${pollId} and ${events.type} = 'share')`,
      })
      .from(sql`(select 1) as one`),
  ]);

  // Serie diaria completa (los días sin votos cuentan como 0).
  const map = new Map(byDay.map((d) => [d.day, d.n]));
  const series: { day: string; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    series.push({ day, n: map.get(day) ?? 0 });
  }

  return {
    results,
    segments: { country: segments[0], ageRange: segments[1], gender: segments[2] },
    series,
    sources: sources.map((s) => ({ ...s, label: SOURCE_LABELS[s.src] ?? (s.src === "directo" ? "Directo / otros" : s.src) })),
    channels: channels.map((c) => ({ ...c, label: CHANNEL_LABELS[c.channel] ?? c.channel })),
    views: counts.views,
    shares: counts.shares,
    last7: series.slice(-7).reduce((acc, d) => acc + d.n, 0),
  };
}
