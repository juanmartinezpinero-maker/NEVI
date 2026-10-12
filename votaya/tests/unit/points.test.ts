/** Integración del programa de puntos y canjes contra Postgres (TEST_DATABASE_URL). */
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("puntos y premios", async () => {
  process.env.DATABASE_URL = url;
  process.env.POINTS_DAILY_CAP = "30";
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { getDb, schema } = await import("@/db/connect");
  const { awardVotePoints, awardOnce, getBalance, redeem, levelFor } = await import("@/lib/points");

  let userId = "";
  const polls: string[] = [];

  beforeAll(async () => {
    const client = postgres(url!, { max: 1, onnotice: () => {} });
    await client`drop schema if exists public cascade`;
    await client`drop schema if exists drizzle cascade`;
    await client`create schema public`;
    await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), "drizzle") });
    await client.end();
    const db = await getDb();
    [{ id: userId }] = await db.insert(schema.users).values({ email: "p@p.com", profileCompleted: true }).returning();
    for (let i = 0; i < 5; i++) {
      const [p] = await db
        .insert(schema.polls)
        .values({ slug: `p${i}`, title: `P${i}`, normalizedTitle: `p${i}`, category: "comida", status: "published" })
        .returning();
      polls.push(p.id);
    }
  });

  it("da 10 puntos por encuesta, una sola vez", async () => {
    expect(await awardVotePoints(userId, polls[0])).toBe(10);
    expect(await awardVotePoints(userId, polls[0])).toBe(0);
    expect(await getBalance(userId)).toBe(10);
  });

  it("respeta el tope diario de puntos por votar", async () => {
    expect(await awardVotePoints(userId, polls[1])).toBe(10);
    expect(await awardVotePoints(userId, polls[2])).toBe(10);
    expect(await awardVotePoints(userId, polls[3])).toBe(0); // tope de 30
    expect(await getBalance(userId)).toBe(30);
  });

  it("el bonus de bienvenida solo se da una vez", async () => {
    expect(await awardOnce(userId, "welcome", 50)).toBe(50);
    expect(await awardOnce(userId, "welcome", 50)).toBe(0);
    expect(await getBalance(userId)).toBe(80);
  });

  it("canjea con saldo suficiente, descuenta puntos y stock", async () => {
    const db = await getDb();
    const [cheap] = await db.insert(schema.rewards).values({ title: "Café", costPoints: 60, stock: 1, isDemo: true }).returning();
    const [pricey] = await db.insert(schema.rewards).values({ title: "Cine", costPoints: 500, stock: 5, isDemo: true }).returning();
    const [real] = await db.insert(schema.rewards).values({ title: "Real", costPoints: 1, stock: 5, isDemo: false }).returning();
    expect(await redeem(userId, pricey.id)).toEqual({ ok: false, error: "insufficient" });
    expect(await redeem(userId, real.id)).toEqual({ ok: false, error: "disabled" });
    const ok = await redeem(userId, cheap.id);
    expect(ok.ok && ok.code).toMatch(/^DEMO-/);
    expect(await getBalance(userId)).toBe(20);
    expect(await redeem(userId, cheap.id)).toEqual({ ok: false, error: "out_of_stock" });
  });

  it("calcula el nivel por número de votos", () => {
    expect(levelFor(0).name).toBe("Novato");
    expect(levelFor(12)).toMatchObject({ name: "Opinador", progress: 5 });
    expect(levelFor(600)).toMatchObject({ name: "Leyenda", next: null, progress: 100 });
  });
});
