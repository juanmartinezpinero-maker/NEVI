"use server";

import { anthropic } from "@/lib/anthropic";
import { getProducts } from "@/lib/products";
import { getHousehold } from "@/lib/household";
import type { MealPlanDay, RecipeIdea } from "@/types/product";

const RECIPE_SCHEMA = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Nombre del plato en español",
          },
          description: {
            type: "string",
            description: "Una frase corta explicando por qué es una buena opción",
          },
          usesIngredients: {
            type: "array",
            items: { type: "string" },
            description: "Ingredientes de la lista proporcionada que usa esta receta",
          },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "Pasos breves de preparación, entre 3 y 5 pasos",
          },
        },
        required: ["title", "description", "usesIngredients", "steps"],
        additionalProperties: false,
      },
    },
  },
  required: ["recipes"],
  additionalProperties: false,
} as const;

export async function generateRecipeIdeasAction(): Promise<RecipeIdea[]> {
  const products = await getProducts();
  if (products.length === 0) {
    throw new Error("Todavía no tienes productos guardados");
  }

  const ingredientList = products.map((p) => p.name).join(", ");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    output_config: { format: { type: "json_schema", schema: RECIPE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Tengo estos ingredientes en casa: ${ingredientList}. Sugiéreme 3 ideas de platos que pueda cocinar usando principalmente estos ingredientes (puedes asumir que tengo básicos de despensa como sal, aceite, especias comunes y agua, aunque no estén en la lista). Para cada plato, indica qué ingredientes de mi lista usa y pasos breves de preparación, en español.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No se pudieron generar ideas ahora mismo. Inténtalo de nuevo.");
  }

  const parsed = JSON.parse(textBlock.text) as { recipes: RecipeIdea[] };
  return parsed.recipes;
}

const MEAL_PLAN_SCHEMA = {
  type: "object",
  properties: {
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: {
            type: "string",
            description: "Día de la semana en español (Lunes, Martes, ...)",
          },
          title: {
            type: "string",
            description: "Nombre del plato en español",
          },
          description: {
            type: "string",
            description: "Una frase corta explicando por qué es una buena opción",
          },
          usesIngredients: {
            type: "array",
            items: { type: "string" },
            description: "Ingredientes de la lista proporcionada que usa esta receta",
          },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "Pasos breves de preparación, entre 3 y 5 pasos",
          },
        },
        required: ["day", "title", "description", "usesIngredients", "steps"],
        additionalProperties: false,
      },
    },
  },
  required: ["days"],
  additionalProperties: false,
} as const;

export async function generateWeeklyPlanAction(): Promise<MealPlanDay[]> {
  const [products, household] = await Promise.all([getProducts(), getHousehold()]);
  if (products.length === 0) {
    throw new Error("Todavía no tienes productos guardados");
  }

  const ingredientList = products.map((p) => p.name).join(", ");

  const preferenceLines: string[] = [];
  if (household?.memberCount) {
    preferenceLines.push(`Cocino para ${household.memberCount} personas.`);
  }
  if (household?.dietaryNotes) {
    preferenceLines.push(`Restricciones o preferencias alimentarias: ${household.dietaryNotes}.`);
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    output_config: { format: { type: "json_schema", schema: MEAL_PLAN_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Tengo estos ingredientes en casa: ${ingredientList}. ${preferenceLines.join(" ")} Prepárame un plan de comida principal para los 7 días de la semana (Lunes a Domingo), usando principalmente estos ingredientes (puedes asumir básicos de despensa como sal, aceite, especias comunes y agua, aunque no estén en la lista, y puedes repetir algún ingrediente entre días). Para cada día indica el plato, qué ingredientes de mi lista usa y pasos breves de preparación, en español.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No se pudo generar el plan ahora mismo. Inténtalo de nuevo.");
  }

  const parsed = JSON.parse(textBlock.text) as { days: MealPlanDay[] };
  return parsed.days;
}
