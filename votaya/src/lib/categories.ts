export type Category = { slug: string; name: string; emoji: string; gradient: string };

export const CATEGORIES: Category[] = [
  { slug: "paises", name: "Países", emoji: "🌍", gradient: "from-sky-500 to-indigo-600" },
  { slug: "comida", name: "Comida", emoji: "🍕", gradient: "from-orange-500 to-rose-500" },
  { slug: "tecnologia", name: "Tecnología", emoji: "📱", gradient: "from-cyan-500 to-blue-600" },
  { slug: "deportes", name: "Deportes", emoji: "⚽", gradient: "from-lime-500 to-emerald-600" },
  { slug: "entretenimiento", name: "Entretenimiento", emoji: "🎬", gradient: "from-fuchsia-500 to-purple-600" },
  { slug: "marcas", name: "Marcas", emoji: "🏷️", gradient: "from-amber-400 to-orange-600" },
  { slug: "estilo-de-vida", name: "Estilo de vida", emoji: "✨", gradient: "from-pink-500 to-rose-600" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
