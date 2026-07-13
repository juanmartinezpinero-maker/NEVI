import { createClient } from "@/lib/supabase/server";
import type { CategorySpend, SavingsSummary, WasteSummary } from "@/types/product";
import { getHouseholdId } from "@/lib/household";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_CYCLE_DAYS = 1;
const FALLBACK_CYCLE_DAYS = 14;

const DEFAULT_CYCLE_BY_CATEGORY: Record<string, number> = {
  Frescos: 6,
  Bebidas: 10,
  Higiene: 30,
  Limpieza: 45,
  Despensa: 20,
  Otros: FALLBACK_CYCLE_DAYS,
};

function defaultCycleDaysFor(category: string): number {
  return DEFAULT_CYCLE_BY_CATEGORY[category] ?? FALLBACK_CYCLE_DAYS;
}

function daysBetween(from: string, to: Date): number {
  const start = new Date(from);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - startUtc) / MS_PER_DAY);
}

export async function recordScannedPurchase(item: {
  name: string;
  icon: string;
  category: string;
  price: number;
}): Promise<{ name: string; icon: string; cycleDays: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const householdId = await getHouseholdId();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const { error: purchaseError } = await supabase.from("purchases").insert({
    user_id: user.id,
    household_id: householdId,
    name: item.name,
    icon: item.icon,
    category: item.category,
    price: item.price,
    purchased_at: todayStr,
  });
  if (purchaseError) throw new Error(purchaseError.message);

  const { data: existing } = await supabase
    .from("products")
    .select("id, cycle_days, last_purchased_at")
    .ilike("name", item.name)
    .maybeSingle();

  if (existing) {
    const interval = daysBetween(existing.last_purchased_at, today);
    const newCycleDays =
      interval > 0
        ? Math.max(MIN_CYCLE_DAYS, Math.round(existing.cycle_days * 0.5 + interval * 0.5))
        : existing.cycle_days;

    await supabase
      .from("products")
      .update({ cycle_days: newCycleDays, last_purchased_at: todayStr })
      .eq("id", existing.id);

    return { name: item.name, icon: item.icon, cycleDays: newCycleDays };
  }

  const cycleDays = defaultCycleDaysFor(item.category);
  await supabase.from("products").insert({
    user_id: user.id,
    household_id: householdId,
    name: item.name,
    icon: item.icon,
    cycle_days: cycleDays,
    last_purchased_at: todayStr,
  });

  return { name: item.name, icon: item.icon, cycleDays };
}

export async function markProductAsWasted(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const householdId = await getHouseholdId();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("name, icon")
    .eq("id", productId)
    .single();
  if (productError || !product) throw new Error("Producto no encontrado");

  const { data: lastPurchase } = await supabase
    .from("purchases")
    .select("price")
    .ilike("name", product.name)
    .order("purchased_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: wasteError } = await supabase.from("waste_events").insert({
    user_id: user.id,
    household_id: householdId,
    name: product.name,
    icon: product.icon,
    amount: lastPurchase?.price ?? 0,
  });
  if (wasteError) throw new Error(wasteError.message);

  await supabase.from("products").delete().eq("id", productId);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export async function getMonthlySpend(): Promise<SavingsSummary> {
  const supabase = await createClient();
  const now = new Date();
  const currentKey = monthKey(now.toISOString());
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = monthKey(previousDate.toISOString());

  const { data, error } = await supabase.from("purchases").select("price, purchased_at");
  if (error || !data) {
    return { currentMonth: 0, previousMonth: 0, currency: "€" };
  }

  const currentMonth = data
    .filter((row) => monthKey(row.purchased_at) === currentKey)
    .reduce((sum, row) => sum + Number(row.price), 0);
  const previousMonth = data
    .filter((row) => monthKey(row.purchased_at) === previousKey)
    .reduce((sum, row) => sum + Number(row.price), 0);

  return { currentMonth, previousMonth, currency: "€" };
}

export async function getCategorySpend(): Promise<CategorySpend[]> {
  const supabase = await createClient();
  const currentKey = monthKey(new Date().toISOString());

  const { data, error } = await supabase.from("purchases").select("category, price, purchased_at");
  if (error || !data) return [];

  const totals = new Map<string, number>();
  for (const row of data) {
    if (monthKey(row.purchased_at) !== currentKey) continue;
    totals.set(row.category, (totals.get(row.category) ?? 0) + Number(row.price));
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getWasteSummary(): Promise<WasteSummary> {
  const supabase = await createClient();
  const currentKey = monthKey(new Date().toISOString());

  const { data, error } = await supabase.from("waste_events").select("amount, wasted_at");
  if (error || !data) {
    return { wastedAmount: 0, wastedItemsCount: 0, currency: "€" };
  }

  const monthRows = data.filter((row) => monthKey(row.wasted_at) === currentKey);
  const wastedAmount = monthRows.reduce((sum, row) => sum + Number(row.amount), 0);

  return { wastedAmount, wastedItemsCount: monthRows.length, currency: "€" };
}
