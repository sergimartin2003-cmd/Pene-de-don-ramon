"use client";

import { useState } from "react";

import { mailtoLink, whatsappLink } from "@/lib/site";
import type { Product } from "@/lib/types";

type Props = { product: Product };

/**
 * Tallas y consulta de disponibilidad.
 * No hay carrito: la talla elegida viaja en el mensaje de WhatsApp o de correo.
 */
export default function SizePanel({ product }: Props) {
  const rows = product.sizeChart.rows;
  const available = rows.filter((row) => row.available);
  const [size, setSize] = useState<string | null>(
    available.length === 1 ? available[0].size : null,
  );
  const [chartOpen, setChartOpen] = useState(false);

  const selected = rows.find((row) => row.size === size) ?? null;
  const soldOut = available.length === 0;

  return (
    <section aria-labelledby="tallas" className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="tallas" className="label">
          Talla
        </h2>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => setChartOpen((open) => !open)}
            className="label link-underline text-stone transition-colors hover:text-ink"
            aria-expanded={chartOpen}
            aria-controls="tabla-tallas"
          >
            {chartOpen ? "Ocultar medidas" : "Ver medidas"}
          </button>
        )}
      </div>

      {soldOut ? (
        <p className="mt-4 border border-ink/12 bg-sand/50 p-4 text-sm text-stone">
          Ahora mismo no queda ninguna talla. Escríbenos y te avisamos si vuelve a
          entrar.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {rows.map((row) => {
            const isSelected = row.size === size;
            return (
              <button
                key={row.size}
                type="button"
                disabled={!row.available}
                onClick={() => setSize(isSelected ? null : row.size)}
                aria-pressed={isSelected}
                className={`label min-w-14 border px-4 py-3.5 transition-[background-color,border-color,color] duration-300 ${
                  !row.available
                    ? "cursor-not-allowed border-ink/10 text-ink/25 line-through"
                    : isSelected
                      ? "border-ink bg-ink text-bone"
                      : "border-ink/20 text-ink hover:border-ink"
                }`}
              >
                {row.size}
              </button>
            );
          })}
        </div>
      )}

      {/* Medidas de la talla marcada, para no obligar a abrir la tabla entera. */}
      {selected && product.sizeChart.columns.length > 0 && (
        <p className="mt-3 text-sm text-stone">
          Talla {selected.size}:{" "}
          {product.sizeChart.columns
            .map((column) => `${column.label} ${selected.values[column.key] ?? "—"} ${column.unit}`)
            .join(" · ")}
        </p>
      )}

      {chartOpen && rows.length > 0 && (
        <div id="tabla-tallas" className="mt-5 overflow-x-auto border border-ink/12">
          <table className="w-full min-w-[26rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Medidas de {product.name} por talla
            </caption>
            <thead>
              <tr className="bg-sand/70">
                <th scope="col" className="label px-4 py-3 font-medium">
                  Talla
                </th>
                {product.sizeChart.columns.map((column) => (
                  <th key={column.key} scope="col" className="label px-4 py-3 font-medium">
                    {column.label} <span className="text-stone">({column.unit})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.size}
                  className={`border-t border-ink/10 ${
                    row.size === size ? "bg-ember/8" : ""
                  } ${row.available ? "" : "text-ink/35"}`}
                >
                  <th scope="row" className="px-4 py-3 font-medium">
                    {row.size}
                    {!row.available && (
                      <span className="label ml-2 text-stone">agotada</span>
                    )}
                  </th>
                  {product.sizeChart.columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 tabular-nums">
                      {row.values[column.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {product.sizeChart.note && (
            <p className="border-t border-ink/10 bg-sand/40 px-4 py-3 text-sm text-stone">
              {product.sizeChart.note}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappLink(product.name, size ?? undefined)}
          target="_blank"
          rel="noreferrer noopener"
          className="label flex-1 bg-ink px-6 py-4.5 text-center text-bone transition-colors duration-300 hover:bg-ember"
        >
          Consultar por WhatsApp
        </a>
        <a
          href={mailtoLink(product.name, size ?? undefined)}
          className="label flex-1 border border-ink/25 px-6 py-4.5 text-center transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-bone"
        >
          Escribir un correo
        </a>
      </div>

      <p className="mt-3 text-sm text-stone">
        {size
          ? `Te escribimos con la talla ${size} ya puesta en el mensaje.`
          : "Elige una talla y la añadimos al mensaje. También puedes preguntar sin elegirla."}
      </p>
    </section>
  );
}
