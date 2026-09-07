"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import ProductImage from "@/components/product/ProductImage";
import type { Product } from "@/lib/types";

// El visor arrastra three.js: se carga sólo cuando hace falta y nunca en el servidor.
const Product3DViewer = dynamic(() => import("@/components/three/Product3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-square place-items-center bg-sand/60">
      <span className="block h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-ember" />
    </div>
  ),
});

type Props = { product: Product };

export default function ProductMedia({ product }: Props) {
  const [tab, setTab] = useState<"fotos" | "3d">("fotos");
  const [current, setCurrent] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const images = product.images;
  const active = images[Math.min(current, images.length - 1)];
  const show3D = product.model3d.enabled && (images.length > 0 || product.model3d.glbUrl);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      if (event.key === "ArrowRight") setCurrent((i) => (i + 1) % images.length);
      if (event.key === "ArrowLeft") setCurrent((i) => (i - 1 + images.length) % images.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomed, images.length]);

  if (images.length === 0) {
    return <div className="aspect-square bg-sand" aria-hidden="true" />;
  }

  return (
    <div>
      {show3D && (
        <div
          className="mb-3 flex w-fit gap-1 bg-sand/70 p-1"
          role="tablist"
          aria-label="Cómo ver el producto"
        >
          {(["fotos", "3d"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`label px-4 py-2.5 transition-colors duration-300 ${
                tab === value ? "bg-ink text-bone" : "text-stone hover:text-ink"
              }`}
            >
              {value === "fotos" ? `Fotos · ${images.length}` : "Modelo 3D"}
            </button>
          ))}
        </div>
      )}

      {tab === "fotos" ? (
        <div>
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-sand"
            aria-label="Ampliar la foto"
          >
            <ProductImage
              src={active.url}
              alt={active.alt || product.name}
              sizes="(max-width: 1024px) 100vw, 52vw"
              priority
              className="object-cover"
            />
          </button>

          {images.length > 1 && (
            <div className="scrollbar-thin mt-3 flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Ver la foto ${index + 1} de ${images.length}`}
                  aria-current={index === current}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden bg-sand transition-opacity duration-300 md:w-24 ${
                    index === current ? "opacity-100" : "opacity-45 hover:opacity-80"
                  }`}
                >
                  <ProductImage
                    src={image.url}
                    alt={image.alt || `${product.name}, foto ${index + 1}`}
                    sizes="96px"
                    className="object-cover"
                  />
                  {index === current && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ember" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <Product3DViewer
            images={images}
            depth={product.model3d.depth}
            tolerance={product.model3d.backgroundTolerance}
            sourceIndex={product.model3d.sourceImageIndex}
            source={product.model3d.source}
            glbUrl={product.model3d.glbUrl}
            className="aspect-square w-full"
          />
          <p className="mt-3 text-sm leading-relaxed text-stone">
            Modelo generado a partir de las fotos de la zapatilla. Sirve para hacerse
            con el volumen y el perfil; el color de referencia son las fotos.
          </p>
        </div>
      )}

      {zoomed && (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-ink/96 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name}, foto ampliada`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <span className="label text-bone/60">
              {current + 1} / {images.length}
            </span>
            <button type="button" onClick={() => setZoomed(false)} className="label text-bone">
              Cerrar ✕
            </button>
          </div>
          <div className="relative flex-1">
            <ProductImage
              src={active.url}
              alt={active.alt || product.name}
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 py-5">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Foto ${index + 1}`}
                  className={`h-1.5 w-8 transition-colors ${
                    index === current ? "bg-bone" : "bg-bone/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
