import type { UrgencyLevel } from "@/types/product";

export function getUrgencyLevel(daysRemaining: number): UrgencyLevel {
  if (daysRemaining < 3) return "urgent";
  if (daysRemaining <= 5) return "warning";
  return "ok";
}

export const urgencyColors: Record<UrgencyLevel, string> = {
  ok: "#3D8361",
  warning: "#E8912D",
  urgent: "#D64545",
};

export const urgencyTextClasses: Record<UrgencyLevel, string> = {
  ok: "text-sage",
  warning: "text-warm-orange",
  urgent: "text-coral-red",
};
