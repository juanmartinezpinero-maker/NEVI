"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { isBrandMember } from "@/lib/brands";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { findSimilarPolls } from "@/lib/polls";
import { rateLimit } from "@/lib/rate-limit";
import { containsBlockedWords, normalize } from "@/lib/text";
import { uniqueSlug } from "@/lib/slug";

export type CreatePollState = { error?: string; similar?: { slug: string; title: string; status: string }[] };

const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "La imagen debe ser una URL https");

const pollSchema = z.object({
  title: z.string().trim().min(8, "La pregunta es demasiado corta").max(120, "La pregunta es demasiado larga"),
  description: z.string().trim().max(300).optional(),
  category: z.string().refine((c) => CATEGORY_SLUGS.includes(c), "Elige una categoría"),
  emoji: z.string().trim().max(8).optional(),
  imageUrl: url.optional(),
  allowOther: z.boolean(),
  options: z
    .array(z.object({ label: z.string().trim().min(1).max(60), emoji: z.string().trim().max(8), imageUrl: url }))
    .min(2, "Añade al menos dos opciones")
    .max(10, "Máximo 10 opciones"),
});

export async function checkSimilarAction(title: string) {
  if (typeof title !== "string" || title.length > 200) return [];
  const res = await findSimilarPolls(title);
  return res.map(({ slug, title, status }) => ({ slug, title, status }));
}

export async function createPollAction(_prev: CreatePollState, form: FormData): Promise<CreatePollState> {
  const user = await getCurrentUser();
  if (!user?.profileCompleted) redirect("/entrar?next=/crear");

  // Encuesta de marca: solo miembros de esa marca (o admin). Privada = solo con enlace, sin moderación previa.
  const sponsorId = String(form.get("sponsorId") ?? "") || null;
  if (sponsorId && !(/^[0-9a-f-]{36}$/i.test(sponsorId) && (await isBrandMember(user, sponsorId)))) {
    return { error: "No tienes acceso a esta marca." };
  }
  const visibility = sponsorId && form.get("visibility") === "private" ? "private" : "public";

  const labels = form.getAll("optionLabel").map(String);
  const emojis = form.getAll("optionEmoji").map(String);
  const images = form.getAll("optionImage").map(String);
  const options = labels
    .map((label, i) => ({ label: label.trim(), emoji: (emojis[i] ?? "").trim(), imageUrl: (images[i] ?? "").trim() }))
    .filter((o) => o.label);

  const parsed = pollSchema.safeParse({
    title: form.get("title"),
    description: String(form.get("description") ?? "") || undefined,
    category: form.get("category"),
    emoji: String(form.get("emoji") ?? "") || undefined,
    imageUrl: String(form.get("imageUrl") ?? "") || undefined,
    allowOther: form.get("allowOther") === "on",
    options,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario" };
  const data = parsed.data;

  const norms = data.options.map((o) => normalize(o.label));
  if (new Set(norms).size !== norms.length) return { error: "Hay opciones repetidas" };
  const allText = [data.title, data.description ?? "", ...data.options.map((o) => o.label)].join(" ");
  if (containsBlockedWords(allText)) return { error: "El texto contiene palabras no permitidas" };

  const similar = visibility === "private" ? [] : await findSimilarPolls(data.title);
  const forced = form.get("confirmDuplicate") === "on";
  if (similar.length && !forced) {
    return {
      error: "Ya existen preguntas muy parecidas. Revísalas o marca la casilla para enviarla igualmente.",
      similar: similar.map(({ slug, title, status }) => ({ slug, title, status })),
    };
  }

  const isAdmin = user.role === "admin";
  const dailyLimit = sponsorId ? 30 : 5;
  if (!isAdmin && !(await rateLimit(`create:${user.id}`, dailyLimit, 86400))) {
    return { error: `Has alcanzado el máximo de ${dailyLimit} encuestas al día.` };
  }
  const publishNow = isAdmin || visibility === "private";

  const db = await getDb();
  const slug = await uniqueSlug(data.title);
  const pollId = await db.transaction(async (tx) => {
    const [poll] = await tx
      .insert(schema.polls)
      .values({
        slug,
        title: data.title,
        normalizedTitle: normalize(data.title),
        description: data.description || null,
        category: data.category,
        emoji: data.emoji || null,
        imageUrl: data.imageUrl || null,
        allowOther: data.allowOther,
        authorId: user.id,
        sponsorId,
        visibility,
        status: publishNow ? "published" : "pending",
        publishedAt: publishNow ? new Date() : null,
      })
      .returning({ id: schema.polls.id });
    await tx.insert(schema.pollOptions).values(
      data.options.map((o, i) => ({
        pollId: poll.id,
        label: o.label,
        normalizedLabel: normalize(o.label),
        emoji: o.emoji || null,
        imageUrl: o.imageUrl || null,
        position: i,
      })),
    );
    return poll.id;
  });
  await track("poll_created", { pollId, userId: user.id });
  if (sponsorId) redirect(`/marca/${sponsorId}/encuestas/${pollId}?creada=1`);
  redirect(isAdmin ? `/p/${slug}` : `/perfil?propuesta=ok`);
}

export type LeadState = { ok?: boolean; error?: string };

export async function businessLeadAction(_prev: LeadState, form: FormData): Promise<LeadState> {
  const company = String(form.get("company") ?? "").trim().slice(0, 120);
  const email = z.string().trim().email().safeParse(form.get("email"));
  if (!company || !email.success) return { error: "Indica empresa y un email válido." };
  const { getIpHash } = await import("@/lib/request");
  if (!(await rateLimit(`lead:${await getIpHash()}`, 5, 3600))) return { error: "Demasiados envíos. Prueba más tarde." };
  const db = await getDb();
  await db.insert(schema.businessLeads).values({
    company,
    email: email.data.toLowerCase(),
    message: String(form.get("message") ?? "").slice(0, 1000) || null,
  });
  return { ok: true };
}
