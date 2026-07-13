"use server";

import { redirect } from "next/navigation";
import { updateProduct } from "@/lib/products";

export async function updateProductAction(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "🛒";
  const cycleDays = Number(formData.get("cycleDays"));
  const lastPurchasedAt = String(formData.get("lastPurchasedAt") ?? "");

  if (!name || !cycleDays || !lastPurchasedAt) {
    throw new Error("Faltan campos obligatorios");
  }

  await updateProduct(id, { name, icon, cycleDays, lastPurchasedAt });
  redirect("/");
}
