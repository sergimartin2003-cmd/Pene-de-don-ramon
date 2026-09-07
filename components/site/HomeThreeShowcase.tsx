"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { formatPrice } from "@/lib/slug";
import type { Product } from "@/lib/types";

const Product3DViewer = dynamic(() => import("@/components/three/Product3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-square place-items-center bg-sand/60 md:aspect-square">
      <span className="block h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-ember" />
    </div>
  ),
});

const NOTES = [
  ["Perfil", "Se recorta de la propia foto, sin plantillas."],
  ["Volumen", "El grosor lo ajustamos modelo a modelo en el panel."],
  ["Material", "Relieve de trama para que no parezca cartón."],
];

export default function HomeThreeShowcase({ product }: { product: Product }) {
  return (
    <div className="grid gap-8 border border-ink/12 p-4 md:grid-cols-12 md:gap-12 md:p-8">
      <div className="md:col-span-7">
        <Product3DViewer
          images={product.images}
          depth={product.model3d.depth}
          tolerance={product.model3d.backgroundTolerance}
          sourceIndex={product.model3d.sourceImageIndex}
          source={product.model3d.source}
          glbUrl={product.model3d.glbUrl}
          className="aspect-square w-full md:aspect-square"
        />
      </div>

      <div className="flex flex-col justify-between md:col-span-5">
        <div>
          <p className="label text-stone">En pantalla</p>
          <h3 className="display-md mt-4">{product.name}</h3>
          <p className="mt-3 text-stone">{formatPrice(product.price)}</p>
          <p className="mt-6 text-pretty text-stone">{product.description}</p>
        </div>

        <dl className="mt-10 space-y-5">
          {NOTES.map(([term, description]) => (
            <div key={term} className="border-t border-ink/12 pt-4">
              <dt className="label text-ink">{term}</dt>
              <dd className="mt-1.5 text-sm text-stone">{description}</dd>
            </div>
          ))}
        </dl>

        <Link
          href={`/producto/${product.slug}`}
          className="label mt-10 block bg-ink px-6 py-4.5 text-center text-bone transition-colors duration-300 hover:bg-ember"
        >
          Ver la ficha completa
        </Link>
      </div>
    </div>
  );
}
