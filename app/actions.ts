"use server";

import { revalidatePath } from "next/cache";
import { markProductAsWasted } from "@/lib/purchases";

export async function markProductWastedAction(productId: string) {
  await markProductAsWasted(productId);
  revalidatePath("/");
}
