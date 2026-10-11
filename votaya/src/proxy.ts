import { NextResponse, type NextRequest } from "next/server";

const YEAR = 60 * 60 * 24 * 365;

/** Asigna un identificador anónimo de dispositivo y guarda el código de referido (?ref=). */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const secure = request.nextUrl.protocol === "https:";
  if (!request.cookies.get("vy_aid")) {
    const id = crypto.randomUUID().replace(/-/g, "");
    response.cookies.set("vy_aid", id, { httpOnly: true, sameSite: "lax", secure, maxAge: YEAR, path: "/" });
  }
  const ref = request.nextUrl.searchParams.get("ref")?.toLowerCase();
  if (ref && /^[a-z0-9-]{2,40}$/.test(ref)) {
    response.cookies.set("vy_ref", ref, { httpOnly: true, sameSite: "lax", secure, maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/og|api/story|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
