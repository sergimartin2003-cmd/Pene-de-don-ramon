"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Marquee from "@/components/site/Marquee";
import { site } from "@/lib/site";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="mt-28 bg-ink text-bone md:mt-40">
      <Marquee
        items={[site.claim, "Pocos pares por número", "Del 39 al 46", "Atendemos por WhatsApp"]}
        className="border-b border-bone/12 text-bone/55"
      />

      <div className="shell grid gap-14 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <p className="font-display text-4xl leading-[0.95] tracking-[-0.03em] md:text-6xl">
            {site.name}
            <span className="text-ember">.</span>
          </p>
          <p className="mt-5 max-w-sm text-balance text-bone/60">{site.description}</p>
          <p className="label mt-8 text-bone/40">Desde {site.since} · {site.city}</p>
        </div>

        <nav className="md:col-span-3" aria-label="Categorías">
          <p className="label text-bone/40">Catálogo</p>
          <ul className="mt-5 space-y-3">
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  href={`/tienda?categoria=${category}`}
                  className="link-underline text-bone/80 transition-colors hover:text-bone"
                >
                  {CATEGORY_LABELS[category]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <p className="label text-bone/40">Tienda</p>
          <address className="mt-5 space-y-3 not-italic text-bone/80">
            <p>{site.address}</p>
            <p className="text-bone/55">{site.hours}</p>
            <a href={`mailto:${site.email}`} className="link-underline block w-fit">
              {site.email}
            </a>
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="link-underline block w-fit"
            >
              Instagram
            </a>
          </address>
        </div>
      </div>

      <div className="shell flex flex-col gap-4 border-t border-bone/12 py-7 text-bone/45 sm:flex-row sm:items-center sm:justify-between">
        <p className="label">
          © {new Date().getFullYear()} {site.name}
        </p>
        <div className="label flex items-center gap-6">
          <Link href="/estudio" className="transition-colors hover:text-bone">
            Nosotros
          </Link>
          <Link href="/admin" className="transition-colors hover:text-bone">
            Panel de gestión
          </Link>
        </div>
      </div>
    </footer>
  );
}
