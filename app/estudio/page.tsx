import type { Metadata } from "next";
import Link from "next/link";

import ProductImage from "@/components/product/ProductImage";
import Parallax from "@/components/site/Parallax";
import Reveal from "@/components/site/Reveal";
import { listProducts } from "@/lib/store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La tienda",
  description: `Cómo trabajamos en ${site.name}: pocos modelos, probados antes de entrar y trato directo.`,
};

const VALUES = [
  {
    title: "Pocos modelos",
    body: "No traemos cien referencias. Traemos las que nos ponemos nosotros y sabemos cómo calzan a los tres meses de uso.",
  },
  {
    title: "Probadas antes",
    body: "Cada modelo se anda unos días antes de entrar al catálogo: si talla justo, si el talón baila o si la suela pierde agarre con lluvia.",
  },
  {
    title: "Sin carrito",
    body: "Preferimos hablar. Nos escribes con tu número, te confirmamos si queda y te lo apartamos. Menos devoluciones y menos ruido.",
  },
  {
    title: "Números reales",
    body: "Publicamos la equivalencia de cada número y la medida del pie en centímetros. Si un modelo talla pequeño, lo ponemos en la ficha.",
  },
];

const TIMELINE = [
  ["Selección", "Miramos qué se está haciendo bien y pedimos un par de muestra."],
  ["Prueba", "Las andamos unos días. Si no convencen, no entran."],
  ["Ficha", "Fotos, medidas de cada número y el modelo en 3D."],
  ["Tienda", "Pocos pares por número, sin reposición automática."],
];

export default async function StudioPage() {
  const products = await listProducts();
  const cover = products.find((product) => product.featured) ?? products[0];

  return (
    <>
      <section className="shell pb-14 pt-12 md:pb-20 md:pt-20">
        <p className="label text-stone">
          <span className="text-ember">/</span> La tienda
        </p>
        <h1 className="display-xl mt-6 max-w-5xl text-balance">
          Menos modelos,
          <br />
          <span className="italic text-ember">mejor</span> elegidos.
        </h1>
        <p className="mt-9 max-w-xl text-pretty text-lg text-stone">
          {site.name} abrió en {site.since} en {site.city} con una idea corta: vender
          las zapatillas que nos costaba encontrar, contando de verdad cómo calzan y
          sin empujar a nadie a comprar antes de preguntar.
        </p>
      </section>

      {cover?.images[0] && (
        <div className="relative h-[52svh] overflow-hidden bg-sand md:h-[76svh]">
          <Parallax speed={-0.09} className="absolute -inset-y-16 inset-x-0">
            <div className="relative h-full w-full">
              <ProductImage
                src={cover.images[0].url}
                alt={cover.images[0].alt || cover.name}
                sizes="100vw"
                priority
                className="object-cover"
              />
            </div>
          </Parallax>
        </div>
      )}

      <section className="shell mt-20 md:mt-32">
        <Reveal className="hairline pt-6">
          <h2 className="display-lg max-w-2xl text-balance">Cuatro reglas y ninguna más.</h2>
        </Reveal>
        <dl className="mt-12 grid gap-10 md:grid-cols-2 md:gap-x-16">
          {VALUES.map((value, index) => (
            <Reveal key={value.title} delay={(index % 2) * 90} className="border-t border-ink/12 pt-6">
              <dt className="font-display text-3xl tracking-[-0.02em]">{value.title}</dt>
              <dd className="mt-4 max-w-md text-pretty text-stone">{value.body}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="mt-24 bg-ink py-20 text-bone md:mt-36 md:py-32">
        <div className="shell">
          <Reveal>
            <p className="label text-bone/45">
              <span className="text-ember">↳</span> De la idea a la percha
            </p>
            <h2 className="display-lg mt-6 max-w-2xl text-balance">
              Cuatro pasos, ningún atajo.
            </h2>
          </Reveal>
          <ol className="mt-14 grid gap-8 md:grid-cols-4">
            {TIMELINE.map(([term, description], index) => (
              <Reveal as="li" key={term} delay={index * 90} className="border-t border-bone/20 pt-6">
                <p className="label text-ember">0{index + 1}</p>
                <h3 className="mt-4 font-display text-2xl tracking-[-0.02em]">{term}</h3>
                <p className="mt-3 text-pretty text-sm leading-relaxed text-bone/60">
                  {description}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell mt-24 md:mt-36">
        <Reveal className="grid gap-10 border border-ink/12 p-8 md:grid-cols-12 md:p-14">
          <div className="md:col-span-7">
            <h2 className="display-md text-balance">Pásate a probártelas.</h2>
            <p className="mt-5 max-w-md text-pretty text-stone">
              Tenemos casi todos los números para probar antes de decidir. Si prefieres
              escribir primero, contestamos el mismo día.
            </p>
          </div>
          <address className="space-y-3 not-italic md:col-span-5">
            <p className="label text-stone">Dónde y cuándo</p>
            <p>{site.address}</p>
            <p className="text-stone">{site.hours}</p>
            <a href={`mailto:${site.email}`} className="link-underline block w-fit">
              {site.email}
            </a>
          </address>
        </Reveal>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/tienda"
            className="label bg-ink px-7 py-4.5 text-bone transition-colors duration-300 hover:bg-ember"
          >
            Ver el catálogo
          </Link>
        </div>
      </section>
    </>
  );
}
