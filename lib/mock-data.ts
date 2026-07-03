import type { CategorySpend, Product, SavingsSummary, ShoppingListItem, WasteSummary } from "@/types/product";

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

export const mockShoppingList: ShoppingListItem[] = [
  { id: "leche", name: "Leche", icon: "🥛", urgency: "urgent", reason: "Se acaba en 2 días" },
  { id: "papel-higienico", name: "Papel higiénico", icon: "🧻", urgency: "warning", reason: "Se acaba en 4 días" },
  { id: "huevos", name: "Huevos", icon: "🥚", urgency: "warning", reason: "Se acaba en 5 días" },
  { id: "detergente", name: "Detergente", icon: "🧴", urgency: "ok", reason: "Se acaba en 9 días" },
  { id: "aceite", name: "Aceite de oliva", icon: "🫒", urgency: "ok", reason: "Sueles comprarlo cada mes" },
];

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
