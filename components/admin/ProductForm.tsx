"use client";

import { useMemo, useState } from "react";

import { Field, Section, Toggle, inputClass } from "@/components/admin/Field";
import ImageUploader from "@/components/admin/ImageUploader";
import Model3DPanel from "@/components/admin/Model3DPanel";
import SizeChartEditor from "@/components/admin/SizeChartEditor";
import { formatPrice } from "@/lib/slug";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DEFAULT_MODEL_3D,
  DEFAULT_SIZE_CHART,
  FITS,
  FIT_LABELS,
  type Product,
  type ProductInput,
} from "@/lib/types";

type Props = {
  /** null = producto nuevo. */
  product: Product | null;
  aiConfigured: boolean;
  onSaved: (product: Product) => void;
  onCancel: () => void;
};

type Draft = ProductInput;

function emptyDraft(): Draft {
  return {
    name: "",
    category: "camisetas",
    price: 0,
    compareAtPrice: null,
    colorName: "",
    colorHex: "#111114",
    fit: "regular",
    materials: [],
    care: "",
    description: "",
    descriptionByAI: false,
    details: [],
    images: [],
    sizeChart: structuredClone(DEFAULT_SIZE_CHART),
    model3d: { ...DEFAULT_MODEL_3D },
    featured: false,
    published: true,
    badge: null,
  };
}

function toDraft(product: Product): Draft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = product;
  return structuredClone(rest);
}

