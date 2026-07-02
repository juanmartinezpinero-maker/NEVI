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
