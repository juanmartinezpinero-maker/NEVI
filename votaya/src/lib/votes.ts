import "server-only";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { compactKey, containsBlockedWords, findEquivalent } from "./text";
import { awardVotePoints } from "./points";
import { rateLimit } from "./rate-limit";

const { polls, pollOptions, votes, writeIns } = schema;

export const ANON_VOTE_LIMIT = Number(process.env.ANON_VOTE_LIMIT ?? 10);

export type Voter = {
  userId: string | null;
  anonId: string | null;
  ipHash: string;
  refCode: string | null;
  /** Datos demográficos del perfil (solo usuarios verificados). */
  profile: { country: string | null; ageRange: string | null; gender: string | null } | null;
  geoCountry: string | null;
};

export type VoteError =
  | "not_found"
  | "closed"
  | "already_voted"
  | "invalid_option"
  | "invalid_text"
  | "rate_limited"
  | "needs_signup";

export type VoteResult = { ok: true; optionId: string | null; writeInId: string | null; points: number } | { ok: false; error: VoteError };

/** Resuelve el texto de «Otra»: lo asigna a una opción existente, a una respuesta agrupada o crea una nueva. */
export async function resolveWriteIn(pollId: string, text: string): Promise<{ optionId: string | null; writeInId: string | null } | null> {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 1 || clean.length > 60 || containsBlockedWords(clean) || !compactKey(clean)) return null;
  const db = await getDb();
  const opts = await db.select({ id: pollOptions.id, label: pollOptions.label }).from(pollOptions).where(eq(pollOptions.pollId, pollId));
  const optIdx = findEquivalent(clean, opts.map((o) => o.label));
  if (optIdx >= 0) return { optionId: opts[optIdx].id, writeInId: null };

  const existing = await db.select({ id: writeIns.id, label: writeIns.label }).from(writeIns).where(eq(writeIns.pollId, pollId));
  const wiIdx = findEquivalent(clean, existing.map((w) => w.label));
  if (wiIdx >= 0) return { optionId: null, writeInId: existing[wiIdx].id };

  const normalized = compactKey(clean);
  await db.insert(writeIns).values({ pollId, label: clean, normalized }).onConflictDoNothing();
  const [row] = await db
    .select({ id: writeIns.id })
    .from(writeIns)
    .where(and(eq(writeIns.pollId, pollId), eq(writeIns.normalized, normalized)));
  return { optionId: null, writeInId: row.id };
}

