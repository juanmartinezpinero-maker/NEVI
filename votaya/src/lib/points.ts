import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema, type DB } from "@/db";
import { randomToken } from "./crypto";

const { pointsLedger, rewards, redemptions, votes } = schema;

export const POINTS = { vote: 10, welcome: 50, pollApproved: 100 } as const;
/** Tope diario de puntos por votar: frena el "farmeo" de puntos con votos sin pensar. */
export const DAILY_VOTE_CAP = Number(process.env.POINTS_DAILY_CAP ?? 200);

/** demo = solo premios ficticios con cupones sin valor; live = premios reales (requiere validación legal previa). */
export const rewardsMode = () => (process.env.REWARDS_MODE === "live" ? "live" : "demo");

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
type Conn = DB | Tx;

export const LEVELS = [
  { min: 0, name: "Novato", emoji: "🌱" },
  { min: 10, name: "Opinador", emoji: "💬" },
  { min: 50, name: "Experto", emoji: "🎯" },
  { min: 150, name: "Influencer", emoji: "🔥" },
  { min: 500, name: "Leyenda", emoji: "👑" },
];

export function levelFor(votes: number) {
  const idx = LEVELS.findLastIndex((l) => votes >= l.min);
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const progress = next ? Math.round(((votes - current.min) / (next.min - current.min)) * 100) : 100;
  return { ...current, next, progress };
}

async function earnedToday(conn: Conn, userId: string) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const [{ n }] = await conn
    .select({ n: sql<number>`coalesce(sum(${pointsLedger.amount}), 0)::int` })
    .from(pointsLedger)
    .where(and(eq(pointsLedger.userId, userId), eq(pointsLedger.reason, "vote"), gte(pointsLedger.createdAt, since)));
  return n;
}

/** Suma puntos por votar (una vez por encuesta, con tope diario). Devuelve los puntos ganados. */
export async function awardVotePoints(userId: string, pollId: string, conn?: Conn): Promise<number> {
  const db = conn ?? (await getDb());
  if ((await earnedToday(db, userId)) + POINTS.vote > DAILY_VOTE_CAP) return 0;
  const res = await db
    .insert(pointsLedger)
    .values({ userId, pollId, amount: POINTS.vote, reason: "vote" })
    .onConflictDoNothing()
    .returning({ id: pointsLedger.id });
  return res.length ? POINTS.vote : 0;
}

export async function awardOnce(userId: string, reason: "welcome" | "poll_approved", amount: number, pollId?: string) {
  const db = await getDb();
  if (reason === "welcome") {
    const [exists] = await db
      .select({ id: pointsLedger.id })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.userId, userId), eq(pointsLedger.reason, "welcome")));
    if (exists) return 0;
  }
  const res = await db.insert(pointsLedger).values({ userId, amount, reason, pollId }).onConflictDoNothing().returning();
  return res.length ? amount : 0;
}

export async function getBalance(userId: string, conn?: Conn): Promise<number> {
  const db = conn ?? (await getDb());
  const [{ n }] = await db
    .select({ n: sql<number>`coalesce(sum(${pointsLedger.amount}), 0)::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId));
  return n;
}

export async function getUserStats(userId: string) {
  const db = await getDb();
  const [[{ voteCount }], balance, history] = await Promise.all([
    db.select({ voteCount: sql<number>`count(*)::int` }).from(votes).where(eq(votes.userId, userId)),
    getBalance(userId),
    db.select().from(pointsLedger).where(eq(pointsLedger.userId, userId)).orderBy(desc(pointsLedger.createdAt)).limit(30),
  ]);
  return { voteCount, balance, level: levelFor(voteCount), history };
}

export async function listRewards() {
  const db = await getDb();
  return db
    .select({
      id: rewards.id,
      title: rewards.title,
      description: rewards.description,
      imageUrl: rewards.imageUrl,
      costPoints: rewards.costPoints,
      stock: rewards.stock,
      isDemo: rewards.isDemo,
      sponsor: schema.sponsors.name,
      pollSlug: schema.polls.slug,
    })
    .from(rewards)
    .leftJoin(schema.sponsors, eq(schema.sponsors.id, rewards.sponsorId))
    .leftJoin(schema.polls, eq(schema.polls.id, rewards.pollId))
    .where(eq(rewards.active, true))
    .orderBy(rewards.costPoints);
}

export async function getUserRedemptions(userId: string) {
  const db = await getDb();
  return db
    .select({ id: redemptions.id, code: redemptions.code, status: redemptions.status, createdAt: redemptions.createdAt, title: rewards.title, isDemo: rewards.isDemo })
    .from(redemptions)
    .innerJoin(rewards, eq(rewards.id, redemptions.rewardId))
    .where(eq(redemptions.userId, userId))
    .orderBy(desc(redemptions.createdAt));
}

export type RedeemError = "not_found" | "out_of_stock" | "insufficient" | "disabled";

/** Canjea puntos por un premio de forma atómica (saldo, stock y cupón en una transacción). */
export async function redeem(userId: string, rewardId: string): Promise<{ ok: true; code: string } | { ok: false; error: RedeemError }> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [reward] = await tx.select().from(rewards).where(eq(rewards.id, rewardId)).for("update");
    if (!reward || !reward.active) return { ok: false as const, error: "not_found" as const };
    if (!reward.isDemo && rewardsMode() !== "live") return { ok: false as const, error: "disabled" as const };
    if (reward.stock <= 0) return { ok: false as const, error: "out_of_stock" as const };
    // Bloqueo por usuario para que dos canjes simultáneos no gasten el mismo saldo.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    if ((await getBalance(userId, tx)) < reward.costPoints) return { ok: false as const, error: "insufficient" as const };
    const code = `${reward.isDemo ? "DEMO" : "VY"}-${randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, "X").slice(0, 8)}`;
    const [red] = await tx.insert(redemptions).values({ userId, rewardId, points: reward.costPoints, code }).returning();
    await tx.insert(pointsLedger).values({ userId, amount: -reward.costPoints, reason: "redeem", redemptionId: red.id });
    await tx.update(rewards).set({ stock: sql`${rewards.stock} - 1` }).where(eq(rewards.id, rewardId));
    return { ok: true as const, code };
  });
}
