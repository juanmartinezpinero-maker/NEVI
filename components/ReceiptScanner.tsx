"use client";

import { useState, useTransition } from "react";
import { scanReceiptAction, saveScannedProductsAction } from "@/app/escanear/actions";
import type { ScannedItem } from "@/types/product";

export function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ScannedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleScan() {
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("photo", file);
    startTransition(async () => {
      try {
        const result = await scanReceiptAction(formData);
        if (result.length === 0) {
          setError("No se detectó ningún producto en la foto. Prueba con otra imagen.");
          return;
        }
        setItems(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al analizar el ticket");
      }
    });
  }

  function handleSave() {
    if (!items || items.length === 0) return;
    startTransition(async () => {
      await saveScannedProductsAction(items);
    });
  }

  function updateItem(index: number, patch: Partial<ScannedItem>) {
    setItems((prev) => prev?.map((it, i) => (i === index ? { ...it, ...patch } : it)) ?? null);
  }

  function removeItem(index: number) {
    setItems((prev) => prev?.filter((_, i) => i !== index) ?? null);
  }

  if (items) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink/60">Revisa los productos detectados antes de guardarlos.</p>

        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm shadow-black/5"
          >
            <span className="text-lg" aria-hidden="true">
              {item.icon}
            </span>
            <input
              value={item.name}
              onChange={(e) => updateItem(index, { name: e.target.value })}
              aria-label="Nombre del producto"
              className="min-w-0 flex-1 rounded-lg border border-black/10 px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              value={item.price}
              onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
              aria-label="Precio"
              className="w-16 rounded-lg border border-black/10 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-sm font-medium text-coral-red"
            >
              Quitar
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || items.length === 0}
          className="mt-1 rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Guardando..." : `Guardar ${items.length} producto${items.length === 1 ? "" : "s"}`}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-white p-6 text-center">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="text-3xl" aria-hidden="true">
          📷
        </span>
        <span className="text-sm text-ink/60">
          {file ? file.name : "Toca para hacer una foto o elegir una imagen del ticket"}
        </span>
      </label>

      {error && <p className="text-sm text-coral-red">{error}</p>}

      <button
        type="button"
        onClick={handleScan}
        disabled={!file || isPending}
        className="rounded-xl bg-sage px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Analizando..." : "Analizar ticket"}
      </button>
    </div>
  );
}
