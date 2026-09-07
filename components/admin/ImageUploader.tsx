"use client";

import { useId, useRef, useState } from "react";

import type { ProductImage } from "@/lib/types";

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
};

/** Subida de varias fotos, con reordenación y texto alternativo por imagen. */
export default function ImageUploader({ images, onChange }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      files.forEach((file) => body.append("files", file));
      const response = await fetch("/api/upload", { method: "POST", body });
      const payload = (await response.json()) as {
        images?: ProductImage[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "No se han podido subir las fotos.");
      onChange([...images, ...(payload.images ?? [])]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se han podido subir las fotos.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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
          {busy ? "Subiendo…" : "Arrastra aquí las fotos o"}{" "}
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
          JPG, PNG, WebP, AVIF o SVG. Hasta 12 MB por foto. La primera es la que se
          ve en la parrilla.
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
