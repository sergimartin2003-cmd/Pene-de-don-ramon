import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/product/ProductCard";
import Reveal from "@/components/site/Reveal";
import { listProducts } from "@/lib/store";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Todos los modelos disponibles, con la equivalencia de cada número y su modelo en 3D.",
};

const SORTS = {
  nuevo: { label: "Novedades", compare: (a: Product, b: Product) => b.createdAt.localeCompare(a.createdAt) },
  barato: { label: "Precio ↑", compare: (a: Product, b: Product) => a.price - b.price },
  caro: { label: "Precio ↓", compare: (a: Product, b: Product) => b.price - a.price },
} as const;

type SortKey = keyof typeof SORTS;

const MEASURE_GUIDE = [
  {
    title: "Mide el pie",
    body: "Talón contra la pared, un folio debajo y una marca en el dedo más largo. Mide esa distancia en centímetros, de pie y por la tarde: el pie se hincha a lo largo del día.",
  },
  {
    title: "Los dos pies",
    body: "Casi nadie los tiene iguales. Mide los dos y quédate con el número mayor de los dos.",
  },
  {
    title: "Medio centímetro",
    body: "Deja ese hueco entre el dedo más largo y la puntera. Sin él, cuesta abajo los dedos chocan contra el final de la zapatilla.",
  },
  {
    title: "Entre dos números",
    body: "Si el modelo tiene la horma estrecha, sube. Si es ancha, o vas a llevar calcetín grueso, baja. En cada ficha ponemos cuál es.",
  },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; orden?: string }>;
}) {
  const params = await searchParams;
  const products = await listProducts();

  const category = CATEGORIES.includes(params.categoria as Category)
    ? (params.categoria as Category)
    : null;
  const sort: SortKey = params.orden && params.orden in SORTS ? (params.orden as SortKey) : "nuevo";

  const filtered = products
    .filter((product) => !category || product.category === category)
    .sort(SORTS[sort].compare);

  const buildHref = (next: { categoria?: string | null; orden?: string }) => {
    const query = new URLSearchParams();
    const nextCategory = next.categoria === undefined ? category : next.categoria;
    const nextSort = next.orden ?? sort;
    if (nextCategory) query.set("categoria", nextCategory);
    if (nextSort !== "nuevo") query.set("orden", nextSort);
    const search = query.toString();
    return search ? `/tienda?${search}` : "/tienda";
  };

  return (
    <>
      <section className="shell pb-10 pt-12 md:pb-14 md:pt-20">
        <p className="label text-stone">
          <span className="text-ember">/</span> Tienda
        </p>
        <h1 className="display-lg mt-5 max-w-3xl text-balance">
          {category ? CATEGORY_LABELS[category] : "Todo el catálogo"}
        </h1>
        <p className="mt-6 max-w-lg text-pretty text-stone">
          {filtered.length} {filtered.length === 1 ? "modelo disponible" : "modelos disponibles"}.
          Toca cualquiera para ver sus fotos, girarla en 3D y comprobar qué número te
          toca.
        </p>
      </section>

      {/* Filtros: enlaces normales, así funcionan sin JavaScript y se pueden compartir. */}
      <div className="sticky top-16 z-40 border-y border-ink/12 bg-bone/90 backdrop-blur-xl md:top-20">
        <div className="shell flex items-center gap-4 overflow-x-auto py-3.5">
          <nav className="scrollbar-thin flex items-center gap-1.5" aria-label="Filtrar por categoría">
            <Link
              href={buildHref({ categoria: null })}
              aria-current={category === null}
              className={`label whitespace-nowrap border px-4 py-2.5 transition-colors duration-300 ${
                category === null
                  ? "border-ink bg-ink text-bone"
                  : "border-ink/15 text-stone hover:border-ink hover:text-ink"
              }`}
            >
              Todo
            </Link>
            {CATEGORIES.map((value) => (
              <Link
                key={value}
                href={buildHref({ categoria: value })}
                aria-current={category === value}
                className={`label whitespace-nowrap border px-4 py-2.5 transition-colors duration-300 ${
                  category === value
                    ? "border-ink bg-ink text-bone"
                    : "border-ink/15 text-stone hover:border-ink hover:text-ink"
                }`}
              >
                {CATEGORY_LABELS[value]}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1.5 pl-6 sm:flex">
            {(Object.keys(SORTS) as SortKey[]).map((key) => (
              <Link
                key={key}
                href={buildHref({ orden: key })}
                aria-current={sort === key}
                className={`label whitespace-nowrap px-3 py-2.5 transition-colors duration-300 ${
                  sort === key ? "text-ember" : "text-stone hover:text-ink"
                }`}
              >
                {SORTS[key].label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="shell py-14 md:py-20">
        {filtered.length === 0 ? (
          <div className="border border-ink/12 px-6 py-20 text-center">
            <p className="display-md">Aquí no hay nada todavía.</p>
            <p className="mx-auto mt-5 max-w-sm text-pretty text-stone">
              Esta categoría está vacía ahora mismo. Echa un vistazo al resto del
              catálogo.
            </p>
            <Link
              href="/tienda"
              className="label mt-8 inline-block bg-ink px-7 py-4 text-bone transition-colors hover:bg-ember"
            >
              Ver todo
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => (
              <Reveal as="li" key={product.id} delay={(index % 3) * 80}>
                <ProductCard product={product} index={index} priority={index < 3} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      <section id="tallas" className="shell scroll-mt-32 pb-8">
        <Reveal className="hairline pt-6">
          <p className="label flex items-center gap-3 text-stone">
            <span className="text-ember">↳</span> Guía de tallas
          </p>
          <h2 className="display-lg mt-5 max-w-2xl text-balance">
            Cómo saber tu número.
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-stone">
            Cada ficha lleva su propia tabla, porque no todos los modelos tallan igual.
            Mide el pie una vez y compáralo con la columna de centímetros.
          </p>
        </Reveal>

        <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {MEASURE_GUIDE.map((item, index) => (
            <Reveal key={item.title} delay={index * 70} className="border-t border-ink/12 pt-5">
              <dt className="font-display text-2xl tracking-[-0.02em]">{item.title}</dt>
              <dd className="mt-3 text-pretty text-sm leading-relaxed text-stone">{item.body}</dd>
            </Reveal>
          ))}
        </dl>
      </section>
    </>
  );
}
