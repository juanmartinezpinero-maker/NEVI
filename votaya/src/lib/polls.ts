import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, notInArray, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { normalize, percentages, similarity } from "./text";

const { polls, pollOptions, votes, writeIns } = schema;

export const MIN_SEGMENT = Number(process.env.MIN_SEGMENT_VOTES ?? 20);

export type OptionView = { id: string; label: string; emoji: string | null; imageUrl: string | null; position: number; count: number; pct: number };

export type PollCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  emoji: string | null;
  imageUrl: string | null;
  voteCount: number;
  isDemo: boolean;
  sponsored: boolean;
  sponsorName: string | null;
  reward: { title: string; costPoints: number } | null;
  kind: "popular" | "study";
  allowOther: boolean;
  publishedAt: Date | null;
  options: OptionView[];
};

export type PollDetail = PollCard & {
  description: string | null;
  status: string;
  authorId: string | null;
  createdAt: Date;
};

export type ResultRow = { id: string; label: string; emoji: string | null; count: number; pct: number; isOther?: boolean };

export type Results = {
  total: number;
  verified: number;
  rows: ResultRow[];
  writeIns: { id: string; label: string; count: number }[];
};

const cardColumns = {
  id: polls.id,
  slug: polls.slug,
  title: polls.title,
  category: polls.category,
  emoji: polls.emoji,
  imageUrl: polls.imageUrl,
  voteCount: polls.voteCount,
  isDemo: polls.isDemo,
  sponsorId: polls.sponsorId,
  kind: polls.kind,
  allowOther: polls.allowOther,
  publishedAt: polls.publishedAt,
};

async function attachOptions<T extends { id: string; sponsorId: string | null }>(
  rows: T[],
): Promise<(Omit<T, "sponsorId"> & Pick<PollCard, "sponsored" | "sponsorName" | "reward" | "options">)[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const ids = rows.map((r) => r.id);
  const sponsorIds = [...new Set(rows.map((r) => r.sponsorId).filter(Boolean))] as string[];
  const [opts, counts, sponsors, rewards] = await Promise.all([
    db.select().from(pollOptions).where(inArray(pollOptions.pollId, ids)).orderBy(asc(pollOptions.position)),
    db
      .select({ pollId: votes.pollId, optionId: votes.optionId, n: sql<number>`count(*)::int` })
      .from(votes)
      .where(inArray(votes.pollId, ids))
      .groupBy(votes.pollId, votes.optionId),
    sponsorIds.length ? db.select().from(schema.sponsors).where(inArray(schema.sponsors.id, sponsorIds)) : [],
    db
      .select({ pollId: schema.rewards.pollId, title: schema.rewards.title, costPoints: schema.rewards.costPoints })
      .from(schema.rewards)
      .where(and(inArray(schema.rewards.pollId, ids), eq(schema.rewards.active, true))),
  ]);
  return rows.map(({ sponsorId, ...r }) => {
    const mine = opts.filter((o) => o.pollId === r.id);
    const total = counts.filter((c) => c.pollId === r.id).reduce((a, c) => a + c.n, 0);
    const optCounts = mine.map((o) => counts.find((c) => c.pollId === r.id && c.optionId === o.id)?.n ?? 0);
    const pcts = total ? optCounts.map((c) => Math.round((c / total) * 100)) : optCounts.map(() => 0);
    const reward = rewards.find((x) => x.pollId === r.id);
    return {
      ...r,
      sponsored: Boolean(sponsorId),
      sponsorName: sponsors.find((x) => x.id === sponsorId)?.name ?? null,
      reward: reward ? { title: reward.title, costPoints: reward.costPoints } : null,
      options: mine.map((o, i) => ({
        id: o.id,
        label: o.label,
        emoji: o.emoji,
        imageUrl: o.imageUrl,
        position: o.position,
        count: optCounts[i],
        pct: pcts[i],
      })),
    };
  });
}

const published = eq(polls.status, "published");

