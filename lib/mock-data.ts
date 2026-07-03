import type { CategorySpend, SavingsSummary, WasteSummary } from "@/types/product";

export const mockSavings: SavingsSummary = {
  currentMonth: 47.8,
  previousMonth: 36.5,
  currency: "€",
};

export const mockAIInsight =
  "He notado que sueles comprar leche cada 7 días, pero esta semana aún no la has añadido a la lista. Es probable que se acabe mañana.";

export const mockWasteSummary: WasteSummary = {
  wastedAmount: 8.4,
  wastedItemsCount: 3,
  currency: "€",
};

export const mockCategorySpend: CategorySpend[] = [
  { category: "Frescos", amount: 62.3 },
  { category: "Limpieza", amount: 24.1 },
  { category: "Despensa", amount: 41.9 },
  { category: "Bebidas", amount: 18.5 },
];
