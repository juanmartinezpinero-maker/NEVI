import { createClient } from "@/lib/supabase/server";
import type { Product, ProductRow, ShoppingListItem } from "@/types/product";
import { getUrgencyLevel } from "@/lib/urgency";
import { getHouseholdId } from "@/lib/household";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysRemainingFrom(lastPurchasedAt: string, cycleDays: number): number {
  const last = new Date(lastPurchasedAt);
  const now = new Date();
  const lastUtc = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSincePurchase = Math.floor((nowUtc - lastUtc) / MS_PER_DAY);
  return cycleDays - daysSincePurchase;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    cycleDays: row.cycle_days,
    daysRemaining: daysRemainingFrom(row.last_purchased_at, row.cycle_days),
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map(toProduct);
}

export async function getShoppingList(): Promise<ShoppingListItem[]> {
  const products = await getProducts();

  return products
    .filter((product) => product.daysRemaining <= 7)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .map((product) => ({
      id: product.id,
      name: product.name,
      icon: product.icon,
      urgency: getUrgencyLevel(product.daysRemaining),
      reason:
        product.daysRemaining <= 0
          ? "Toca comprarlo ya"
          : `Se acaba en ${product.daysRemaining} ${product.daysRemaining === 1 ? "día" : "días"}`,
    }));
}

export async function addProduct(input: {
  name: string;
  icon: string;
  cycleDays: number;
  lastPurchasedAt: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const householdId = await getHouseholdId();

  const { error } = await supabase.from("products").insert({
    user_id: user.id,
    household_id: householdId,
    name: input.name,
    icon: input.icon,
    cycle_days: input.cycleDays,
    last_purchased_at: input.lastPurchasedAt,
  });

  if (error) throw new Error(error.message);
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

  if (error || !data) return null;
  return data;
}

export async function updateProduct(
  id: string,
  input: { name: string; icon: string; cycleDays: number; lastPurchasedAt: string },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      icon: input.icon,
      cycle_days: input.cycleDays,
      last_purchased_at: input.lastPurchasedAt,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
