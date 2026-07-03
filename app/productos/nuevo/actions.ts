"use server";

import { redirect } from "next/navigation";
import { addProduct } from "@/lib/products";

export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "🛒";
  const cycleDays = Number(formData.get("cycleDays"));
  const lastPurchasedAt = String(formData.get("lastPurchasedAt") ?? "");

  if (!name || !cycleDays || !lastPurchasedAt) {
    throw new Error("Faltan campos obligatorios");
  }

  await addProduct({ name, icon, cycleDays, lastPurchasedAt });
  redirect("/");
}
