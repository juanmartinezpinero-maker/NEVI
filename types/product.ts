export type UrgencyLevel = "ok" | "warning" | "urgent";

export interface Product {
  id: string;
  name: string;
  icon: string;
  daysRemaining: number;
  cycleDays: number;
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
