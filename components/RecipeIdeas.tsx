"use client";

import { useState, useTransition } from "react";
import { generateRecipeIdeasAction } from "@/app/recetas/actions";
import type { RecipeIdea } from "@/types/product";

interface RecipeIdeasProps {
  hasProducts: boolean;
}

export function RecipeIdeas({ hasProducts }: RecipeIdeasProps) {
  const [recipes, setRecipes] = useState<RecipeIdea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateRecipeIdeasAction();
        setRecipes(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al generar ideas");
      }
    });
  }

  if (!hasProducts) {
    return (
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm shadow-black/5">
        <p className="text-sm text-ink/60">
          Todavía no tienes productos guardados. Escanea un ticket o añade alguno para que la IA
          pueda sugerirte recetas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Pensando..." : recipes ? "Generar otras ideas" : "Generar ideas"}
      </button>

      {error && <p className="text-sm text-coral-red">{error}</p>}

      {recipes && (
        <div className="flex flex-col gap-3">
          {recipes.map((recipe, index) => (
            <div key={index} className="rounded-2xl bg-white p-4 shadow-sm shadow-black/5">
              <p className="font-heading text-lg font-semibold text-ink">{recipe.title}</p>
              <p className="mt-1 text-sm text-ink/60">{recipe.description}</p>

              {recipe.usesIngredients.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipe.usesIngredients.map((ingredient) => (
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
                {recipe.steps.map((step, stepIndex) => (
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
