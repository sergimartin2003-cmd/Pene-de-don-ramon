import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { isAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB por foto
const MAX_FILES = 12;

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

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
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
    const filename = `${id}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    uploaded.push({ id, url: `/uploads/${filename}`, alt: "" });
  }

  return Response.json({ images: uploaded }, { status: 201 });
}
