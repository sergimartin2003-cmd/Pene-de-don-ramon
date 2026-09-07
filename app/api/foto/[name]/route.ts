import { promises as fs } from "node:fs";
import path from "node:path";

import { UPLOAD_DIR } from "@/lib/uploads";

/**
 * Sirve las fotos subidas desde el panel.
 *
 * No se pueden dejar en /public: Next indexa esa carpeta al compilar, así que
 * un fichero añadido después nunca llega a servirse (da 404 hasta el siguiente
 * despliegue). Por eso viven fuera y salen por aquí.
 */

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/** UUID + extensión conocida: no hay forma de salirse de la carpeta. */
const SAFE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z]{3,4}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  const extension = path.extname(name).toLowerCase();
  if (!SAFE_NAME.test(name) || !CONTENT_TYPES[extension]) {
    return new Response("No encontrada", { status: 404 });
  }

  try {
    const file = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension],
        // El nombre es un UUID: el contenido nunca cambia bajo la misma URL.
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return new Response("No encontrada", { status: 404 });
  }
}
