"use server";

import { redirect } from "next/navigation";
import { anthropic } from "@/lib/anthropic";
import { recordScannedPurchase } from "@/lib/purchases";
import type { ScannedItem } from "@/types/product";

const RECEIPT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre del producto en español, normalizado (ej. 'Leche entera')",
          },
          price: {
            type: "number",
            description: "Precio individual del producto en euros",
          },
          icon: {
            type: "string",
            description: "Un único emoji que represente el producto",
          },
          category: {
            type: "string",
            description:
              "Categoría del producto en español, una de: Frescos, Despensa, Bebidas, Limpieza, Higiene, Otros",
          },
        },
        required: ["name", "price", "icon", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function normalizeMediaType(type: string): AllowedMediaType {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(type)
    ? (type as AllowedMediaType)
    : "image/jpeg";
}

export async function scanReceiptAction(formData: FormData): Promise<ScannedItem[]> {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Falta la foto del ticket");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const base64 = bytes.toString("base64");
  const mediaType = normalizeMediaType(file.type);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    output_config: { format: { type: "json_schema", schema: RECEIPT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: "Esta imagen es un ticket de compra de supermercado. Extrae la lista de productos comprados con su precio individual. Ignora líneas de total, subtotal, descuentos, impuestos, forma de pago o datos de la tienda.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No se pudo leer el ticket. Prueba con una foto más clara.");
  }

  const parsed = JSON.parse(textBlock.text) as { items: ScannedItem[] };
  return parsed.items;
}

export async function saveScannedProductsAction(items: ScannedItem[]) {
  for (const item of items) {
    await recordScannedPurchase({
      name: item.name,
      icon: item.icon,
      category: item.category,
      price: item.price,
    });
  }

  redirect("/");
}
