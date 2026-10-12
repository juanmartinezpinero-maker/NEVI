/** Categorías: nombre y un tono propio (chips, fondos de respaldo). Sin emojis en la interfaz. */
export type Category = { slug: string; name: string; tone: string };

export const CATEGORIES: Category[] = [
  { slug: "comida", name: "Comida", tone: "#c4572e" },
  { slug: "deportes", name: "Deportes", tone: "#2f7a4b" },
  { slug: "entretenimiento", name: "Cine y series", tone: "#5b3f8c" },
  { slug: "estilo-de-vida", name: "Estilo de vida", tone: "#b0476a" },
  { slug: "tecnologia", name: "Tecnología", tone: "#2a5f9e" },
  { slug: "marcas", name: "Marcas", tone: "#a8741a" },
  { slug: "paises", name: "Países", tone: "#2a7d86" },
  { slug: "productos", name: "Productos", tone: "#6b6b3a" },
  { slug: "politica", name: "Sociedad", tone: "#44506b" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
