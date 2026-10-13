"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { redeem } from "@/lib/points";
import { rateLimit } from "@/lib/rate-limit";
import { rewardsEnabled } from "@/lib/site";

export type RedeemState = { ok?: boolean; code?: string; error?: string };

const MESSAGES = {
  not_found: "Este premio ya no está disponible.",
  out_of_stock: "Se han agotado las unidades de este premio.",
  insufficient: "Aún no tienes puntos suficientes. ¡Sigue votando!",
  disabled: "Los canjes de premios reales todavía no están activos.",
};

export async function redeemAction(_prev: RedeemState, form: FormData): Promise<RedeemState> {
  if (!rewardsEnabled()) return { error: "Los premios todavía no están disponibles." };
  const user = await getCurrentUser();
  if (!user?.profileCompleted) return { error: "Entra en tu cuenta para canjear puntos." };
  const rewardId = String(form.get("rewardId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(rewardId)) return { error: MESSAGES.not_found };
  if (!(await rateLimit(`redeem:${user.id}`, 5, 3600))) return { error: "Demasiados canjes seguidos. Prueba más tarde." };
  const res = await redeem(user.id, rewardId);
  revalidatePath("/recompensas");
  revalidatePath("/perfil");
  return res.ok ? { ok: true, code: res.code } : { error: MESSAGES[res.error] };
}

export async function createRewardAction(form: FormData) {
  await requireAdmin();
  const title = String(form.get("title") ?? "").trim().slice(0, 100);
  const cost = Number(form.get("costPoints"));
  const stock = Number(form.get("stock"));
  if (!title || !Number.isInteger(cost) || cost <= 0 || !Number.isInteger(stock) || stock < 0) return;
  const pollId = String(form.get("pollId") ?? "");
  const sponsorName = String(form.get("sponsor") ?? "").trim().slice(0, 80);
  const db = await getDb();
  let sponsorId: string | null = null;
  if (sponsorName) {
    const [existing] = await db.select().from(schema.sponsors).where(eq(schema.sponsors.name, sponsorName));
    sponsorId = existing?.id ?? (await db.insert(schema.sponsors).values({ name: sponsorName, status: "active" }).returning())[0].id;
  }
  const imageUrl = String(form.get("imageUrl") ?? "").trim();
  await db.insert(schema.rewards).values({
    title,
    description: String(form.get("description") ?? "").trim().slice(0, 300) || null,
    imageUrl: /^https:\/\//.test(imageUrl) ? imageUrl : null,
    costPoints: cost,
    stock,
    isDemo: form.get("isDemo") === "on",
    sponsorId,
    pollId: /^[0-9a-f-]{36}$/i.test(pollId) ? pollId : null,
  });
  if (sponsorId && /^[0-9a-f-]{36}$/i.test(pollId)) {
    await db.update(schema.polls).set({ sponsorId }).where(eq(schema.polls.id, pollId));
  }
  revalidatePath("/admin/premios");
}

export async function updateRedemptionAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const status = form.get("status") === "delivered" ? "delivered" : "cancelled";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [red] = await tx.select().from(schema.redemptions).where(eq(schema.redemptions.id, id));
    if (!red || red.status !== "pending") return;
    await tx.update(schema.redemptions).set({ status }).where(eq(schema.redemptions.id, id));
    if (status === "cancelled") {
      // Devolvemos los puntos y la unidad al stock.
      await tx.insert(schema.pointsLedger).values({ userId: red.userId, amount: red.points, reason: "refund", redemptionId: red.id });
      const [rw] = await tx.select().from(schema.rewards).where(eq(schema.rewards.id, red.rewardId));
      if (rw) await tx.update(schema.rewards).set({ stock: rw.stock + 1 }).where(eq(schema.rewards.id, rw.id));
    }
  });
  revalidatePath("/admin/premios");
}

export async function toggleRewardAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const db = await getDb();
  const [rw] = await db.select().from(schema.rewards).where(eq(schema.rewards.id, id));
  if (rw) await db.update(schema.rewards).set({ active: !rw.active }).where(eq(schema.rewards.id, id));
  revalidatePath("/admin/premios");
}
