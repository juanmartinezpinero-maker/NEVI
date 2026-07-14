"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { generateWeeklyPlanAction } from "@/app/recetas/actions";
import type { MealPlanDay } from "@/types/product";

interface WeeklyPlanProps {
  hasProducts: boolean;
  hasPreferences: boolean;
}

export function WeeklyPlan({ hasProducts, hasPreferences }: WeeklyPlanProps) {
  const [plan, setPlan] = useState<MealPlanDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateWeeklyPlanAction();
        setPlan(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al generar el plan");
      }
    });
  }

  if (!hasProducts) {
    return (
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-black/5">
        <p className="text-sm text-ink/60">
          Todavía no tienes productos guardados. Escanea un ticket o añade alguno para generar un
          plan semanal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!hasPreferences && (
        <div className="rounded-2xl border border-deep-blue/20 bg-deep-blue/10 p-3 text-sm text-ink/80">
          Para un plan más ajustado a tu familia, rellena tus{" "}
          <Link href="/perfil" className="font-semibold text-deep-blue underline">
            preferencias en Perfil
          </Link>
          .
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Preparando el plan..." : plan ? "Generar otro plan" : "Generar plan semanal"}
      </button>

      {error && <p className="text-sm text-coral-red">{error}</p>}

      {plan && (
        <div className="flex flex-col gap-3">
          {plan.map((day, index) => (
            <div key={index} className="rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage">{day.day}</p>
              <p className="mt-0.5 font-heading text-lg font-semibold text-ink">{day.title}</p>
              <p className="mt-1 text-sm text-ink/60">{day.description}</p>

              {day.usesIngredients.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {day.usesIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full bg-sage/10 px-2.5 py-1 text-xs font-medium text-sage"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              )}

              <ol className="mt-3 flex flex-col gap-1.5 text-sm text-ink/80">
                {day.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-2">
                    <span className="font-semibold text-sage">{stepIndex + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
