import { renderShareImage } from "@/lib/share-image";

export async function GET(_req: Request, ctx: RouteContext<"/api/story/[slug]">) {
  const { slug } = await ctx.params;
  return renderShareImage(slug, "story");
}
