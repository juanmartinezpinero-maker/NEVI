export type UrgencyLevel = "ok" | "warning" | "urgent";

export interface Product {
  id: string;
  name: string;
  icon: string;
  daysRemaining: number;
  cycleDays: number;
}

export interface ProductRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  cycle_days: number;
  last_purchased_at: string;
  created_at: string;
}

export interface SavingsSummary {
  currentMonth: number;
  previousMonth: number;
  currency: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  icon: string;
  urgency: UrgencyLevel;
  reason: string;
}

export interface CategorySpend {
  category: string;
  amount: number;
}

export interface WasteSummary {
  wastedAmount: number;
  wastedItemsCount: number;
  currency: string;
}

export interface ScannedItem {
  name: string;
  price: number;
  icon: string;
  category: string;
}

export interface PurchaseRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category: string;
  price: number;
  purchased_at: string;
  created_at: string;
}

export interface WasteEventRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  amount: number;
  wasted_at: string;
  created_at: string;
}
