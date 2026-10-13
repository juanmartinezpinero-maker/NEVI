import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { track } from "@/lib/analytics";

/** Enlaces de creadores: /r/<codigo> → registra el clic, guarda la atribución y redirige. */
export async function GET(req: NextRequest, ctx: RouteContext<"/r/[code]">) {
  const { code: raw } = await ctx.params;
  const code = raw.toLowerCase();
  const db = await getDb();
  const [link] = await db
    .select({ code: schema.shareLinks.code, slug: schema.polls.slug })
    .from(schema.shareLinks)
    .leftJoin(schema.polls, eq(schema.polls.id, schema.shareLinks.pollId))
    .where(eq(schema.shareLinks.code, code));
  if (!link) return NextResponse.redirect(new URL("/", req.url));
  await track("link_click", { refCode: link.code, anonId: req.cookies.get("vy_aid")?.value ?? null });
  const res = NextResponse.redirect(new URL(link.slug ? `/p/${link.slug}` : "/", req.url));
  res.cookies.set("vy_ref", link.code, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
