"use client";

import dynamic from "next/dynamic";

import { Field, Section, Toggle, inputClass } from "@/components/admin/Field";
import type { Model3DConfig, ProductImage } from "@/lib/types";

const Product3DViewer = dynamic(() => import("@/components/three/Product3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="grid aspect-square place-items-center bg-sand/60">
      <span className="block h-7 w-7 animate-spin rounded-full border-2 border-ink/15 border-t-ember" />
    </div>
  ),
});

type Props = {
  config: Model3DConfig;
  images: ProductImage[];
  onChange: (config: Model3DConfig) => void;
};

export default function Model3DPanel({ config, images, onChange }: Props) {
  const patch = (values: Partial<Model3DConfig>) => onChange({ ...config, ...values });

  return (
    <Section
      title="Modelo 3D"
      description="A partir de la foto se recorta la silueta de la prenda y se le da volumen. Se ve el resultado aquí mismo, en directo."
    >
      <Toggle
        checked={config.enabled}
        onChange={(enabled) => patch({ enabled })}
        label="Mostrar la pestaña 3D en la ficha"
        hint="Si lo apagas, el cliente sólo verá las fotos."
      />

      {config.enabled && (
        <div className="mt-7 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Field label="Origen del modelo">
              <div className="flex gap-1.5">
                {(["auto", "glb"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch({ source: value })}
                    className={`label border px-4 py-3 transition-colors ${
                      config.source === value
                        ? "border-ink bg-ink text-bone"
                        : "border-ink/20 hover:border-ink"
                    }`}
                  >
                    {value === "auto" ? "Desde las fotos" : "Archivo GLB"}
                  </button>
                ))}
              </div>
            </Field>

            {config.source === "glb" ? (
              <Field
                label="URL del archivo .glb"
                htmlFor="glb-url"
                hint="Para cuando tengas un escaneo real de la prenda. Si lo dejas vacío se usan las fotos."
              >
                <input
                  id="glb-url"
                  type="url"
                  value={config.glbUrl ?? ""}
                  onChange={(event) => patch({ glbUrl: event.target.value || null })}
                  placeholder="https://…/prenda.glb"
                  className={inputClass}
                />
              </Field>
            ) : (
              <>
                <Field
                  label="Foto de partida"
                  htmlFor="foto-3d"
                  hint="Funciona mejor con una foto frontal y fondo liso."
                >
                  <select
                    id="foto-3d"
                    value={config.sourceImageIndex}
                    onChange={(event) =>
                      patch({ sourceImageIndex: Number(event.target.value) })
                    }
                    className={inputClass}
                    disabled={images.length === 0}
                  >
                    {images.length === 0 && <option>Sube antes alguna foto</option>}
                    {images.map((image, index) => (
                      <option key={image.id} value={index}>
                        Foto {index + 1}
                        {index === 0 ? " (principal)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label={`Grosor de la prenda · ${config.depth.toFixed(2)}`}
                  htmlFor="grosor-3d"
                  hint="Bajo para una camiseta, alto para una chaqueta o una gorra."
                >
                  <input
                    id="grosor-3d"
                    type="range"
                    min={0.02}
                    max={0.4}
                    step={0.01}
                    value={config.depth}
                    onChange={(event) => patch({ depth: Number(event.target.value) })}
                    className="w-full accent-ember"
                  />
                </Field>

                <Field
                  label={`Recorte del fondo · ${config.backgroundTolerance}`}
                  htmlFor="recorte-3d"
                  hint="Súbelo si se cuela fondo en el modelo; bájalo si desaparecen partes de la prenda."
                >
                  <input
                    id="recorte-3d"
                    type="range"
                    min={0}
                    max={160}
                    step={1}
                    value={config.backgroundTolerance}
                    onChange={(event) =>
                      patch({ backgroundTolerance: Number(event.target.value) })
                    }
                    className="w-full accent-ember"
                  />
                </Field>
              </>
            )}
          </div>

          <div>
            <p className="label mb-2 text-stone">Vista previa</p>
            {images.length === 0 && config.source === "auto" ? (
              <div className="grid aspect-square place-items-center border border-dashed border-ink/25 bg-sand/40 p-6 text-center">
                <p className="text-sm text-stone">
                  Sube una foto y el modelo aparecerá aquí.
                </p>
              </div>
            ) : (
              <Product3DViewer
                // Al cambiar los ajustes se reconstruye desde cero.
                key={`${config.source}-${config.sourceImageIndex}-${config.backgroundTolerance}-${images[0]?.url ?? ""}`}
                images={images}
                depth={config.depth}
                tolerance={config.backgroundTolerance}
                sourceIndex={config.sourceImageIndex}
                source={config.source}
                glbUrl={config.glbUrl}
                className="aspect-square w-full border border-ink/12"
              />
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
