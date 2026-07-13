"use server";

import { revalidatePath } from "next/cache";
import { renameHousehold, joinHousehold } from "@/lib/household";

export async function renameHouseholdAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre no puede estar vacío");

  await renameHousehold(name);
  revalidatePath("/perfil");
}

export async function joinHouseholdAction(formData: FormData) {
  const code = String(formData.get("inviteCode") ?? "").trim();
  if (!code) throw new Error("Falta el código de invitación");

  await joinHousehold(code);
  revalidatePath("/perfil");
  revalidatePath("/");
  revalidatePath("/lista");
  revalidatePath("/ahorro");
}
