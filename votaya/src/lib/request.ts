import "server-only";
import { cookies, headers } from "next/headers";
import { hashWithSecret } from "./crypto";

export const ANON_COOKIE = "vy_aid";
export const REF_COOKIE = "vy_ref";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "0.0.0.0").slice(0, 64);
}

export async function getIpHash() {
  return hashWithSecret(`ip:${await getClientIp()}`).slice(0, 32);
}

export async function getAnonId(): Promise<string | null> {
  const v = (await cookies()).get(ANON_COOKIE)?.value;
  return v && /^[A-Za-z0-9_-]{10,64}$/.test(v) ? v : null;
}

export async function getRefCode(): Promise<string | null> {
  const v = (await cookies()).get(REF_COOKIE)?.value;
  return v && /^[a-z0-9-]{2,40}$/.test(v) ? v : null;
}

/** País aproximado por cabecera del CDN (Vercel/Cloudflare) para votos anónimos. */
export async function getGeoCountry(): Promise<string | null> {
  const h = await headers();
  const c = h.get("x-vercel-ip-country") || h.get("cf-ipcountry");
  return c && /^[A-Z]{2}$/.test(c) && c !== "XX" ? c : null;
}

export async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
