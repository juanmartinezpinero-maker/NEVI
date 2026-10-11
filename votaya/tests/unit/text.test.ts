import { describe, expect, it } from "vitest";
import { compactKey, containsBlockedWords, findEquivalent, normalize, percentages, similarity, slugify } from "@/lib/text";

describe("normalize", () => {
  it("quita tildes, mayúsculas, signos y artículos", () => {
    expect(normalize("  ¡La Casa de Papel!  ")).toBe("casa papel");
    expect(normalize("Japón")).toBe("japon");
    expect(normalize("The Office")).toBe("office");
  });
});

describe("agrupación de respuestas «Otra»", () => {
  const options = ["Coca-Cola", "Breaking Bad", "Juego de Tronos"];
  it("detecta la misma respuesta escrita de otra forma", () => {
    expect(findEquivalent("coca cola", options)).toBe(0);
    expect(findEquivalent("COCACOLA", options)).toBe(0);
    expect(findEquivalent("breaking vad", options)).toBe(1); // errata
    expect(findEquivalent("juego de tronos!!", options)).toBe(2);
  });
  it("agrupa plurales simples", () => {
    expect(compactKey("Pizzas")).toBe(compactKey("pizza"));
    expect(findEquivalent("stranger thing", ["Stranger Things"])).toBe(0);
  });
  it("no agrupa respuestas cortas parecidas pero distintas", () => {
    expect(findEquivalent("Ron", ["Pan"])).toBe(-1);
    expect(findEquivalent("Dark", ["Dart"])).toBe(-1);
    expect(findEquivalent("Succession", options)).toBe(-1);
  });
  it("similarity es 1 para equivalentes", () => {
    expect(similarity("Él Padrino", "el padrino")).toBe(1);
  });
});

describe("percentages", () => {
  it("suma exactamente 100", () => {
    const p = percentages([1, 1, 1]);
    expect(p.reduce((a, b) => a + b)).toBe(100);
    expect(percentages([62, 38])).toEqual([62, 38]);
    expect(percentages([0, 0])).toEqual([0, 0]);
  });
});

describe("slugify y filtro", () => {
  it("crea slugs limpios", () => {
    expect(slugify("¿Pepsi o Coca-Cola?")).toBe("pepsi-o-coca-cola");
  });
  it("bloquea insultos sin falsos positivos obvios", () => {
    expect(containsBlockedWords("eres un gilipollas")).toBe(true);
    expect(containsBlockedWords("Computadora")).toBe(false);
    expect(containsBlockedWords("Breaking Bad")).toBe(false);
  });
});
