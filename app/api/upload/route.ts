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

/**
 * El tipo que declara el navegador se deduce muchas veces de la extensión, así
 * que un fichero renombrado cuela. Se comprueban los primeros bytes para no
 * guardar algo que luego no se pueda mostrar.
 */
function looksLikeImage(buffer: Buffer, mime: string): boolean {
  const starts = (...bytes: number[]) => bytes.every((b, i) => buffer[i] === b);

  switch (mime) {
    case "image/jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "image/png":
      return starts(0x89, 0x50, 0x4e, 0x47);
    case "image/gif":
      return starts(0x47, 0x49, 0x46);
    case "image/webp":
      return starts(0x52, 0x49, 0x46, 0x46) && buffer.subarray(8, 12).toString() === "WEBP";
    case "image/avif":
      return buffer.subarray(4, 8).toString() === "ftyp";
    case "image/svg+xml": {
      const head = buffer.subarray(0, 1024).toString("utf8").trimStart();
      return head.startsWith("<?xml") || head.startsWith("<svg");
    }
    default:
      return false;
  }
}

/** Detecta el caso más común de foto que el navegador no sabe convertir. */
function isHeic(buffer: Buffer): boolean {
  const brand = buffer.subarray(8, 12).toString();
  return (
    buffer.subarray(4, 8).toString() === "ftyp" &&
    ["heic", "heix", "hevc", "mif1", "heim"].includes(brand)
  );
}

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
    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: `pesa más de 12 MB` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = EXTENSIONS[file.type];

    if (isHeic(buffer)) {
      return Response.json(
        {
          error:
            "es una foto HEIC de iPhone y el navegador no sabe convertirla. " +
            "En el iPhone: Ajustes → Cámara → Formatos → Más compatible, o " +
            "compártela por correo, que la convierte a JPG.",
        },
        { status: 415 },
      );
    }

    if (!extension) {
      return Response.json(
        { error: "no es una imagen admitida (JPG, PNG, WebP o AVIF)" },
        { status: 415 },
      );
    }

    if (!looksLikeImage(buffer, file.type)) {
      return Response.json(
        { error: "no parece una imagen de verdad, aunque tenga esa extensión" },
        { status: 415 },
      );
    }

    const id = randomUUID();

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
              "no se ha podido guardar en Vercel Blob. Comprueba que el Blob " +
              "Store sigue conectado al proyecto.",
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
            "aquí no hay dónde guardar las fotos, así que se incrustan en el " +
            "producto y esta pasa de 1,5 MB. Conecta un Blob Store al proyecto " +
            "en Vercel (Storage → Blob) y dejará de pasar.",
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
