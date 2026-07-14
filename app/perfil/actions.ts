"use server";

import { revalidatePath } from "next/cache";
import { renameHousehold, joinHousehold, updateHouseholdPreferences } from "@/lib/household";

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

export async function updateHouseholdPreferencesAction(formData: FormData) {
  const memberCountRaw = String(formData.get("memberCount") ?? "").trim();
  const dietaryNotes = String(formData.get("dietaryNotes") ?? "").trim();
  const memberCount = memberCountRaw ? Number(memberCountRaw) : null;

  await updateHouseholdPreferences({ memberCount, dietaryNotes });
  revalidatePath("/perfil");
  revalidatePath("/recetas");
}
