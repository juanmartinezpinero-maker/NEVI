"use server";

import { redirect } from "next/navigation";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { track } from "@/lib/analytics";
import { createSession, destroySession, getCurrentUser, isAdminEmail } from "@/lib/auth";
import { hashWithSecret, randomCode, safeEqual } from "@/lib/crypto";
import { AGE_RANGES, COUNTRY_CODES, GENDER_VALUES } from "@/lib/demographics";
import { demoCodesAllowed, sendLoginCode } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { getAnonId, getIpHash, getRefCode } from "@/lib/request";
import { awardOnce, POINTS } from "@/lib/points";
import { claimAnonVotes } from "@/lib/votes";

export type AuthState = { step: "email" | "code"; email?: string; error?: string; devCode?: string; next?: string };

const emailSchema = z.string().trim().toLowerCase().email().max(254);

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const codeHash = (email: string, code: string) => hashWithSecret(`login:${email}:${code}`);

export async function requestCodeAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const next = safeNext(form.get("next"));
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success) return { step: "email", error: "Introduce un email válido.", next };
  const email = parsed.data;
  // Honeypot anti-bots: campo oculto que una persona nunca rellena.
  if (form.get("website")) return { step: "code", email, next };

  const ip = await getIpHash();
  if (!(await rateLimit(`code:email:${email}`, 4, 900)) || !(await rateLimit(`code:ip:${ip}`, 15, 3600))) {
    return { step: "email", email, error: "Has pedido demasiados códigos. Espera unos minutos.", next };
  }
  const code = randomCode();
  const db = await getDb();
  await db.insert(schema.loginCodes).values({
    email,
    codeHash: codeHash(email, code),
    expiresAt: new Date(Date.now() + 10 * 60_000),
  });
  if (await sendLoginCode(email, code)) return { step: "code", email, next };
  // Sin email disponible: en modo demo se muestra el código, nunca para cuentas de administración.
  const adminOk = process.env.NODE_ENV !== "production" || process.env.E2E_ADMIN_DEMO_CODES === "1";
  if (demoCodesAllowed() && (adminOk || !isAdminEmail(email))) return { step: "code", email, next, devCode: code };
  return { step: "email", email, error: "No hemos podido enviar el email. Inténtalo de nuevo en unos minutos.", next };
}

export async function verifyCodeAction(prev: AuthState, form: FormData): Promise<AuthState> {
  const next = safeNext(form.get("next"));
  const parsed = emailSchema.safeParse(form.get("email"));
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  if (!parsed.success) return { step: "email", error: "Introduce un email válido.", next };
  const email = parsed.data;
  const back = { step: "code" as const, email, next, devCode: prev.devCode };
  if (code.length !== 6) return { ...back, error: "El código tiene 6 cifras." };

  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.loginCodes)
    .where(and(eq(schema.loginCodes.email, email), isNull(schema.loginCodes.consumedAt), gt(schema.loginCodes.expiresAt, new Date())))
    .orderBy(desc(schema.loginCodes.createdAt))
    .limit(1);
  if (!row || row.attempts >= 5) return { ...back, error: "El código ha caducado. Pide uno nuevo." };
  if (!safeEqual(row.codeHash, codeHash(email, code))) {
    await db.update(schema.loginCodes).set({ attempts: sql`${schema.loginCodes.attempts} + 1` }).where(eq(schema.loginCodes.id, row.id));
    return { ...back, error: "Código incorrecto." };
  }
  await db.update(schema.loginCodes).set({ consumedAt: new Date() }).where(eq(schema.loginCodes.id, row.id));

  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  const isNew = !user;
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email, role: isAdminEmail(email) ? "admin" : "user", refCode: await getRefCode() })
      .returning();
  } else if (isAdminEmail(email) && user.role !== "admin") {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id));
  }
  await db.update(schema.users).set({ lastSeenAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  const anonId = await getAnonId();
  await claimAnonVotes(user.id, anonId);
  await track(isNew ? "signup" : "login", { userId: user.id, anonId, refCode: user.refCode });

  if (!user.profileCompleted) redirect(`/entrar/perfil?next=${encodeURIComponent(next)}`);
  redirect(next);
}

export type ProfileState = { error?: string };

const profileSchema = z.object({
  ageRange: z.enum(AGE_RANGES),
  gender: z.string().refine((g) => GENDER_VALUES.includes(g)),
  country: z.string().refine((c) => COUNTRY_CODES.includes(c)),
  terms: z.literal("on"),
});

export async function saveProfileAction(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const parsed = profileSchema.safeParse({
    ageRange: form.get("ageRange"),
    gender: form.get("gender"),
    country: form.get("country"),
    terms: form.get("terms"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const msg: Record<string, string> = {
      ageRange: "Elige tu franja de edad.",
      gender: "Elige una opción de género (puedes no indicarlo).",
      country: "Elige tu país de residencia.",
      terms: "Necesitamos que aceptes las condiciones y la política de privacidad.",
    };
    return { error: msg[String(field)] ?? "Revisa los datos." };
  }
  const db = await getDb();
  await db
    .update(schema.users)
    .set({
      ageRange: parsed.data.ageRange,
      gender: parsed.data.gender,
      country: parsed.data.country,
      profileCompleted: true,
      termsAcceptedAt: user.termsAcceptedAt ?? new Date(),
      marketingOptIn: form.get("marketing") === "on",
    })
    .where(eq(schema.users.id, user.id));
  await awardOnce(user.id, "welcome", POINTS.welcome);
  await claimAnonVotes(user.id, await getAnonId());
  redirect(safeNext(form.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function deleteAccountAction(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (form.get("confirm") !== "BORRAR") redirect("/perfil?error=confirm");
  const db = await getDb();
  // Los votos se conservan anonimizados para no alterar resultados publicados.
  await db.transaction(async (tx) => {
    await tx
      .update(schema.votes)
      .set({ userId: null, voterKey: sql`'deleted:' || ${schema.votes.id}`, ageRange: null, gender: null, anonId: null })
      .where(eq(schema.votes.userId, user.id));
    await tx.update(schema.events).set({ userId: null }).where(eq(schema.events.userId, user.id));
    await tx.delete(schema.users).where(eq(schema.users.id, user.id));
  });
  await destroySession();
  redirect("/?cuenta=borrada");
}
