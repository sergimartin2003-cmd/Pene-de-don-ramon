import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCard from "@/components/product/ProductCard";
import ProductMedia from "@/components/product/ProductMedia";
import SizePanel from "@/components/product/SizePanel";
import Reveal from "@/components/site/Reveal";
import { isAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/slug";
import { getProductBySlug, listProducts } from "@/lib/store";
import { CATEGORY_LABELS, FIT_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Pieza no encontrada" };

  return {
    title: product.name,
    description: product.description.slice(0, 180),
    openGraph: {
      title: `${product.name} — ${formatPrice(product.price)}`,
      description: product.description.slice(0, 180),
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const admin = await isAdmin();
  if (!product.published && !admin) notFound();

  const others = (await listProducts())
    .filter((item) => item.id !== product.id)
    .sort((a, b) => {
      // Primero las de la misma categoría, después el resto.
      const sameA = a.category === product.category ? 0 : 1;
      const sameB = b.category === product.category ? 0 : 1;
      return sameA - sameB;
    })
    .slice(0, 3);

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <>
      <nav aria-label="Migas de pan" className="shell pb-6 pt-8 md:pt-12">
        <ol className="label flex flex-wrap items-center gap-2 text-stone">
          <li>
            <Link href="/" className="link-underline transition-colors hover:text-ink">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/tienda?categoria=${product.category}`}
              className="link-underline transition-colors hover:text-ink"
            >
              {CATEGORY_LABELS[product.category]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{product.name}</li>
        </ol>
      </nav>

      {!product.published && (
        <div className="shell">
          <p className="label border border-ember/40 bg-ember/8 px-4 py-3 text-ember-dark">
            Borrador · sólo lo ves porque tienes la sesión de administrador abierta.
          </p>
        </div>
      )}

      <article className="shell grid gap-10 pb-16 pt-2 md:grid-cols-12 md:gap-14 md:pb-24">
        <div className="md:col-span-7">
          <div className="md:sticky md:top-28">
            <ProductMedia product={product} />
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="label text-stone">{CATEGORY_LABELS[product.category]}</span>
            {product.badge && (
              <span className="label bg-ink px-2.5 py-1.5 text-bone">{product.badge}</span>
            )}
          </div>

          <h1 className="display-lg mt-4 text-balance">{product.name}</h1>

          <p className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl tracking-[-0.02em] tabular-nums">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-stone line-through tabular-nums">
                {formatPrice(product.compareAtPrice as number)}
              </span>
            )}
          </p>

          {product.description && (
            <div className="mt-7">
              <p className="text-pretty text-lg leading-relaxed">{product.description}</p>
              {product.descriptionByAI && (
                <p className="label mt-3 flex items-center gap-2 text-stone">
                  <span aria-hidden="true" className="text-ember">✦</span>
                  Texto redactado con IA y revisado por nosotros
                </p>
              )}
            </div>
          )}

          <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink/12 pt-7">
            <div>
              <dt className="label text-stone">Color</dt>
              <dd className="mt-2 flex items-center gap-2.5">
                <span
                  className="block size-4 rounded-full border border-ink/15"
                  style={{ background: product.colorHex }}
                  aria-hidden="true"
                />
                {product.colorName || "—"}
              </dd>
            </div>
            <div>
              <dt className="label text-stone">Horma</dt>
              <dd className="mt-2">{FIT_LABELS[product.fit]}</dd>
            </div>
          </dl>

          <SizePanel product={product} />

          {product.details.length > 0 && (
            <section className="mt-12 border-t border-ink/12 pt-7">
              <h2 className="label">Detalles</h2>
              <ul className="mt-4 space-y-2.5">
                {product.details.map((detail) => (
                  <li key={detail} className="flex gap-3 text-pretty text-stone">
                    <span aria-hidden="true" className="mt-2 block size-1 shrink-0 bg-ember" />
                    {detail}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(product.materials.length > 0 || product.care) && (
            <section className="mt-9 border-t border-ink/12 pt-7">
              <h2 className="label">Materiales y cuidado</h2>
              {product.materials.length > 0 && (
                <p className="mt-4 text-pretty text-stone">{product.materials.join(" · ")}</p>
              )}
              {product.care && <p className="mt-2.5 text-pretty text-stone">{product.care}</p>}
            </section>
          )}
        </div>
      </article>

      {others.length > 0 && (
        <section className="shell pb-8">
          <Reveal className="hairline pt-6">
            <div className="flex items-end justify-between gap-6">
              <h2 className="display-md">También en el estudio</h2>
              <Link href="/tienda" className="label link-underline shrink-0 py-1">
                Ver todo →
              </Link>
            </div>
          </Reveal>
          <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 80}>
                <ProductCard product={item} index={index} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
