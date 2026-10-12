export type Category = { slug: string; name: string; emoji: string; gradient: string };

export const CATEGORIES: Category[] = [
  { slug: "paises", name: "Países", emoji: "🌍", gradient: "from-sky-400 to-indigo-500" },
  { slug: "comida", name: "Comida", emoji: "🍕", gradient: "from-orange-400 to-rose-500" },
  { slug: "tecnologia", name: "Tecnología", emoji: "📱", gradient: "from-cyan-400 to-blue-600" },
  { slug: "deportes", name: "Deportes", emoji: "⚽", gradient: "from-lime-400 to-emerald-600" },
  { slug: "entretenimiento", name: "Entretenimiento", emoji: "🎬", gradient: "from-fuchsia-500 to-purple-600" },
  { slug: "estilo-de-vida", name: "Estilo de vida", emoji: "❤️", gradient: "from-pink-400 to-rose-500" },
  { slug: "marcas", name: "Marcas", emoji: "🏷️", gradient: "from-amber-400 to-orange-500" },
  { slug: "productos", name: "Productos", emoji: "🛍️", gradient: "from-teal-400 to-cyan-600" },
  { slug: "politica", name: "Política y sociedad", emoji: "🏛️", gradient: "from-slate-500 to-indigo-700" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
