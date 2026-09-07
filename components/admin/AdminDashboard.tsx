"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductForm from "@/components/admin/ProductForm";
import { formatPrice } from "@/lib/slug";
import { site } from "@/lib/site";
import { CATEGORY_LABELS, type Product } from "@/lib/types";

type Props = {
  initialProducts: Product[];
  aiConfigured: boolean;
  /** false cuando el alojamiento no tiene disco y los cambios no sobreviven. */
  persistent: boolean;
};

type View = { mode: "list" } | { mode: "edit"; product: Product | null };

export default function AdminDashboard({ initialProducts, aiConfigured, persistent }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [view, setView] = useState<View>({ mode: "list" });
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const sortNewestFirst = (list: Product[]) =>
    [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSaved = (saved: Product) => {
    setProducts((current) => {
      const exists = current.some((product) => product.id === saved.id);
      return sortNewestFirst(
        exists
          ? current.map((product) => (product.id === saved.id ? saved : product))
          : [saved, ...current],
      );
    });
    setView({ mode: "list" });
    setFlash(`«${saved.name}» guardado.`);
    // La tienda se renderiza en el servidor: hay que refrescar su caché de ruta.
    router.refresh();
  };

  const remove = async (product: Product) => {
    setBusy(product.id);
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se ha podido borrar.");
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setFlash(`«${product.name}» eliminado.`);
      router.refresh();
    } catch (cause) {
      setFlash(cause instanceof Error ? cause.message : "No se ha podido borrar.");
    } finally {
      setBusy(null);
      setPendingDelete(null);
    }
  };

  const duplicate = async (product: Product) => {
    setBusy(product.id);
    try {
      const { id: _id, createdAt: _c, updatedAt: _u, slug: _s, ...rest } = product;
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, name: `${product.name} (copia)`, published: false }),
      });
      const payload = (await response.json()) as { product?: Product; error?: string };
      if (!response.ok || !payload.product) {
        throw new Error(payload.error ?? "No se ha podido duplicar.");
      }
      setProducts((current) => sortNewestFirst([payload.product as Product, ...current]));
      setFlash(`Copia de «${product.name}» creada como borrador.`);
      router.refresh();
    } catch (cause) {
      setFlash(cause instanceof Error ? cause.message : "No se ha podido duplicar.");
    } finally {
      setBusy(null);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  const published = products.filter((product) => product.published).length;

  return (
    <div className="min-h-dvh bg-bone">
      <header className="sticky top-0 z-50 border-b border-ink/12 bg-bone/92 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl tracking-[-0.03em]">{site.name}</span>
            <span className="label text-ember">Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="label border border-ink/20 px-4 py-2.5 transition-colors hover:border-ink"
            >
              Ver la tienda ↗
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="label px-3 py-2.5 text-stone transition-colors hover:text-ink"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="shell py-10 md:py-14">
        {!persistent && (
          <p className="mb-8 border border-ember/40 bg-ember/8 px-4 py-3 text-sm text-ember-dark">
            <strong className="font-medium">Modo demostración.</strong> Este
            alojamiento no tiene disco donde guardar, así que puedes probarlo todo
            pero los cambios se perderán al reiniciar el servidor.
          </p>
        )}
        {flash && (
          <p className="mb-8 flex items-center justify-between gap-4 border border-ink/15 bg-sand/50 px-4 py-3 text-sm">
            {flash}
            <button
              type="button"
              onClick={() => setFlash(null)}
              className="label shrink-0 text-stone"
            >
              ✕
            </button>
          </p>
        )}

        {view.mode === "edit" ? (
          <ProductForm
            key={view.product?.id ?? "nuevo"}
            product={view.product}
            aiConfigured={aiConfigured}
            onSaved={handleSaved}
            onCancel={() => setView({ mode: "list" })}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="display-lg">Productos</h1>
                <p className="mt-4 text-stone">
                  {products.length} en total · {published} visibles ·{" "}
                  {products.length - published} en borrador
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView({ mode: "edit", product: null })}
                className="label bg-ink px-7 py-4 text-bone transition-colors hover:bg-ember"
              >
                + Añadir producto
              </button>
            </div>

            {products.length === 0 ? (
              <div className="mt-12 border border-dashed border-ink/25 px-6 py-24 text-center">
                <p className="display-md">Todavía no hay nada.</p>
                <p className="mx-auto mt-4 max-w-sm text-pretty text-stone">
                  Crea el primer producto: sube las fotos, deja que la IA escriba la
                  descripción y define el tallaje.
                </p>
                <button
                  type="button"
                  onClick={() => setView({ mode: "edit", product: null })}
                  className="label mt-8 bg-ink px-7 py-4 text-bone transition-colors hover:bg-ember"
                >
                  + Añadir el primero
                </button>
              </div>
            ) : (
              <ul className="mt-10 border-t border-ink/12">
                {products.map((product) => {
                  const sizesLeft = product.sizeChart.rows.filter((row) => row.available).length;
                  const confirming = pendingDelete === product.id;

                  return (
                    <li
                      key={product.id}
                      className="flex flex-col gap-4 border-b border-ink/12 py-4 sm:flex-row sm:items-center"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]?.url ?? ""}
                        alt=""
                        className="h-24 w-20 shrink-0 bg-sand object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="font-display text-xl tracking-[-0.02em]">
                            {product.name}
                          </h2>
                          {!product.published && (
                            <span className="label border border-ink/25 px-2 py-1 text-stone">
                              Borrador
                            </span>
                          )}
                          {product.featured && (
                            <span className="label bg-ember/12 px-2 py-1 text-ember-dark">
                              Destacado
                            </span>
                          )}
                        </div>
                        <p className="label mt-2 text-stone">
                          {CATEGORY_LABELS[product.category]} · {formatPrice(product.price)} ·{" "}
                          {product.images.length}{" "}
                          {product.images.length === 1 ? "foto" : "fotos"} · {sizesLeft} de{" "}
                          {product.sizeChart.rows.length} tallas
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <Link
                          href={`/producto/${product.slug}`}
                          target="_blank"
                          className="label border border-ink/20 px-3.5 py-2.5 transition-colors hover:border-ink"
                        >
                          Ver ↗
                        </Link>
                        <button
                          type="button"
                          onClick={() => void duplicate(product)}
                          disabled={busy === product.id}
                          className="label border border-ink/20 px-3.5 py-2.5 transition-colors hover:border-ink disabled:opacity-40"
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => setView({ mode: "edit", product })}
                          className="label bg-ink px-4 py-2.5 text-bone transition-colors hover:bg-ember"
                        >
                          Editar
                        </button>

                        {confirming ? (
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void remove(product)}
                              disabled={busy === product.id}
                              className="label bg-ember px-3.5 py-2.5 text-bone disabled:opacity-40"
                            >
                              {busy === product.id ? "Borrando…" : "Sí, borrar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(null)}
                              className="label border border-ink/20 px-3 py-2.5"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(product.id)}
                            className="label border border-ink/20 px-3.5 py-2.5 text-ember transition-colors hover:border-ember"
                          >
                            Borrar
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
