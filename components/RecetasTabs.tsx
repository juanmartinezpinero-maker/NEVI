"use client";

import { useState } from "react";
import { RecipeIdeas } from "@/components/RecipeIdeas";
import { WeeklyPlan } from "@/components/WeeklyPlan";

interface RecetasTabsProps {
  hasProducts: boolean;
  hasPreferences: boolean;
}

export function RecetasTabs({ hasProducts, hasPreferences }: RecetasTabsProps) {
  const [tab, setTab] = useState<"quick" | "weekly">("quick");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl bg-black/5 p-1">
        <button
          type="button"
          onClick={() => setTab("quick")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "quick" ? "bg-white text-ink shadow-sm" : "text-ink/60"
          }`}
        >
          Ideas rápidas
        </button>
        <button
          type="button"
          onClick={() => setTab("weekly")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "weekly" ? "bg-white text-ink shadow-sm" : "text-ink/60"
          }`}
        >
          Plan semanal
        </button>
      </div>

      {tab === "quick" ? (
        <RecipeIdeas hasProducts={hasProducts} />
      ) : (
        <WeeklyPlan hasProducts={hasProducts} hasPreferences={hasPreferences} />
      )}
    </div>
  );
}
