import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "./auth";
import { randomToken } from "./crypto";
import { ANON_COOKIE, getAnonId, getGeoCountry, getIpHash, getRefCode } from "./request";
import type { Voter } from "./votes";

/** Construye la identidad del votante. Solo en Server Actions/Route Handlers (puede crear cookie). */
export async function currentVoter(): Promise<Voter> {
  const user = await getCurrentUser();
  let anonId = await getAnonId();
  if (!anonId) {
    anonId = randomToken(16);
    (await cookies()).set(ANON_COOKIE, anonId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  const verified = user?.profileCompleted ? user : null;
  return {
    userId: user?.id ?? null,
    anonId,
    ipHash: await getIpHash(),
    refCode: (await getRefCode()) ?? user?.refCode ?? null,
    profile: verified ? { country: verified.country, ageRange: verified.ageRange, gender: verified.gender } : null,
    geoCountry: await getGeoCountry(),
  };
}
