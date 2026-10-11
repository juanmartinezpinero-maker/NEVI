// Utilidades de texto puras (sin dependencias de servidor) para poder testearlas.

const STOPWORDS = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "the", "a", "an", "de", "del"]);

/** Forma canónica para comparar respuestas: sin tildes, mayúsculas, signos ni artículos. */
export function normalize(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = base.split(" ").filter(Boolean);
  const meaningful = words.filter((w) => !STOPWORDS.has(w));
  return (meaningful.length ? meaningful : words).join(" ");
}

/** Variante sin espacios ni plurales simples: "Coca Cola" == "cocacola", "pizzas" == "pizza". */
export function compactKey(input: string): string {
  return normalize(input)
    .split(" ")
    .map((w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w))
    .join("");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Similitud 0..1 entre dos textos ya comparables. */
export function similarity(a: string, b: string): number {
  const x = compactKey(a);
  const y = compactKey(b);
  if (!x.length && !y.length) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/**
 * Busca el candidato equivalente a una respuesta libre. Devuelve su índice o -1.
 * Coincidencia exacta normalizada, o similitud alta en textos de longitud suficiente
 * (para no agrupar "Ron" con "Pan").
 */
export function findEquivalent(answer: string, candidates: string[], threshold = 0.84): number {
  const key = compactKey(answer);
  let best = -1;
  let bestScore = 0;
  candidates.forEach((c, i) => {
    const ck = compactKey(c);
    if (ck === key) {
      best = i;
      bestScore = 2;
      return;
    }
    if (Math.min(ck.length, key.length) < 5 || bestScore >= 2) return;
    const s = similarity(answer, c);
    if (s >= threshold && s > bestScore) {
      best = i;
      bestScore = s;
    }
  });
  return best;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

const BLOCKED = ["puta", "puto", "mierda", "gilipollas", "cabron", "maricon", "zorra", "nazi", "hitler", "fuck", "shit", "nigger", "retrasado", "subnormal"];

/** Filtro básico de insultos para respuestas libres y propuestas (la moderación humana es la última barrera). */
export function containsBlockedWords(input: string): boolean {
  const n = normalize(input);
  const words = new Set(n.split(" "));
  const joined = n.replace(/ /g, "");
  return BLOCKED.some((w) => words.has(w) || (w.length >= 6 && joined.includes(w)));
}

/** Formato compacto de números: 12.345 → "12,3 mil". */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} M`;
  if (n >= 10_000) return `${(n / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })} mil`;
  return n.toLocaleString("es-ES");
}

/** Porcentajes enteros que suman 100 (método del resto mayor). */
export function percentages(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floored = raw.map(Math.floor);
  let rest = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    floored[i]++;
    rest--;
  }
  return floored;
}
