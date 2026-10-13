import { NextResponse, type NextRequest } from "next/server";
import { track } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getAnonId, getIpHash, getRefCode } from "@/lib/request";

const ALLOWED = new Set(["view", "share"]);
const BOT = /bot|crawler|spider|preview|facebookexternalhit|whatsapp|slurp|headless/i;

export async function POST(req: NextRequest) {
  if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
  let body: { type?: string; pollId?: string; path?: string; ref?: string; meta?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body.type || !ALLOWED.has(body.type)) return new NextResponse(null, { status: 400 });
  if (!(await rateLimit(`track:${await getIpHash()}`, 300, 3600))) return new NextResponse(null, { status: 429 });
  const pollId = typeof body.pollId === "string" && /^[0-9a-f-]{36}$/i.test(body.pollId) ? body.pollId : null;
  const ref = typeof body.ref === "string" && /^[a-z0-9-]{2,40}$/.test(body.ref) ? body.ref : await getRefCode();
  const src = req.nextUrl.searchParams.get("src") ?? new URL(req.headers.get("referer") ?? "http://x").searchParams.get("src");
  const user = await getCurrentUser();
  await track(body.type as "view" | "share", {
    pollId,
    userId: user?.id,
    anonId: await getAnonId(),
    refCode: ref,
    meta: {
      path: typeof body.path === "string" ? body.path.slice(0, 200) : undefined,
      channel: typeof body.meta?.channel === "string" ? body.meta.channel.slice(0, 30) : undefined,
      src: src?.slice(0, 20) || undefined,
    },
  });
  return new NextResponse(null, { status: 204 });
}
