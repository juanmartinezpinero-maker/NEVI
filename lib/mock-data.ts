import type { Product, SavingsSummary } from "@/types/product";

export const mockUserName = "Juan";

export const mockSavings: SavingsSummary = {
  currentMonth: 47.8,
  previousMonth: 36.5,
  currency: "€",
};

export const mockProducts: Product[] = [
  { id: "leche", name: "Leche", icon: "🥛", daysRemaining: 2, cycleDays: 7 },
  { id: "papel-higienico", name: "Papel higiénico", icon: "🧻", daysRemaining: 4, cycleDays: 14 },
  { id: "detergente", name: "Detergente", icon: "🧴", daysRemaining: 9, cycleDays: 30 },
  { id: "cafe", name: "Café", icon: "☕", daysRemaining: 12, cycleDays: 21 },
];

export const mockAIInsight =
  "He notado que sueles comprar leche cada 7 días, pero esta semana aún no la has añadido a la lista. Es probable que se acabe mañana.";