export async function castVote(pollId: string, choice: { optionId?: string; otherText?: string }, voter: Voter): Promise<VoteResult> {
  const db = await getDb();
  const [poll] = await db.select({ id: polls.id, status: polls.status, allowOther: polls.allowOther }).from(polls).where(eq(polls.id, pollId));
  if (!poll) return { ok: false, error: "not_found" };
  if (poll.status !== "published") return { ok: false, error: "closed" };

  const verified = Boolean(voter.userId && voter.profile);
  const voterKey = verified ? `u:${voter.userId}` : voter.anonId ? `a:${voter.anonId}` : null;
  if (!voterKey) return { ok: false, error: "invalid_option" };

  // Antifraude: límites por IP (hash) y por dispositivo.
  if (!(await rateLimit(`vote:ip:${voter.ipHash}`, verified ? 600 : 120, 3600))) return { ok: false, error: "rate_limited" };
  if (!verified) {
    if (!(await rateLimit(`vote:ip-poll:${voter.ipHash}:${pollId}`, 8, 86400))) return { ok: false, error: "rate_limited" };
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(votes)
      .where(and(eq(votes.anonId, voter.anonId!), isNull(votes.userId)));
    if (n >= ANON_VOTE_LIMIT) return { ok: false, error: "needs_signup" };
  }

  // Un voto por persona y encuesta, también si votó antes de registrarse en este dispositivo.
  const keys = [voterKey, voter.anonId ? `a:${voter.anonId}` : null, voter.userId ? `u:${voter.userId}` : null].filter(Boolean) as string[];
  const [dup] = await db
    .select({ id: votes.id })
    .from(votes)
    .where(and(eq(votes.pollId, pollId), inArray(votes.voterKey, keys)))
    .limit(1);
  if (dup) return { ok: false, error: "already_voted" };

  let optionId: string | null = null;
  let writeInId: string | null = null;
  if (choice.otherText !== undefined && choice.otherText !== "") {
    if (!poll.allowOther) return { ok: false, error: "invalid_option" };
    const resolved = await resolveWriteIn(pollId, choice.otherText);
    if (!resolved) return { ok: false, error: "invalid_text" };
    ({ optionId, writeInId } = resolved);
  } else if (choice.optionId) {
    const [opt] = await db
      .select({ id: pollOptions.id })
      .from(pollOptions)
      .where(and(eq(pollOptions.id, choice.optionId), eq(pollOptions.pollId, pollId)));
    if (!opt) return { ok: false, error: "invalid_option" };
    optionId = opt.id;
  } else {
    return { ok: false, error: "invalid_option" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(votes).values({
        pollId,
        optionId,
        writeInId,
        voterKey,
        userId: voter.userId,
        anonId: voter.anonId,
        ipHash: voter.ipHash,
        verified,
        country: voter.profile?.country ?? voter.geoCountry,
        ageRange: voter.profile?.ageRange ?? null,
        gender: voter.profile?.gender ?? null,
        refCode: voter.refCode,
      });
      await tx.update(polls).set({ voteCount: sql`${polls.voteCount} + 1` }).where(eq(polls.id, pollId));
    });
  } catch (err) {
    if (String((err as { code?: string }).code ?? err).includes("23505") || /unique/i.test(String(err))) {
      return { ok: false, error: "already_voted" };
    }
    throw err;
  }
  // Puntos solo para cuentas verificadas (los anónimos los reciben al registrarse).
  const points = verified && voter.userId ? await awardVotePoints(voter.userId, pollId) : 0;
  return { ok: true, optionId, writeInId, points };
}

/**
 * Al registrarse o entrar, los votos anónimos del dispositivo pasan a la cuenta y quedan verificados.
 * Si la cuenta ya había votado esa encuesta, el voto anónimo se descarta.
 */
export async function claimAnonVotes(userId: string, anonId: string | null) {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) return 0;
  const claimed = await db.transaction(async (tx) => {
    let claimed = 0;
    if (anonId) {
      const anon = await tx.select().from(votes).where(and(eq(votes.anonId, anonId), isNull(votes.userId)));
      for (const v of anon) {
        const [mine] = await tx
          .select({ id: votes.id })
          .from(votes)
          .where(and(eq(votes.pollId, v.pollId), eq(votes.voterKey, `u:${userId}`)));
        if (mine) {
          await tx.delete(votes).where(eq(votes.id, v.id));
          await tx.update(polls).set({ voteCount: sql`greatest(${polls.voteCount} - 1, 0)` }).where(eq(polls.id, v.pollId));
        } else {
          await tx.update(votes).set({ voterKey: `u:${userId}`, userId }).where(eq(votes.id, v.id));
          claimed++;
        }
      }
    }
    if (user.profileCompleted) {
      await tx
        .update(votes)
        .set({ verified: true, country: user.country, ageRange: user.ageRange, gender: user.gender })
        .where(eq(votes.userId, userId));
    }
    return claimed;
  });
  // Los votos hechos antes de registrarse también suman puntos (respetando el tope diario).
  if (user.profileCompleted) {
    const pending = await db
      .select({ pollId: votes.pollId })
      .from(votes)
      .leftJoin(
        schema.pointsLedger,
        and(eq(schema.pointsLedger.userId, userId), eq(schema.pointsLedger.pollId, votes.pollId), eq(schema.pointsLedger.reason, "vote")),
      )
      .where(and(eq(votes.userId, userId), isNull(schema.pointsLedger.id)));
    for (const { pollId } of pending) if (!(await awardVotePoints(userId, pollId))) break;
  }
  return claimed;
}
