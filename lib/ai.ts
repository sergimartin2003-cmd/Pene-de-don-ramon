import Anthropic from "@anthropic-ai/sdk";

import { CATEGORY_LABELS, FIT_LABELS, type Category, type Fit } from "./types";

/**
 * Redacción de la descripción de producto con IA.
 *
 * Con ANTHROPIC_API_KEY escribe Claude. Sin clave, un redactor local compone
 * un texto correcto a partir de los atributos de la prenda, para que el panel
 * siga siendo usable y la ficha nunca se quede vacía.
 */

export type DescriptionBrief = {
  name: string;
  category: Category;
  fit: Fit;
  colorName: string;
  materials: string[];
  details: string[];
  care?: string;
  tone?: "editorial" | "directo" | "cercano";
};

export type DescriptionResult = {
  description: string;
  source: "claude" | "local";
};

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `Eres el redactor de una marca española de ropa de calle con acabado premium.
Escribes las descripciones cortas de las fichas de producto.

Reglas:
- Español de España. Entre 30 y 55 palabras. Dos o tres frases.
- Concreto y sensorial: tejido, caída, tacto, cómo sienta. Nada de humo.
- Prohibido: "elevá tu estilo", "must-have", "no te lo pierdas", "en el mundo de la moda", emojis, exclamaciones.
- No inventes datos que no estén en el brief (ni precios, ni origen, ni certificaciones).
- No menciones carrito, compra ni envíos.
- Devuelve solo el texto de la descripción, sin comillas ni títulos.`;

function buildBrief(brief: DescriptionBrief): string {
  const lines = [
    `Prenda: ${brief.name}`,
    `Categoría: ${CATEGORY_LABELS[brief.category] ?? brief.category}`,
    `Corte: ${FIT_LABELS[brief.fit] ?? brief.fit}`,
  ];
  if (brief.colorName) lines.push(`Color: ${brief.colorName}`);
  if (brief.materials?.length) lines.push(`Materiales: ${brief.materials.join(", ")}`);
  if (brief.details?.length) lines.push(`Detalles: ${brief.details.join("; ")}`);
  if (brief.care) lines.push(`Cuidados: ${brief.care}`);
  if (brief.tone) lines.push(`Tono pedido: ${brief.tone}`);
  return lines.join("\n");
}

export async function generateDescription(
  brief: DescriptionBrief,
): Promise<DescriptionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { description: localDescription(brief), source: "local" };

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 320,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildBrief(brief) }],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(" ")
      .trim()
      .replace(/^["“”']|["“”']$/g, "");

    if (!text) return { description: localDescription(brief), source: "local" };
    return { description: text, source: "claude" };
  } catch {
    // Cualquier fallo de red o de cuota cae al redactor local en vez de romper el panel.
    return { description: localDescription(brief), source: "local" };
  }
}

/* ------------------------------------------------------------------ */
/* Redactor local (sin clave de API)                                    */
/* ------------------------------------------------------------------ */

const OPENERS: Record<Category, string[]> = {
  camisetas: [
    "Camiseta de punto compacto que aguanta el lavado sin perder la forma.",
    "Una camiseta pensada para llevarla a diario y que siga cayendo igual.",
  ],
  sudaderas: [
    "Sudadera de felpa densa, con el interior cepillado y peso real en la mano.",
    "Felpa gruesa, costuras limpias y un cuerpo que abriga sin hacer bulto.",
  ],
  pantalones: [
    "Pantalón de tejido firme con caída recta desde la cadera.",
    "Un pantalón con estructura: cae solo y no se arruga al primer día.",
  ],
  chaquetas: [
    "Chaqueta con cuerpo, pensada para la capa de fuera sin renunciar a la movilidad.",
    "Capa exterior de tejido resistente y forro que no da calor de más.",
  ],
  accesorios: [
    "Una pieza pequeña resuelta con el mismo cuidado que el resto de la colección.",
    "Acabado sobrio y materiales que envejecen bien con el uso.",
  ],
};

const FIT_SENTENCES: Record<Fit, string> = {
  slim: "El corte ajustado sigue la línea del cuerpo sin apretar.",
  regular: "El corte regular deja aire suficiente para moverse con soltura.",
  oversize: "El patrón oversize baja el hombro y ensancha el cuerpo para una caída relajada.",
  boxy: "El patrón boxy acorta el largo y ensancha el pecho para una silueta cuadrada.",
};

/** Hash estable: el mismo producto recibe siempre la misma variante. */
function pick<T>(options: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

export function localDescription(brief: DescriptionBrief): string {
  const seed = `${brief.name}${brief.colorName}${brief.fit}`;
  const parts: string[] = [
    pick(OPENERS[brief.category] ?? OPENERS.accesorios, seed),
    FIT_SENTENCES[brief.fit] ?? FIT_SENTENCES.regular,
  ];

  if (brief.materials?.length) {
    parts.push(`Confeccionada en ${brief.materials.join(" y ").toLowerCase()}.`);
  }
  if (brief.details?.length) {
    parts.push(`${brief.details[0].replace(/\.$/, "")}.`);
  }
  if (brief.colorName) {
    parts.push(`Acabado en ${brief.colorName.toLowerCase()}.`);
  }

  return parts.slice(0, 4).join(" ");
}

export function aiIsConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
