import { renderShareImage } from "@/lib/share-image";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Resultados de la encuesta en VotaYa";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderShareImage(slug, "og");
}