export async function listPolls(opts: {
  category?: string;
  q?: string;
  order?: "new" | "top";
  limit?: number;
  offset?: number;
  excludeIds?: string[];
  sponsored?: boolean;
}): Promise<PollCard[]> {
  const db = await getDb();
  const where: SQL[] = [published];
  if (opts.category) where.push(eq(polls.category, opts.category));
  if (opts.sponsored !== undefined) where.push(opts.sponsored ? isNotNull(polls.sponsorId) : sql`${polls.sponsorId} is null`);
  if (opts.excludeIds?.length) where.push(notInArray(polls.id, opts.excludeIds));
  if (opts.q) {
    const raw = `%${opts.q.replace(/[%_\\]/g, "")}%`;
    const norm = `%${normalize(opts.q)}%`;
    const optionMatch = db
      .select({ id: pollOptions.pollId })
      .from(pollOptions)
      .where(ilike(pollOptions.normalizedLabel, norm));
    where.push(or(ilike(polls.title, raw), ilike(polls.normalizedTitle, norm), inArray(polls.id, optionMatch))!);
  }
  const rows = await db
    .select(cardColumns)
    .from(polls)
    .where(and(...where))
    .orderBy(opts.order === "top" ? desc(polls.voteCount) : desc(polls.publishedAt))
    .limit(opts.limit ?? 12)
    .offset(opts.offset ?? 0);
  return attachOptions(rows);
}

/** Encuestas con más votos en las últimas `hours` horas. */
export async function listTrending(hours = 24, limit = 8): Promise<(PollCard & { recentVotes: number })[]> {
  const db = await getDb();
  const since = new Date(Date.now() - hours * 3600_000);
  const recent = db
    .select({ pollId: votes.pollId, n: sql<number>`count(*)::int`.as("n") })
    .from(votes)
    .where(gte(votes.createdAt, since))
    .groupBy(votes.pollId)
    .as("recent");
  const rows = await db
    .select({ ...cardColumns, recentVotes: recent.n })
    .from(polls)
    .innerJoin(recent, eq(recent.pollId, polls.id))
    .where(and(published, sql`${polls.sponsorId} is null`))
    .orderBy(desc(recent.n), desc(polls.voteCount))
    .limit(limit);
  const withOpts = await attachOptions(rows);
  if (withOpts.length >= Math.min(limit, 4)) return withOpts;
  // Poca actividad reciente: completamos con las más votadas.
  const fill = await listPolls({ order: "top", limit: limit - withOpts.length, excludeIds: withOpts.map((p) => p.id), sponsored: false });
  return [...withOpts, ...fill.map((p) => ({ ...p, recentVotes: 0 }))];
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Pregunta del día: la marcada por el admin para hoy; si no, la tendencia del día. */
export async function getFeaturedPoll(): Promise<PollCard | null> {
  const db = await getDb();
  const rows = await db
    .select(cardColumns)
    .from(polls)
    .where(and(published, eq(polls.featuredOn, todayISO())))
    .limit(1);
  if (rows.length) return (await attachOptions(rows))[0];
  const trending = await listTrending(24, 1);
  return trending[0] ?? null;
}

export async function getPollBySlug(slug: string): Promise<PollDetail | null> {
  const db = await getDb();
  const rows = await db
    .select({ ...cardColumns, description: polls.description, status: polls.status, authorId: polls.authorId, createdAt: polls.createdAt })
    .from(polls)
    .where(eq(polls.slug, slug))
    .limit(1);
  if (!rows.length) return null;
  return (await attachOptions(rows))[0];
}

export async function getResults(pollId: string): Promise<Results> {
  const db = await getDb();
  const [opts, counts, wi] = await Promise.all([
    db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId)).orderBy(asc(pollOptions.position)),
    db
      .select({
        optionId: votes.optionId,
        n: sql<number>`count(*)::int`,
        v: sql<number>`count(*) filter (where ${votes.verified})::int`,
      })
      .from(votes)
      .where(eq(votes.pollId, pollId))
      .groupBy(votes.optionId),
    db
      .select({ id: writeIns.id, label: writeIns.label, hidden: writeIns.hidden, n: sql<number>`count(${votes.id})::int` })
      .from(writeIns)
      .innerJoin(votes, eq(votes.writeInId, writeIns.id))
      .where(eq(writeIns.pollId, pollId))
      .groupBy(writeIns.id)
      .orderBy(desc(sql`count(${votes.id})`)),
  ]);
  const byOption = new Map(counts.map((c) => [c.optionId, c.n]));
  const otherCount = counts.find((c) => c.optionId === null)?.n ?? 0;
  const base: Omit<ResultRow, "pct">[] = opts.map((o) => ({ id: o.id, label: o.label, emoji: o.emoji, count: byOption.get(o.id) ?? 0 }));
  if (otherCount > 0) base.push({ id: "other", label: "Otra respuesta", emoji: "✍️", count: otherCount, isOther: true });
  const pcts = percentages(base.map((b) => b.count));
  return {
    total: counts.reduce((a, c) => a + c.n, 0),
    verified: counts.reduce((a, c) => a + c.v, 0),
    rows: base.map((b, i) => ({ ...b, pct: pcts[i] })),
    writeIns: wi.filter((w) => !w.hidden).map((w) => ({ id: w.id, label: w.label, count: w.n })),
  };
}

