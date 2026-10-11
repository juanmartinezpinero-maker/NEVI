import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET es obligatorio en producción");
  return s ?? "dev-secret-no-usar-en-produccion";
};

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Hash con sal secreta: permite detectar abusos por IP sin guardar la IP. */
export const hashWithSecret = (v: string) => sha256(`${secret()}:${v}`);

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const randomCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
