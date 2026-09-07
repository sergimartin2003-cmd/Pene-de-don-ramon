import Link from "next/link";

import ProductImage from "@/components/product/ProductImage";
import { formatPrice } from "@/lib/slug";
import { CATEGORY_LABELS, type Product } from "@/lib/types";

type Props = {
  product: Product;
  priority?: boolean;
  /** Índice en la parrilla, sólo para el número de la etiqueta. */
  index?: number;
};

/** Ficha de la parrilla. La tarjeta entera es un enlace: se toca donde se toque. */
export default function ProductCard({ product, priority, index }: Props) {
  const [first, second] = product.images;
  const hasSecond = Boolean(second && second.url !== first?.url);
  const soldOut = product.sizeChart.rows.every((row) => !row.available);

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={`${product.name}, ${formatPrice(product.price)}`}
    >
      <div className="relative aspect-4/5 overflow-hidden bg-sand transition-colors duration-500 group-focus-visible:ring-2 group-focus-visible:ring-ember group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-bone">
        {first && (
          <ProductImage
            src={first.url}
            alt={first.alt || product.name}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            priority={priority}
            className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04] ${
              hasSecond ? "group-hover:opacity-0" : ""
            }`}
          />
        )}

        {hasSecond && (
          <ProductImage
            src={second.url}
            alt={second.alt || `${product.name}, segunda vista`}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover opacity-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04] group-hover:opacity-100"
          />
        )}

        <span className="label absolute left-3 top-3 text-ink/35">
          {String((index ?? 0) + 1).padStart(2, "0")}
        </span>

        {product.badge && !soldOut && (
          <span className="label absolute right-3 top-3 bg-ink px-2.5 py-1.5 text-bone">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="label absolute right-3 top-3 bg-bone px-2.5 py-1.5 text-ink">
            Agotado
          </span>
        )}

        {/* Aviso de 3D: sólo aparece al pasar por encima, no ensucia la parrilla. */}
        {product.model3d.enabled && (
          <span className="label absolute bottom-3 left-3 translate-y-2 bg-bone/85 px-2.5 py-1.5 text-ink opacity-0 backdrop-blur transition-[opacity,transform] duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            Ver en 3D
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg leading-tight tracking-[-0.02em]">
            {product.name}
          </h3>
          <p className="label mt-1 text-stone">
            {CATEGORY_LABELS[product.category]} · {product.colorName || "—"}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="tabular-nums">{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="ml-2 text-sm text-stone line-through tabular-nums">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
