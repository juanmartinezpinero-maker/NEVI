"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";

const { sponsors, sponsorMembers, users, polls } = schema;
const uuid = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(s)) throw new Error("id inválido");
  return s;
};

/** Alta de una marca. */
export async function createBrandAction(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const email = z.string().trim().email().safeParse(form.get("contactEmail"));
  if (name.length < 2) return;
  const db = await getDb();
  await db.insert(sponsors).values({ name, contactEmail: email.success ? email.data.toLowerCase() : null, status: "active" });
  revalidatePath("/admin/marcas");
}

/** Da acceso al panel de una marca a un email. Si la persona aún no tiene cuenta, se crea y entra con su código. */
export async function addBrandMemberAction(form: FormData) {
  await requireAdmin();
  const sponsorId = uuid(form.get("sponsorId"));
  const email = z.string().trim().email().safeParse(form.get("email"));
  if (!email.success) return;
  const db = await getDb();
  const address = email.data.toLowerCase();
  await db.insert(users).values({ email: address }).onConflictDoNothing();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, address));
  await db
    .insert(sponsorMembers)
    .values({ sponsorId, userId: user.id, role: form.get("role") === "owner" ? "owner" : "member" })
    .onConflictDoNothing();
  revalidatePath("/admin/marcas");
}

export async function removeBrandMemberAction(form: FormData) {
  await requireAdmin();
  const db = await getDb();
  await db
    .delete(sponsorMembers)
    .where(and(eq(sponsorMembers.sponsorId, uuid(form.get("sponsorId"))), eq(sponsorMembers.userId, uuid(form.get("userId")))));
  revalidatePath("/admin/marcas");
}

export async function setBrandStatusAction(form: FormData) {
  await requireAdmin();
  const status = String(form.get("status"));
  if (!["lead", "active", "paused"].includes(status)) return;
  const db = await getDb();
  await db
    .update(sponsors)
    .set({ status: status as "lead" | "active" | "paused" })
    .where(eq(sponsors.id, uuid(form.get("sponsorId"))));
  revalidatePath("/admin/marcas");
}

/** Asigna (o quita) la marca de una encuesta existente. */
export async function setPollBrandAction(form: FormData) {
  await requireAdmin();
  const pollId = uuid(form.get("pollId"));
  const raw = String(form.get("sponsorId") ?? "");
  const sponsorId = raw ? uuid(raw) : null;
  const visibility = form.get("visibility") === "private" ? "private" : "public";
  const db = await getDb();
  await db.update(polls).set({ sponsorId, visibility: sponsorId ? visibility : "public" }).where(eq(polls.id, pollId));
  revalidatePath("/admin", "layout");
}
