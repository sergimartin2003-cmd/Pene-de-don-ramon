import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { isAdmin, unauthorized } from "@/lib/auth";
import { blobIsConfigured, uploadPhoto } from "@/lib/blob-store";
import { UPLOAD_DIR, photoUrl } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB por foto
const MAX_FILES = 12;

/**
 * Último recurso: sin disco y sin Blob, la foto se incrusta en el propio
 * producto como data URI. Ahí el límite es mucho más bajo, porque viaja dentro
 * del JSON del catálogo.
 */
const MAX_INLINE_BYTES = 1.5 * 1024 * 1024;

let diskWritable = true;

/** Extensión por tipo, para no confiar en el nombre que manda el navegador. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "No se ha podido leer el envío." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return Response.json({ error: "No has adjuntado ninguna foto." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return Response.json(
      { error: `Máximo ${MAX_FILES} fotos por producto.` },
      { status: 400 },
    );
  }

  // En Vercel el disco es de sólo lectura: las fotos van a Blob, que además es
  // lo que las hace sobrevivir a los despliegues.
  const useBlob = blobIsConfigured();

  if (!useBlob && diskWritable) {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch {
      diskWritable = false;
    }
  }

  const uploaded: { id: string; url: string; alt: string }[] = [];

  for (const file of files) {
    const extension = EXTENSIONS[file.type];
    if (!extension) {
      return Response.json(
        { error: `"${file.name}" no es una imagen admitida (JPG, PNG, WebP, AVIF o SVG).` },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: `"${file.name}" pesa más de 12 MB. Comprímela antes de subirla.` },
        { status: 413 },
      );
    }

    const id = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (useBlob) {
      try {
        const url = await uploadPhoto(`fotos/${id}${extension}`, buffer, file.type);
        uploaded.push({ id, url, alt: "" });
        continue;
      } catch (cause) {
        console.error("[tienda] Fallo al subir la foto a Vercel Blob.", cause);
        return Response.json(
          {
            error:
              "No se ha podido guardar la foto en Vercel Blob. Comprueba que el " +
              "Blob Store sigue conectado al proyecto.",
          },
          { status: 502 },
        );
      }
    }

    if (diskWritable) {
      try {
        const filename = `${id}${extension}`;
        await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
        uploaded.push({ id, url: photoUrl(filename), alt: "" });
        continue;
      } catch {
        diskWritable = false;
      }
    }

    if (file.size > MAX_INLINE_BYTES) {
      return Response.json(
        {
          error:
            `Aquí no hay dónde guardar las fotos, así que se incrustan en el ` +
            `producto y "${file.name}" es demasiado grande (máximo 1,5 MB). ` +
            `Conecta un Blob Store al proyecto en Vercel (Storage → Blob) y ` +
            `podrás subir fotos de hasta 12 MB que además no se perderán.`,
        },
        { status: 413 },
      );
    }

    uploaded.push({
      id,
      url: `data:${file.type};base64,${buffer.toString("base64")}`,
      alt: "",
    });
  }

  return Response.json({ images: uploaded, persisted: useBlob || diskWritable }, { status: 201 });
}
