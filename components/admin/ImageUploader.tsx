"use client";

import { upload as uploadToBlob } from "@vercel/blob/client";
import { useId, useRef, useState } from "react";

import type { ProductImage } from "@/lib/types";

/**
 * Lado máximo al que se reduce una foto antes de subirla.
 *
 * No es por el límite del alojamiento: con subida directa al almacén el peso ya
 * no estorba. Es por quien visita la tienda, que se descargaría megas de más.
 * A 2600 px se puede ampliar la foto a pantalla completa y sigue nítida.
 */
const MAX_SIDE = 2600;
const QUALITY = 0.9;
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;
const MAX_FOTOS = 12;

/**
 * Si la subida no avanza en este tiempo, se corta.
 *
 * Es un tope al parón, no a la duración: mientras entren bytes, una foto grande
 * por una línea lenta puede tardar lo que necesite. Lo que no puede es quedarse
 * en «Subiendo…» para siempre porque el almacén no conteste, que es justo lo
 * que pasaba: los reintentos del SDK no atienden a la señal de cancelación.
 */
const STALL_MS = 20_000;

type Progreso = (porcentaje: number) => void;

async function subirAlAlmacen(
  pathname: string,
  file: File,
  onProgreso: Progreso,
): Promise<string> {
  const controller = new AbortController();
  let ultimoAvance = Date.now();
  let vigilante: ReturnType<typeof setInterval> | undefined;

  const seHaParado = new Promise<never>((_, reject) => {
    vigilante = setInterval(() => {
      if (Date.now() - ultimoAvance > STALL_MS) {
        controller.abort();
        reject(new Error("el almacén no responde. Comprueba el Blob Store del proyecto"));
      }
    }, 2000);
  });

  try {
    const blob = await Promise.race([
      uploadToBlob(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/blob",
        contentType: file.type,
        // Trocea los ficheros grandes y reintenta sólo la parte que falle.
        multipart: file.size > 8 * 1024 * 1024,
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }: { percentage: number }) => {
          ultimoAvance = Date.now();
          onProgreso(percentage);
        },
      }),
      seHaParado,
    ]);
    return blob.url;
  } finally {
    clearInterval(vigilante);
  }
}

/** Reduce y recomprime en el navegador. Si no se puede, devuelve el original. */
async function prepare(file: File): Promise<File> {
  // Los SVG no se rasterizan: son vectoriales y ya pesan poco.
  if (file.type === "image/svg+xml") return file;

  // Si el navegador no sabe decodificarlo (HEIC de iPhone, por ejemplo) se
  // manda tal cual y que el servidor conteste con un motivo claro.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(
    () => null,
  );
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= KEEP_AS_IS_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
    type: "image/jpeg",
  });
}

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  /** true cuando hay Blob: la foto va del navegador al almacén, sin intermediario. */
  directo: boolean;
};

/** Subida de varias fotos, con reordenación y texto alternativo por imagen. */
export default function ImageUploader({ images, onChange, directo }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Se sube foto a foto, no todas en una petición: así una que falle no tira
   * abajo las demás, y el cuerpo de cada petición se mantiene pequeño.
   */
  const upload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setError(null);
    const hueco = MAX_FOTOS - images.length;
    if (hueco <= 0) {
      setError(`Máximo ${MAX_FOTOS} fotos por producto.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const added: ProductImage[] = [];
    const fallos: string[] = files.length > hueco
      ? [`sólo caben ${hueco} foto(s) más: el resto se ha descartado`]
      : [];
    files.length = Math.min(files.length, hueco);

    for (const [index, original] of files.entries()) {
      setBusy(`Subiendo ${index + 1} de ${files.length}…`);
      try {
        const file = await prepare(original);

        if (directo) {
          const id = crypto.randomUUID();
          const extension = file.type === "image/svg+xml" ? ".svg" : ".jpg";
          const url = await subirAlAlmacen(`fotos/${id}${extension}`, file, (porcentaje) =>
            setBusy(
              `Subiendo ${index + 1} de ${files.length}… ${Math.round(porcentaje)}%`,
            ),
          );
          added.push({ id, url, alt: "" });
          continue;
        }

        const body = new FormData();
        body.append("files", file);

        const response = await fetch("/api/upload", { method: "POST", body });

        // Un 413 del alojamiento no llega como JSON: hay que contemplarlo.
        const payload = await response
          .json()
          .catch(() => ({}) as { images?: ProductImage[]; error?: string });

        if (!response.ok) {
          throw new Error(
            payload.error ??
              (response.status === 413
                ? "el alojamiento ha rechazado el envío por tamaño"
                : `el servidor ha respondido ${response.status}`),
          );
        }
        added.push(...(payload.images ?? []));
      } catch (cause) {
        fallos.push(
          `«${original.name}»: ${cause instanceof Error ? cause.message : "fallo al subir"}`,
        );
      }
    }

    if (added.length > 0) onChange([...images, ...added]);
    if (fallos.length > 0) setError(fallos.join(" · "));
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const setAlt = (index: number, alt: string) => {
    onChange(images.map((image, i) => (i === index ? { ...image, alt } : image)));
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
        className={`border border-dashed p-8 text-center transition-colors duration-300 ${
          dragging ? "border-ember bg-ember/6" : "border-ink/25 bg-sand/35"
        }`}
      >
        <p className="text-sm">
          {busy ?? "Arrastra aquí las fotos o"}{" "}
          {!busy && (
            <label
              htmlFor={inputId}
              className="cursor-pointer underline decoration-ember underline-offset-4"
            >
              búscalas en el ordenador
            </label>
          )}
        </p>
        <p className="mt-2 text-xs text-stone">
          JPG, PNG, WebP o AVIF, del tamaño que sean: se reducen solas a 2600 px
          antes de subirse, así que da igual que vengan del móvil. La primera es
          la que se ve en la parrilla y la que usa el 3D.
        </p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => event.target.files && void upload(event.target.files)}
        />
      </div>

      {error && (
        <p className="mt-3 border border-ember/40 bg-ember/8 px-3.5 py-2.5 text-sm text-ember-dark">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="mt-5 space-y-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="flex flex-col gap-3 border border-ink/12 p-3 sm:flex-row sm:items-center"
            >
              {/* Miniatura sin next/image: la fuente cambia en caliente al subir. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="h-24 w-20 shrink-0 bg-sand object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="label flex items-center gap-2 text-stone">
                  {index === 0 ? <span className="text-ember">Principal</span> : `Foto ${index + 1}`}
                </p>
                <input
                  type="text"
                  value={image.alt}
                  placeholder="Describe la foto (para accesibilidad y buscadores)"
                  onChange={(event) => setAlt(index, event.target.value)}
                  className="mt-2 w-full border border-ink/20 bg-bone px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="label border border-ink/20 px-2.5 py-2 disabled:opacity-30"
                  aria-label={`Subir la foto ${index + 1}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === images.length - 1}
                  className="label border border-ink/20 px-2.5 py-2 disabled:opacity-30"
                  aria-label={`Bajar la foto ${index + 1}`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="label border border-ink/20 px-2.5 py-2 text-ember transition-colors hover:border-ember"
                  aria-label={`Quitar la foto ${index + 1}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
