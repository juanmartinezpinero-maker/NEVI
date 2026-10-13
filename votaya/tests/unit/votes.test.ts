/**
 * Pruebas de integración del motor de votos contra Postgres real.
 * Requiere TEST_DATABASE_URL (p. ej. postgres://votaya:votaya@localhost:5432/votaya_test); si no, se omiten.
 */
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("motor de votos", async () => {
  process.env.DATABASE_URL = url;
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { eq } = await import("drizzle-orm");
  const { getDb, schema } = await import("@/db/connect");
  const { castVote, claimAnonVotes, ANON_VOTE_LIMIT } = await import("@/lib/votes");
  const { getResults, getSegments } = await import("@/lib/polls");

  let pollId = "";
  let optA = "";
  let optB = "";
  const anon = (id: string, ip = "ip1") => ({ userId: null, anonId: id, ipHash: ip, refCode: null, profile: null, geoCountry: "ES" });

  beforeAll(async () => {
    const client = postgres(url!, { max: 1, onnotice: () => {} });
    await client`drop schema if exists public cascade`;
    await client`drop schema if exists drizzle cascade`;
    await client`create schema public`;
    await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "drizzle") });
    await client.end();
    const db = await getDb();
    const [poll] = await db
      .insert(schema.polls)
      .values({ slug: "test", title: "¿Test?", normalizedTitle: "test", category: "comida", status: "published", allowOther: true })
      .returning();
    pollId = poll.id;
    const opts = await db
      .insert(schema.pollOptions)
      .values([
        { pollId, label: "Coca-Cola", normalizedLabel: "coca cola", position: 0 },
        { pollId, label: "Pepsi", normalizedLabel: "pepsi", position: 1 },
      ])
      .returning();
    [optA, optB] = [opts[0].id, opts[1].id];
  });

  it("registra un voto y devuelve resultados", async () => {
    const r = await castVote(pollId, { optionId: optA }, anon("dev1"));
    expect(r.ok).toBe(true);
    const res = await getResults(pollId);
    expect(res.total).toBe(1);
    expect(res.rows.find((x) => x.id === optA)?.pct).toBe(100);
  });

  it("impide votar dos veces desde el mismo dispositivo", async () => {
    const r = await castVote(pollId, { optionId: optB }, anon("dev1"));
    expect(r).toEqual({ ok: false, error: "already_voted" });
  });

  it("«Otra» que coincide con una opción cuenta para esa opción", async () => {
    const r = await castVote(pollId, { otherText: "coca cola" }, anon("dev2"));
    expect(r.ok && r.optionId).toBe(optA);
  });

  it("agrupa respuestas libres equivalentes", async () => {
    const a = await castVote(pollId, { otherText: "Fanta Naranja" }, anon("dev3"));
    const b = await castVote(pollId, { otherText: "fanta naranja!!" }, anon("dev4"));
    const c = await castVote(pollId, { otherText: "Fanta naranjas" }, anon("dev5"));
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(b.writeInId).toBe(a.writeInId);
      expect(c.writeInId).toBe(a.writeInId);
    }
    const res = await getResults(pollId);
    expect(res.writeIns[0]).toMatchObject({ label: "Fanta Naranja", count: 3 });
  });

  it("rechaza texto ofensivo y opciones de otra encuesta", async () => {
    expect(await castVote(pollId, { otherText: "gilipollas" }, anon("dev6"))).toEqual({ ok: false, error: "invalid_text" });
    expect(await castVote(pollId, { optionId: "00000000-0000-0000-0000-000000000000" }, anon("dev6"))).toEqual({ ok: false, error: "invalid_option" });
  });

  it("limita votos por IP en la misma encuesta (antifraude)", async () => {
    const results = [];
    for (let i = 0; i < 10; i++) results.push(await castVote(pollId, { optionId: optB }, anon(`flood${i}`, "ip-flood")));
    expect(results.filter((r) => r.ok).length).toBe(8);
    expect(results.at(-1)).toEqual({ ok: false, error: "rate_limited" });
  });

  it("al registrarse, el voto anónimo pasa a la cuenta verificada con demografía", async () => {
    const db = await getDb();
    const [user] = await db
      .insert(schema.users)
      .values({ email: "t@t.com", profileCompleted: true, country: "MX", ageRange: "25-34", gender: "mujer" })
      .returning();
    await claimAnonVotes(user.id, "dev1");
    const [v] = await db.select().from(schema.votes).where(eq(schema.votes.userId, user.id));
    expect(v).toMatchObject({ verified: true, country: "MX", voterKey: `u:${user.id}` });
    // Ya no puede volver a votar ni como usuario ni desde el dispositivo.
    const profile = { country: "MX", ageRange: "25-34", gender: "mujer" };
    expect(await castVote(pollId, { optionId: optB }, { ...anon("other-device", "ip9"), userId: user.id, profile })).toEqual({
      ok: false,
      error: "already_voted",
    });
  });

  it("los desgloses ocultan grupos con pocos votos", async () => {
    const seg = await getSegments(pollId, "country");
    expect(seg.segments).toHaveLength(0);
    expect(seg.hidden).toBeGreaterThan(0);
  });

  it("pide registro tras el límite de votos anónimos", async () => {
    const db = await getDb();
    const polls = await db
      .insert(schema.polls)
      .values(
        Array.from({ length: ANON_VOTE_LIMIT + 1 }, (_, i) => ({
          slug: `lim-${i}`,
          title: `Lim ${i}`,
          normalizedTitle: `lim ${i}`,
          category: "comida",
          status: "published" as const,
        })),
      )
      .returning();
    let last;
    for (const p of polls) {
      const [o] = await db.insert(schema.pollOptions).values({ pollId: p.id, label: "A", normalizedLabel: "a" }).returning();
      last = await castVote(p.id, { optionId: o.id }, anon("heavy", "ip-heavy"));
    }
    expect(last).toEqual({ ok: false, error: "needs_signup" });
  });
});