export type Dimension = "country" | "ageRange" | "gender";

export type Segment = { key: string; total: number; rows: { id: string; pct: number; count: number }[]; winner: string };

/** Resultados por segmento, solo con votos verificados y si hay muestra suficiente. */
export async function getSegments(pollId: string, dim: Dimension): Promise<{ segments: Segment[]; hidden: number }> {
  const db = await getDb();
  const col = votes[dim];
  const rows = await db
    .select({ key: col, optionId: votes.optionId, n: sql<number>`count(*)::int` })
    .from(votes)
    .where(and(eq(votes.pollId, pollId), eq(votes.verified, true), isNotNull(col)))
    .groupBy(col, votes.optionId);
  const grouped = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const k = r.key as string;
    if (!grouped.has(k)) grouped.set(k, new Map());
    grouped.get(k)!.set(r.optionId ?? "other", r.n);
  }
  const segments: Segment[] = [];
  let hidden = 0;
  for (const [key, m] of grouped) {
    const entries = [...m.entries()];
    const total = entries.reduce((a, [, n]) => a + n, 0);
    if (total < MIN_SEGMENT) {
      hidden++;
      continue;
    }
    const pcts = percentages(entries.map(([, n]) => n));
    const segRows = entries.map(([id, count], i) => ({ id, count, pct: pcts[i] })).sort((a, b) => b.count - a.count);
    segments.push({ key, total, rows: segRows, winner: segRows[0].id });
  }
  segments.sort((a, b) => b.total - a.total);
  return { segments, hidden };
}

