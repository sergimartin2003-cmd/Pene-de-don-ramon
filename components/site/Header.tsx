"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { site } from "@/lib/site";
import { CATEGORY_LABELS, CATEGORIES } from "@/lib/types";

const NAV = [
  { href: "/tienda", label: "Catálogo" },
  { href: "/estudio", label: "Nosotros" },
  { href: "/tienda#tallas", label: "Tu número" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // El menú a pantalla completa bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled
            ? "border-b border-ink/10 bg-bone/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="shell flex h-16 items-center justify-between gap-6 md:h-20">
          <Link
            href="/"
            className="font-display text-xl leading-none tracking-[-0.03em] md:text-2xl"
            aria-label={`${site.name}, ir al inicio`}
          >
            {site.name}
            <span className="text-ember">.</span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Principal">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`label link-underline py-1 transition-colors ${
                  pathname === item.href ? "text-ember" : "text-ink hover:text-ember"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/tienda"
              className="label bg-ink px-5 py-3 text-bone transition-colors duration-300 hover:bg-ember"
            >
              Ver catálogo
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="label flex items-center gap-2.5 py-2 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
          >
            Menú
            <span className="flex flex-col gap-[5px]" aria-hidden="true">
              <span className="block h-px w-5 bg-ink" />
              <span className="block h-px w-5 bg-ink" />
            </span>
          </button>
        </div>
      </header>

      {/* Menú a pantalla completa en móvil */}
      <div
        id="menu-movil"
        className={`fixed inset-0 z-[65] bg-ink text-bone transition-[opacity,visibility] duration-500 md:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="shell flex h-16 items-center justify-between">
          <span className="font-display text-xl tracking-[-0.03em]">{site.name}</span>
          <button type="button" onClick={() => setMenuOpen(false)} className="label py-2">
            Cerrar ✕
          </button>
        </div>

        <nav className="shell mt-6 flex flex-col" aria-label="Navegación móvil">
          {NAV.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="display-md border-b border-bone/15 py-5"
              style={{
                animation: menuOpen
                  ? `var(--animate-rise) ${index * 70 + 90}ms both`
                  : undefined,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="shell mt-8">
          <p className="label text-bone/45">Categorías</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <li key={category}>
                <Link
                  href={`/tienda?categoria=${category}`}
                  className="label block border border-bone/25 px-4 py-2.5 text-bone/80"
                >
                  {CATEGORY_LABELS[category]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="shell absolute inset-x-0 bottom-8">
          <p className="label text-bone/45">{site.city}</p>
          <a href={`mailto:${site.email}`} className="mt-1 block text-lg text-bone/85">
            {site.email}
          </a>
          <Link
            href="/admin"
            className="label mt-5 inline-block border border-bone/25 px-4 py-2.5 text-bone/70"
          >
            Panel de gestión
          </Link>
        </div>
      </div>
    </>
  );
}
