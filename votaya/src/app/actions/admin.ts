"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { todayISO } from "@/lib/polls";
import { normalize, slugify } from "@/lib/text";

const { polls, pollOptions, votes, writeIns, shareLinks } = schema;

const id = (form: FormData, key = "id") => {
  const v = String(form.get(key) ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("id inválido");
  return v;
};

export async function moderatePollAction(form: FormData) {
  await requireAdmin();
  const pollId = id(form);
  const decision = form.get("decision");
  const db = await getDb();
  if (decision === "approve") {
    await db.update(polls).set({ status: "published", publishedAt: new Date(), moderationNote: null }).where(eq(polls.id, pollId));
  } else if (decision === "reject") {
    await db
      .update(polls)
      .set({ status: "rejected", moderationNote: String(form.get("note") ?? "").slice(0, 300) || "No cumple las normas" })
      .where(eq(polls.id, pollId));
  }
  revalidatePath("/admin", "layout");
}

export async function updatePollAction(form: FormData) {
  await requireAdmin();
  const pollId = id(form);
  const db = await getDb();
  const action = String(form.get("action"));
  if (action === "feature") await db.update(polls).set({ featuredOn: todayISO() }).where(eq(polls.id, pollId));
  if (action === "unfeature") await db.update(polls).set({ featuredOn: null }).where(eq(polls.id, pollId));
  if (action === "archive") await db.update(polls).set({ status: "archived" }).where(eq(polls.id, pollId));
  if (action === "publish") await db.update(polls).set({ status: "published", publishedAt: sql`coalesce(${polls.publishedAt}, now())` }).where(eq(polls.id, pollId));
  if (action === "delete") await db.delete(polls).where(eq(polls.id, pollId));
  if (action === "edit") {
    const title = String(form.get("title") ?? "").trim();
    if (title.length >= 5) await db.update(polls).set({ title, normalizedTitle: normalize(title) }).where(eq(polls.id, pollId));
  }
  revalidatePath("/admin", "layout");
}

/** Convierte una respuesta libre agrupada en opción oficial y mueve sus votos. */
export async function promoteWriteInAction(form: FormData) {
  await requireAdmin();
  const writeInId = id(form);
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [wi] = await tx.select().from(writeIns).where(eq(writeIns.id, writeInId));
    if (!wi) return;
    const [{ maxPos }] = await tx
      .select({ maxPos: sql<number>`coalesce(max(${pollOptions.position}), 0)::int` })
      .from(pollOptions)
      .where(eq(pollOptions.pollId, wi.pollId));
    const [opt] = await tx
      .insert(pollOptions)
      .values({ pollId: wi.pollId, label: wi.label, normalizedLabel: normalize(wi.label), position: maxPos + 1, fromWriteIn: true })
      .returning({ id: pollOptions.id });
    await tx.update(votes).set({ optionId: opt.id, writeInId: null }).where(eq(votes.writeInId, wi.id));
    await tx.delete(writeIns).where(eq(writeIns.id, wi.id));
  });
  revalidatePath("/admin", "layout");
}

/** Une una respuesta libre con otra (p. ej. variantes que el sistema no agrupó). */
export async function mergeWriteInAction(form: FormData) {
  await requireAdmin();
  const from = id(form);
  const into = id(form, "into");
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [a] = await tx.select().from(writeIns).where(eq(writeIns.id, from));
    const [b] = await tx.select().from(writeIns).where(and(eq(writeIns.id, into), eq(writeIns.pollId, a?.pollId ?? "")));
    if (!a || !b || a.id === b.id) return;
    await tx.update(votes).set({ writeInId: b.id }).where(eq(votes.writeInId, a.id));
    await tx.delete(writeIns).where(eq(writeIns.id, a.id));
  });
  revalidatePath("/admin", "layout");
}

export async function toggleWriteInAction(form: FormData) {
  await requireAdmin();
  const writeInId = id(form);
  const db = await getDb();
  await db.update(writeIns).set({ hidden: sql`not ${writeIns.hidden}` }).where(eq(writeIns.id, writeInId));
  revalidatePath("/admin", "layout");
}

export async function createShareLinkAction(form: FormData) {
  await requireAdmin();
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  const code = slugify(String(form.get("code") ?? "") || label).slice(0, 40);
  const pollId = String(form.get("pollId") ?? "");
  if (!label || code.length < 2) return;
  const db = await getDb();
  await db
    .insert(shareLinks)
    .values({ label, code, pollId: /^[0-9a-f-]{36}$/i.test(pollId) ? pollId : null })
    .onConflictDoNothing();
  revalidatePath("/admin/enlaces");
}

export async function setRoleAction(form: FormData) {
  const me = await requireAdmin();
  const userId = id(form);
  if (userId === me.id) return;
  const role = form.get("role") === "admin" ? "admin" : "user";
  const db = await getDb();
  await db.update(schema.users).set({ role }).where(eq(schema.users.id, userId));
  revalidatePath("/admin/usuarios");
}
