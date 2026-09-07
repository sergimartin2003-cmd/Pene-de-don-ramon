import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { isAdmin, unauthorized } from "@/lib/auth";
import { blobIsConfigured } from "@/lib/blob-store";

/**
 * Autoriza las subidas que el navegador hace directamente a Vercel Blob.
 *
 * Sin esto, la foto viajaría dentro de la petición a esta función, y las
 * funciones de Vercel rechazan cuerpos de más de 4,5 MB: una foto de móvil no
 * cabe. Aquí sólo se firma un permiso de subida; los bytes van del navegador al
 * almacén sin pasar por el servidor, así que el peso deja de ser un límite.
 */

export const dynamic = "force-dynamic";

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const MAX_BYTES = 50 * 1024 * 1024;

/** fotos/<uuid>.<ext> y nada más: el nombre lo propone el navegador. */
const SAFE_PATHNAME =
  /^fotos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{3,4}$/;

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();
  if (!blobIsConfigured()) {
    return Response.json(
      { error: "No hay un Blob Store conectado a este proyecto." },
      { status: 409 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!SAFE_PATHNAME.test(pathname)) {
          throw new Error("Nombre de fichero no permitido.");
        }
        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      // Vercel llama a esto desde sus servidores al terminar la subida. No hace
      // falta para nada: el navegador ya recibe la URL. Se deja por registro.
      onUploadCompleted: async ({ blob }) => {
        console.info(`[tienda] Foto subida a Blob: ${blob.pathname}`);
      },
    });

    return Response.json(result);
  } catch (cause) {
    return Response.json(
      { error: cause instanceof Error ? cause.message : "No se ha podido autorizar la subida." },
      { status: 400 },
    );
  }
}
