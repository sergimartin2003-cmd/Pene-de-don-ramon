import { cookies } from "next/headers";

import { SESSION_COOKIE, checkPassword, createToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return Response.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    // Pequeño retardo para que probar contraseñas a lo bruto no salga gratis.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return Response.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createToken(), sessionCookieOptions);
  return Response.json({ ok: true });
}