/** Las listas se editan como texto, una línea por elemento. */
const toLines = (values: string[]) => values.join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function ProductForm({ product, aiConfigured, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => (product ? toDraft(product) : emptyDraft()));
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const patch = (values: Partial<Draft>) => setDraft((current) => ({ ...current, ...values }));

  const problems = useMemo(() => {
    const list: string[] = [];
    if (!draft.name.trim()) list.push("Falta el nombre.");
    if (!(draft.price > 0)) list.push("Falta el precio.");
    if (draft.images.length === 0) list.push("Falta al menos una foto.");
    if (draft.sizeChart.rows.length === 0) list.push("Falta al menos una talla.");
    return list;
  }, [draft]);

  const generateDescription = async () => {
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          category: draft.category,
          fit: draft.fit,
          colorName: draft.colorName,
          materials: draft.materials,
          details: draft.details,
          care: draft.care,
        }),
      });
      const payload = (await response.json()) as {
        description?: string;
        source?: "claude" | "local";
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "No se ha podido generar el texto.");

      patch({ description: payload.description ?? "", descriptionByAI: true });
      setNotice(
        payload.source === "claude"
          ? "Texto escrito por Claude. Revísalo y ajústalo si hace falta."
          : "Texto compuesto sin conexión con la IA (no hay clave configurada). Puedes editarlo a mano.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se ha podido generar el texto.");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (problems.length > 0) {
      setError(problems.join(" "));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        product ? `/api/products/${product.id}` : "/api/products",
        {
          method: product ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      const payload = (await response.json()) as { product?: Product; error?: string };
      if (!response.ok || !payload.product) {
        throw new Error(payload.error ?? "No se ha podido guardar.");
      }
      onSaved(payload.product);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se ha podido guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="pb-40"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-stone">{product ? "Editando" : "Nuevo producto"}</p>
          <h2 className="display-md mt-3">{draft.name || "Sin nombre todavía"}</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="label border border-ink/20 px-5 py-3 transition-colors hover:border-ink"
        >
          ← Volver al listado
        </button>
      </div>

      <div className="mt-10 space-y-10">
        {/* Básicos */}
        <Section title="Lo básico" description="Lo que aparece en la parrilla y en la cabecera de la ficha.">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Nombre" htmlFor="nombre" className="md:col-span-2">
              <input
                id="nombre"
                type="text"
                value={draft.name}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder="Camiseta Ónix"
                className={inputClass}
                required
              />
            </Field>

            <Field label="Categoría" htmlFor="categoria">
              <select
                id="categoria"
                value={draft.category}
                onChange={(event) =>
                  patch({ category: event.target.value as Draft["category"] })
                }
                className={inputClass}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Corte" htmlFor="corte">
              <select
                id="corte"
                value={draft.fit}
                onChange={(event) => patch({ fit: event.target.value as Draft["fit"] })}
                className={inputClass}
              >
                {FITS.map((fit) => (
                  <option key={fit} value={fit}>
                    {FIT_LABELS[fit]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Precio (€)"
              htmlFor="precio"
              hint={draft.price > 0 ? `Se mostrará como ${formatPrice(draft.price)}` : undefined}
            >
              <input
                id="precio"
                type="number"
                min={0}
                step="0.01"
                value={draft.price || ""}
                onChange={(event) => patch({ price: Number(event.target.value) })}
                className={inputClass}
                required
              />
            </Field>

            <Field
              label="Precio anterior (€)"
              htmlFor="precio-antes"
              hint="Opcional. Aparece tachado al lado del precio."
            >
              <input
                id="precio-antes"
                type="number"
                min={0}
                step="0.01"
                value={draft.compareAtPrice ?? ""}
                onChange={(event) =>
                  patch({
                    compareAtPrice: event.target.value ? Number(event.target.value) : null,
                  })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Nombre del color" htmlFor="color-nombre">
              <input
                id="color-nombre"
                type="text"
                value={draft.colorName}
                onChange={(event) => patch({ colorName: event.target.value })}
                placeholder="Negro ónix"
                className={inputClass}
              />
            </Field>

            <Field label="Muestra de color" htmlFor="color-hex">
              <div className="flex gap-2">
                <input
                  id="color-hex"
                  type="color"
                  value={draft.colorHex}
                  onChange={(event) => patch({ colorHex: event.target.value })}
                  className="h-12 w-16 shrink-0 cursor-pointer border border-ink/20 bg-bone p-1"
                />
                <input
                  type="text"
                  value={draft.colorHex}
                  onChange={(event) => patch({ colorHex: event.target.value })}
                  className={inputClass}
                  aria-label="Código del color en hexadecimal"
                />
              </div>
            </Field>

            <Field
              label="Etiqueta"
              htmlFor="etiqueta"
              hint="Opcional. Un texto corto sobre la foto: «Nuevo», «Última talla L»…"
            >
              <input
                id="etiqueta"
                type="text"
                value={draft.badge ?? ""}
                onChange={(event) => patch({ badge: event.target.value || null })}
                className={inputClass}
              />
            </Field>

            <div className="flex flex-col justify-end gap-4 md:col-span-2">
              <Toggle
                checked={draft.published}
                onChange={(published) => patch({ published })}
                label="Visible en la tienda"
                hint="Apágalo para dejarlo en borrador mientras lo preparas."
              />
              <Toggle
                checked={draft.featured}
                onChange={(featured) => patch({ featured })}
                label="Destacado en la portada"
              />
            </div>
          </div>
        </Section>

        {/* Fotos */}
        <Section
          title="Fotos"
          description="Puedes subir varias. La primera manda en la parrilla y es la que usa el 3D por defecto."
        >
          <ImageUploader images={draft.images} onChange={(images) => patch({ images })} />
        </Section>

        {/* Descripción */}
        <Section
          title="Descripción"
          description="La escribe la IA a partir de los datos de arriba. Puedes retocarla después."
          action={
            <button
              type="button"
              onClick={() => void generateDescription()}
              disabled={generating || !draft.name.trim()}
              className="label bg-ink px-5 py-3 text-bone transition-colors hover:bg-ember disabled:opacity-40"
            >
              {generating ? "Escribiendo…" : "✦ Generar con IA"}
            </button>
          }
        >
          <textarea
            value={draft.description}
            onChange={(event) =>
              patch({ description: event.target.value, descriptionByAI: false })
            }
            rows={5}
            placeholder="Rellena el nombre, el corte y los materiales y pulsa «Generar con IA»."
            className={`${inputClass} resize-y leading-relaxed`}
            aria-label="Descripción del producto"
          />
          <p className="mt-2 text-xs text-stone">
            {draft.descriptionByAI
              ? "Marcado como texto de IA: en la ficha se avisa de ello."
              : "Texto escrito o editado a mano."}
            {!aiConfigured && " · Sin ANTHROPIC_API_KEY el texto lo compone el redactor local."}
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field
              label="Detalles"
              htmlFor="detalles"
              hint="Uno por línea. Salen como lista en la ficha."
            >
              <textarea
                id="detalles"
                value={toLines(draft.details)}
                onChange={(event) => patch({ details: fromLines(event.target.value) })}
                rows={4}
                placeholder={"Cuello acanalado reforzado\nCostura lateral abierta"}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label="Materiales" htmlFor="materiales" hint="Uno por línea.">
              <textarea
                id="materiales"
                value={toLines(draft.materials)}
                onChange={(event) => patch({ materials: fromLines(event.target.value) })}
                rows={4}
                placeholder={"Algodón orgánico 100%\nPunto de 240 g/m²"}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label="Cuidados" htmlFor="cuidados" className="md:col-span-2">
              <input
                id="cuidados"
                type="text"
                value={draft.care}
                onChange={(event) => patch({ care: event.target.value })}
                placeholder="Lavar a 30°, del revés. No usar secadora."
                className={inputClass}
              />
            </Field>
          </div>
        </Section>

        <SizeChartEditor
          chart={draft.sizeChart}
          onChange={(sizeChart) => patch({ sizeChart })}
        />

        <Model3DPanel
          config={draft.model3d}
          images={draft.images}
          onChange={(model3d) => patch({ model3d })}
        />
      </div>

      {/* Barra fija de guardado */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/12 bg-bone/95 backdrop-blur-xl">
        <div className="shell flex flex-wrap items-center gap-3 py-4">
          <div className="min-w-0 flex-1">
            {error ? (
              <p className="text-sm text-ember-dark">{error}</p>
            ) : notice ? (
              <p className="text-sm text-stone">{notice}</p>
            ) : problems.length > 0 ? (
              <p className="text-sm text-stone">Falta por rellenar: {problems.join(" ")}</p>
            ) : (
              <p className="text-sm text-stone">Todo listo para guardar.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="label border border-ink/20 px-5 py-3.5 transition-colors hover:border-ink"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || problems.length > 0}
            className="label bg-ink px-7 py-3.5 text-bone transition-colors hover:bg-ember disabled:opacity-40"
          >
            {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
