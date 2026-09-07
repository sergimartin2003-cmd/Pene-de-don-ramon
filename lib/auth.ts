import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sesión de administrador.
 *
 * Una sola contraseña (ADMIN_PASSWORD) y una cookie httpOnly firmada con HMAC.
 * Es lo que necesita una tienda de una marca: nadie más entra al panel, y el
 * navegador del cliente no guarda nada que se pueda falsificar.
 */

export const SESSION_COOKIE = "bora_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 h

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "bora-admin-2026";
}

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    // Sin secreto propio la firma se deriva de la contraseña: cambiarla
    // invalida las sesiones abiertas, que es justo lo que queremos.
    `derivado:${adminPassword()}`
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string): boolean {
  return safeEqual(candidate ?? "", adminPassword());
}

export function createToken(): string {
  const payload = JSON.stringify({
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
    nonce: randomBytes(8).toString("hex"),
  });
  const body = Buffer.from(payload).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  if (!safeEqual(signature, sign(body))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/** Respuesta estándar cuando una ruta de escritura se llama sin sesión. */
export function unauthorized(): Response {
  return Response.json(
    { error: "Necesitas iniciar sesión como administrador." },
    { status: 401 },
  );
}