/** Voto existente de este usuario/dispositivo en una encuesta. */
export async function findExistingVote(pollId: string, userId: string | null, anonId: string | null) {
  const keys = [userId && `u:${userId}`, anonId && `a:${anonId}`].filter(Boolean) as string[];
  if (!keys.length) return null;
  const db = await getDb();
  const rows = await db
    .select({ optionId: votes.optionId, writeInId: votes.writeInId })
    .from(votes)
    .where(and(eq(votes.pollId, pollId), inArray(votes.voterKey, keys)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVotedPollIds(userId: string | null, anonId: string | null): Promise<Set<string>> {
  const keys = [userId && `u:${userId}`, anonId && `a:${anonId}`].filter(Boolean) as string[];
  if (!keys.length) return new Set();
  const db = await getDb();
  const rows = await db.select({ pollId: votes.pollId }).from(votes).where(inArray(votes.voterKey, keys));
  return new Set(rows.map((r) => r.pollId));
}

/** Recomendaciones: encuestas no votadas, priorizando las categorías favoritas. */
export async function getRecommended(userId: string | null, anonId: string | null, limit = 6, excludeId?: string): Promise<PollCard[]> {
  const db = await getDb();
  const voted = await getVotedPollIds(userId, anonId);
  if (excludeId) voted.add(excludeId);
  const keys = [userId && `u:${userId}`, anonId && `a:${anonId}`].filter(Boolean) as string[];
  let favorite: string[] = [];
  if (keys.length) {
    const fav = await db
      .select({ category: polls.category, n: sql<number>`count(*)::int` })
      .from(votes)
      .innerJoin(polls, eq(polls.id, votes.pollId))
      .where(inArray(votes.voterKey, keys))
      .groupBy(polls.category)
      .orderBy(desc(sql`count(*)`))
      .limit(2);
    favorite = fav.map((f) => f.category);
  }
  const exclude = [...voted];
  const picks: PollCard[] = [];
  for (const category of favorite) {
    const more = await listPolls({ category, order: "top", limit: 3, excludeIds: [...exclude, ...picks.map((p) => p.id)], sponsored: false });
    picks.push(...more);
  }
  if (picks.length < limit) {
    picks.push(
      ...(await listPolls({ order: "top", limit: limit - picks.length, excludeIds: [...exclude, ...picks.map((p) => p.id)], sponsored: false })),
    );
  }
  return picks.slice(0, limit);
}

export async function getUserHistory(userId: string) {
  const db = await getDb();
  return db
    .select({
      slug: polls.slug,
      title: polls.title,
      emoji: polls.emoji,
      category: polls.category,
      option: pollOptions.label,
      writeIn: writeIns.label,
      votedAt: votes.createdAt,
    })
    .from(votes)
    .innerJoin(polls, eq(polls.id, votes.pollId))
    .leftJoin(pollOptions, eq(pollOptions.id, votes.optionId))
    .leftJoin(writeIns, eq(writeIns.id, votes.writeInId))
    .where(eq(votes.userId, userId))
    .orderBy(desc(votes.createdAt))
    .limit(200);
}

/** Participación por país (votos con país conocido). */
export async function getCountryRanking(limit = 15, sinceDays?: number) {
  const db = await getDb();
  const where: SQL[] = [isNotNull(votes.country)];
  if (sinceDays) where.push(gte(votes.createdAt, new Date(Date.now() - sinceDays * 864e5)));
  return db
    .select({ country: votes.country, n: sql<number>`count(*)::int` })
    .from(votes)
    .where(and(...where))
    .groupBy(votes.country)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function getSiteTotals() {
  const db = await getDb();
  const [row] = await db
    .select({
      votes: sql<number>`(select count(*)::int from ${votes})`,
      polls: sql<number>`(select count(*)::int from ${polls} where ${polls.status} = 'published')`,
      countries: sql<number>`(select count(distinct ${votes.country})::int from ${votes})`,
    })
    .from(sql`(select 1) as one`);
  return row;
}

/** Encuestas parecidas por título (detección de duplicados al proponer). */
export async function findSimilarPolls(title: string, limit = 3) {
  const norm = normalize(title);
  if (norm.length < 4) return [];
  const words = norm.split(" ").filter((w) => w.length >= 4).slice(0, 4);
  if (!words.length) return [];
  const db = await getDb();
  const candidates = await db
    .select({ id: polls.id, slug: polls.slug, title: polls.title, status: polls.status, normalizedTitle: polls.normalizedTitle })
    .from(polls)
    .where(and(inArray(polls.status, ["published", "pending"]), or(...words.map((w) => ilike(polls.normalizedTitle, `%${w}%`)))!))
    .limit(50);
  return candidates
    .map((c) => {
      const a = new Set(norm.split(" "));
      const b = new Set(c.normalizedTitle.split(" "));
      const overlap = [...a].filter((w) => b.has(w)).length / Math.max(a.size, b.size);
      return { ...c, score: Math.max(overlap, similarity(norm, c.normalizedTitle)) };
    })
    .filter((c) => c.score >= 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
