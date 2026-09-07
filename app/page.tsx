import Link from "next/link";

import Marquee from "@/components/site/Marquee";
import Parallax from "@/components/site/Parallax";
import Reveal from "@/components/site/Reveal";
import SectionHeading from "@/components/site/SectionHeading";
import ProductCard from "@/components/product/ProductCard";
import ProductImage from "@/components/product/ProductImage";
import HomeThreeShowcase from "@/components/site/HomeThreeShowcase";
import { listProducts } from "@/lib/store";
import { site } from "@/lib/site";
import { CATEGORIES, CATEGORY_LABELS, type Product } from "@/lib/types";

// El catálogo se edita desde /admin, así que la portada se calcula en cada visita.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    index: "01",
    title: "Mira el modelo",
    body: "Cada zapatilla tiene sus fotos, su modelo en 3D para girarlo y la equivalencia real de cada número.",
  },
  {
    index: "02",
    title: "Escríbenos",
    body: "Aquí no hay carrito. Nos preguntas por WhatsApp o por correo con tu número.",
  },
  {
    index: "03",
    title: "Te las apartamos",
    body: "Te confirmamos si queda tu número, las apartamos y quedamos para recogerlas en la tienda o te las enviamos.",
  },
];

export default async function HomePage() {
  const products = await listProducts();
  const featured = products.filter((product) => product.featured).slice(0, 6);
  const grid = (featured.length >= 3 ? featured : products).slice(0, 6);
  const hero = grid[0] ?? products[0];
  const editorial = grid[1] ?? hero;
  const showcase = grid.find((product) => product.model3d.enabled) ?? hero;

  return (
    <>
      <Hero product={hero} count={products.length} />

      <Marquee
        items={[site.claim, "Números del 39 al 46", "Sin carrito, trato directo", "Cada par en 3D"]}
        className="bg-ink text-bone/60"
      />

      {/* Selección */}
      <section className="shell mt-20 md:mt-32">
        <SectionHeading
          index="01"
          eyebrow="Selección"
          title="Lo que hay ahora en tienda"
          intro="Traemos pocos pares de cada modelo. Cuando un número se acaba, no siempre vuelve."
          action={
            <Link
              href="/tienda"
              className="label link-underline inline-flex items-center gap-2 py-1"
            >
              Ver los {products.length} modelos
              <span aria-hidden="true">→</span>
            </Link>
          }
        />

        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((product, index) => (
            <Reveal as="li" key={product.id} delay={(index % 3) * 90}>
              <ProductCard product={product} index={index} priority={index < 3} />
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Editorial */}
      <section className="mt-24 bg-ink py-20 text-bone md:mt-36 md:py-32">
        <div className="shell grid items-center gap-12 md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-6">
            <p className="label flex items-center gap-3 text-bone/45">
              <span className="text-ember">02</span> La tienda
            </p>
            <h2 className="display-lg mt-6 text-balance">
              Pocos modelos,
              <br />
              todos andados antes.
            </h2>
            <p className="mt-7 max-w-md text-pretty text-bone/65">
              Nada entra al catálogo sin habérnoslo puesto unos días. Así sabemos si
              talla justo, si el talón baila, si el ante se pela o si la suela pierde
              agarro con lluvia. Por eso no verás cien referencias: verás las que nos
              ponemos nosotros.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-bone/15 pt-8">
              {[
                ["Desde", String(site.since)],
                ["Modelos", `${products.length}`],
                ["Tienda", site.city],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="label text-bone/40">{term}</dt>
                  <dd className="mt-2 font-display text-3xl tracking-[-0.02em]">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/estudio"
              className="label link-underline mt-10 inline-flex items-center gap-2"
            >
              Conocer la tienda <span aria-hidden="true">→</span>
            </Link>
          </Reveal>

          {editorial?.images[0] && (
            <Reveal className="md:col-span-6" delay={120}>
              <div className="relative aspect-square overflow-hidden bg-ink-soft md:aspect-square">
                <Parallax speed={-0.06} className="absolute -inset-y-10 inset-x-0">
                  <div className="relative h-full w-full">
                    <ProductImage
                      src={editorial.images[0].url}
                      alt={editorial.images[0].alt || editorial.name}
                      sizes="(max-width: 768px) 100vw, 46vw"
                      className="object-cover"
                    />
                  </div>
                </Parallax>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* 3D */}
      <section className="shell mt-24 md:mt-36">
        <SectionHeading
          index="03"
          eyebrow="Modelo 3D"
          title="Gírala antes de preguntar."
          intro="A partir de las fotos reconstruimos la zapatilla en tres dimensiones. Se arrastra con el dedo o con el ratón, se acerca y se ve el perfil y el volumen que una foto plana no cuenta."
        />
        {showcase && (
          <Reveal className="mt-12">
            <HomeThreeShowcase product={showcase} />
          </Reveal>
        )}
      </section>

      {/* Categorías */}
      <section className="shell mt-24 md:mt-36">
        <SectionHeading index="04" eyebrow="Categorías" title="Empieza por aquí" />
        <ul className="mt-10">
          {CATEGORIES.map((category, index) => {
            const count = products.filter((p) => p.category === category).length;
            return (
              <Reveal as="li" key={category} delay={index * 55}>
                <Link
                  href={`/tienda?categoria=${category}`}
                  className="group flex items-center justify-between gap-6 border-t border-ink/12 py-6 transition-colors duration-500 hover:border-ink/40 md:py-8"
                >
                  <span className="display-md transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="label flex items-center gap-5 text-stone">
                    {count} {count === 1 ? "modelo" : "modelos"}
                    <span
                      className="text-ember transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-2"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Cómo funciona */}
      <section className="shell mt-24 md:mt-36">
        <SectionHeading
          index="05"
          eyebrow="Cómo funciona"
          title="Tres pasos y ya está."
          intro="No hay carrito ni registro. Se mira, se pregunta y se recoge."
        />
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.index} delay={index * 100} className="hairline pt-6">
              <p className="font-display text-5xl text-ember">{step.index}</p>
              <h3 className="mt-5 font-display text-2xl tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-3 text-pretty text-stone">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Cierre */}
      <section className="shell mt-24 md:mt-36">
        <Reveal className="bg-sand/70 px-6 py-16 text-center md:px-16 md:py-24">
          <p className="label text-stone">¿Dudas con el número?</p>
          <h2 className="display-lg mx-auto mt-5 max-w-2xl text-balance">
            Dinos cuánto te mide el pie.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-pretty text-stone">
            Con la medida en centímetros te decimos qué número coger en cada modelo.
            No todos tallan igual, y eso no sale en la caja.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/tienda"
              className="label bg-ink px-7 py-4.5 text-bone transition-colors duration-300 hover:bg-ember"
            >
              Ver el catálogo
            </Link>
            <a
              href={`mailto:${site.email}`}
              className="label border border-ink/25 px-7 py-4.5 transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-bone"
            >
              {site.email}
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function Hero({ product, count }: { product?: Product; count: number }) {
  return (
    <section className="shell relative -mt-16 flex min-h-[94svh] flex-col justify-end pb-12 pt-28 md:-mt-20 md:pb-16 md:pt-32">
      <div className="grid items-end gap-10 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-7">
          <p className="label animate-[var(--animate-rise)] text-stone">
            {site.tagline} · {site.city}
          </p>
          <h1
            className="display-xl mt-6 animate-[var(--animate-rise)] text-balance"
            style={{ animationDelay: "90ms" }}
          >
            Pocas zapas,
            <br />
            <span className="italic text-ember">bien</span> elegidas.
          </h1>
          <p
            className="mt-8 max-w-md animate-[var(--animate-rise)] text-pretty text-lg text-stone"
            style={{ animationDelay: "180ms" }}
          >
            {site.claim} Míralas en 3D, mira qué número te toca en cada una y
            escríbenos. Sin carrito, sin cuentas, sin prisa.
          </p>
          <div
            className="mt-10 flex animate-[var(--animate-rise)] flex-wrap items-center gap-3"
            style={{ animationDelay: "260ms" }}
          >
            <Link
              href="/tienda"
              className="label bg-ink px-7 py-4.5 text-bone transition-colors duration-300 hover:bg-ember"
            >
              Ver {count} modelos
            </Link>
            <Link
              href="/estudio"
              className="label border border-ink/25 px-7 py-4.5 transition-colors duration-300 hover:border-ink"
            >
              Nosotros
            </Link>
          </div>
        </div>

        {product?.images[0] && (
          <div className="md:col-span-5">
            <Link
              href={`/producto/${product.slug}`}
              className="group block animate-[var(--animate-rise)]"
              style={{ animationDelay: "220ms" }}
            >
              <div className="relative aspect-square overflow-hidden bg-sand">
                <ProductImage
                  src={product.images[0].url}
                  alt={product.images[0].alt || product.name}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                  className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
                />
                <span className="label absolute bottom-4 left-4 bg-bone/85 px-3 py-2 backdrop-blur">
                  Destacado
                </span>
              </div>
              <p className="label mt-3 flex items-center justify-between text-stone">
                {product.name}
                <span aria-hidden="true" className="text-ember">→</span>
              </p>
            </Link>
          </div>
        )}
      </div>

      <p className="label mt-14 hidden items-center gap-3 text-stone md:flex">
        <span className="block h-px w-12 bg-ink/25" />
        Desliza
      </p>
    </section>
  );
}
