import { randomUUID } from "node:crypto";

import { DEFAULT_MODEL_3D, type Product, type SizeChart } from "./types";

/** Catálogo de arranque. Se puede vaciar entero desde /admin sin romper nada. */

/** Tabla de tallas europeas con sus equivalencias. */
const EU_CHART = (
  rows: [string, string, string, string][],
  note = "Talla europea. Mide el pie de talón a dedo más largo, de pie y por la tarde.",
): SizeChart => ({
  columns: [
    { key: "us", label: "US", unit: "" },
    { key: "uk", label: "UK", unit: "" },
    { key: "foot", label: "Pie", unit: "cm" },
  ],
  rows: rows.map(([size, us, uk, foot]) => ({
    size,
    available: true,
    values: { us, uk, foot },
  })),
  note,
});

const FULL_RUN: [string, string, string, string][] = [
  ["39", "6,5", "5,5", "24,5"],
  ["40", "7", "6", "25,0"],
  ["41", "8", "7", "25,5"],
  ["42", "8,5", "7,5", "26,5"],
  ["43", "9,5", "8,5", "27,5"],
  ["44", "10", "9", "28,0"],
  ["45", "11", "10", "29,0"],
  ["46", "12", "11", "29,5"],
];

type SeedSpec = Omit<Product, "id" | "createdAt" | "updatedAt">;

const SPECS: SeedSpec[] = [
  {
    slug: "court-onix",
    name: "Court Ónix",
    category: "lifestyle",
    price: 119,
    compareAtPrice: null,
    colorName: "Negro ónix",
    colorHex: "#16161A",
    fit: "normal",
    sizeAdvice: "Talla normal. Si dudas entre dos, coge la pequeña.",
    materials: ["Piel flor de vacuno", "Forro de algodón", "Suela de caucho"],
    care: "Cepillo suave y jabón neutro. No meter en la lavadora.",
    description:
      "Piel de flor entera que se marca con el uso en vez de pelarse. La horma es limpia y el perfil bajo, así que no engorda el pie. Negro ónix con la suela al tono, sin contrastes.",
    descriptionByAI: true,
    details: ["Corte en una pieza", "Cinco pares de ojales metálicos", "Suela de caucho de 12 mm"],
    images: [
      { id: "onix-1", url: "/uploads/seed/onix-1.svg", alt: "Court Ónix, perfil exterior" },
      { id: "onix-2", url: "/uploads/seed/onix-2.svg", alt: "Court Ónix, perfil interior" },
      { id: "onix-3", url: "/uploads/seed/onix-3.svg", alt: "Detalle del cordonaje de la Court Ónix" },
    ],
    sizeChart: EU_CHART(FULL_RUN),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.3 },
    featured: true,
    published: true,
    badge: "Básico de casa",
  },
  {
    slug: "court-hueso",
    name: "Court Hueso",
    category: "lifestyle",
    price: 119,
    compareAtPrice: null,
    colorName: "Hueso",
    colorHex: "#E8E1D3",
    fit: "normal",
    sizeAdvice: "Talla normal.",
    materials: ["Piel granulada", "Forro de algodón", "Suela de caucho"],
    care: "Limpiar en cuanto se manche: en blanco, la suciedad seca cuesta más.",
    description:
      "El mismo patrón que la Ónix en un hueso cálido que amarillea poco. La piel granulada disimula los roces del día a día y la suela lleva un tono crema, no blanco óptico.",
    descriptionByAI: true,
    details: ["Piel granulada", "Suela en tono crema", "Costura de refuerzo en la puntera"],
    images: [
      { id: "hueso-1", url: "/uploads/seed/hueso-1.svg", alt: "Court Hueso, perfil exterior" },
      { id: "hueso-2", url: "/uploads/seed/hueso-2.svg", alt: "Court Hueso, perfil interior" },
      { id: "hueso-3", url: "/uploads/seed/hueso-3.svg", alt: "Detalle del cordonaje de la Court Hueso" },
    ],
    sizeChart: EU_CHART(FULL_RUN),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.3 },
    featured: false,
    published: true,
    badge: null,
  },
  {
    slug: "runner-bruma",
    name: "Runner Bruma",
    category: "running",
    price: 139,
    compareAtPrice: 165,
    colorName: "Gris bruma",
    colorHex: "#8C8880",
    fit: "estrecha",
    sizeAdvice: "Va justa de largo: pide media talla más.",
    materials: ["Malla técnica sin costuras", "Mediasuela de espuma EVA", "Suela de caucho"],
    care: "Lavar a mano con agua tibia. Secar a la sombra, nunca al sol.",
    description:
      "Malla de una pieza que sujeta sin apretar el empeine y una mediasuela de espuma que amortigua de verdad en asfalto. La horma es estrecha, sobre todo en el antepié. Gris bruma cálido.",
    descriptionByAI: true,
    details: ["Mediasuela de 32 mm en el talón", "Talonera reforzada", "Peso: 265 g en la talla 42"],
    images: [
      { id: "bruma-1", url: "/uploads/seed/bruma-1.svg", alt: "Runner Bruma, perfil exterior" },
      { id: "bruma-2", url: "/uploads/seed/bruma-2.svg", alt: "Runner Bruma, perfil interior" },
      { id: "bruma-3", url: "/uploads/seed/bruma-3.svg", alt: "Detalle de la malla de la Runner Bruma" },
    ],
    sizeChart: EU_CHART(FULL_RUN, "Modelo de horma estrecha: si tienes el pie ancho, sube una talla."),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.28 },
    featured: true,
    published: true,
    badge: "Última talla 43",
  },
  {
    slug: "runner-brasa",
    name: "Runner Brasa",
    category: "running",
    price: 145,
    compareAtPrice: null,
    colorName: "Rojo brasa",
    colorHex: "#B4441F",
    fit: "normal",
    sizeAdvice: "Talla normal.",
    materials: ["Malla técnica", "Mediasuela de espuma EVA", "Suela de caucho con tacos"],
    care: "Lavar a mano. Quitar la plantilla para que seque antes.",
    description:
      "Un rojo brasa que se ve de lejos, sobre la misma base de espuma que la Bruma pero con la horma más ancha en el antepié. La suela lleva tacos bajos, así que agarra también en tierra.",
    descriptionByAI: true,
    details: ["Tacos de 3 mm", "Plantilla extraíble", "Refuerzo en la puntera"],
    images: [
      { id: "brasa-1", url: "/uploads/seed/brasa-1.svg", alt: "Runner Brasa, perfil exterior" },
      { id: "brasa-2", url: "/uploads/seed/brasa-2.svg", alt: "Runner Brasa, perfil interior" },
      { id: "brasa-3", url: "/uploads/seed/brasa-3.svg", alt: "Detalle de la suela de la Runner Brasa" },
    ],
    sizeChart: EU_CHART(FULL_RUN),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.28 },
    featured: true,
    published: true,
    badge: "Nuevo",
  },
  {
    slug: "skate-sombra",
    name: "Skate Sombra",
    category: "skate",
    price: 109,
    compareAtPrice: null,
    colorName: "Verde sombra",
    colorHex: "#4A4E3D",
    fit: "ancha",
    sizeAdvice: "Horma ancha: si tienes el pie estrecho, baja media talla.",
    materials: ["Ante grueso de 1,8 mm", "Suela vulcanizada", "Refuerzo interior en el ollie"],
    care: "Cepillo de ante en seco. El agua deja cerco.",
    description:
      "Ante de 1,8 milímetros donde más raspa la lija, con refuerzo cosido por dentro para que aguante el ollie. Suela vulcanizada de dibujo fino, plana y con tacto. Verde sombra apagado.",
    descriptionByAI: true,
    details: ["Refuerzo interior en la zona del ollie", "Suela vulcanizada", "Lengüeta acolchada"],
    images: [
      { id: "sombra-1", url: "/uploads/seed/sombra-1.svg", alt: "Skate Sombra, perfil exterior" },
      { id: "sombra-2", url: "/uploads/seed/sombra-2.svg", alt: "Skate Sombra, perfil interior" },
      { id: "sombra-3", url: "/uploads/seed/sombra-3.svg", alt: "Detalle del ante de la Skate Sombra" },
    ],
    sizeChart: EU_CHART(FULL_RUN.slice(0, 7)),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.3 },
    featured: true,
    published: true,
    badge: null,
  },
  {
    slug: "skate-duna",
    name: "Skate Duna",
    category: "skate",
    price: 105,
    compareAtPrice: null,
    colorName: "Arena duna",
    colorHex: "#B9A88C",
    fit: "ancha",
    sizeAdvice: "Horma ancha. Talla normal de largo.",
    materials: ["Ante y lona", "Suela vulcanizada"],
    care: "Cepillo de ante. Lavar la lona a mano.",
    description:
      "Ante en las zonas de roce y lona en el resto, así que pesa menos y respira mejor en verano. La suela es la misma vulcanizada, plana y con dibujo de espiga. Arena cálida.",
    descriptionByAI: true,
    details: ["Panel de lona en el cuello", "Ojales metálicos", "Dibujo de espiga en la suela"],
    images: [
      { id: "duna-1", url: "/uploads/seed/duna-1.svg", alt: "Skate Duna, perfil exterior" },
      { id: "duna-2", url: "/uploads/seed/duna-2.svg", alt: "Skate Duna, perfil interior" },
    ],
    sizeChart: EU_CHART(FULL_RUN.slice(0, 7)),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.3 },
    featured: false,
    published: true,
    badge: null,
  },
  {
    slug: "alta-taller",
    name: "Alta Taller",
    category: "basket",
    price: 159,
    compareAtPrice: null,
    colorName: "Azul taller",
    colorHex: "#232B33",
    fit: "normal",
    sizeAdvice: "Talla normal. La caña sujeta el tobillo, no aprieta.",
    materials: ["Piel y nobuk", "Mediasuela de espuma", "Suela de caucho de espiga"],
    care: "Paño húmedo. Airear la caña después de usarlas.",
    description:
      "Bota alta con la caña acolchada por dentro para que sujete el tobillo sin cortar. Piel arriba y nobuk en los laterales, que aguanta mejor los golpes. Azul taller casi negro con luz baja.",
    descriptionByAI: true,
    details: ["Caña acolchada", "Ocho pares de ojales", "Suela de espiga"],
    images: [
      { id: "taller-1", url: "/uploads/seed/taller-1.svg", alt: "Alta Taller, perfil exterior" },
      { id: "taller-2", url: "/uploads/seed/taller-2.svg", alt: "Alta Taller, perfil interior" },
      { id: "taller-3", url: "/uploads/seed/taller-3.svg", alt: "Detalle de la caña de la Alta Taller" },
    ],
    sizeChart: EU_CHART(FULL_RUN),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.32 },
    featured: true,
    published: true,
    badge: "Edición corta",
  },
  {
    slug: "plantillas-sello",
    name: "Plantillas Sello",
    category: "accesorios",
    price: 24,
    compareAtPrice: null,
    colorName: "Negro ónix",
    colorHex: "#16161A",
    fit: "normal",
    sizeAdvice: "Se recortan por la guía para ajustarlas a tu talla.",
    materials: ["Espuma de memoria", "Base antideslizante", "Textil transpirable"],
    care: "Airear cada semana. Lavar a mano con agua fría.",
    description:
      "Espuma de memoria de 6 milímetros con una base que no baila dentro de la zapatilla. Vienen de más para recortarlas por la guía impresa hasta tu talla exacta.",
    descriptionByAI: true,
    details: ["Espuma de 6 mm", "Guía de recorte impresa", "Base antideslizante"],
    images: [
      { id: "sello-1", url: "/uploads/seed/sello-1.svg", alt: "Plantillas Sello, par completo" },
      { id: "sello-2", url: "/uploads/seed/sello-2.svg", alt: "Plantillas Sello, vista de la base" },
    ],
    sizeChart: {
      columns: [{ key: "range", label: "Tallas que cubre", unit: "" }],
      rows: [
        { size: "S", available: true, values: { range: "38 - 41" } },
        { size: "M", available: true, values: { range: "42 - 44" } },
        { size: "L", available: true, values: { range: "45 - 47" } },
      ],
      note: "Cada talla se recorta por la guía impresa hasta el número exacto.",
    },
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.08 },
    featured: false,
    published: true,
    badge: null,
  },
];

export function seedProducts(): Product[] {
  const base = Date.parse("2026-08-01T10:00:00.000Z");
  return SPECS.map((spec, index) => {
    // Fechas escalonadas para que el orden "más reciente primero" sea estable.
    const createdAt = new Date(base + index * 3_600_000).toISOString();
    return { ...spec, id: randomUUID(), createdAt, updatedAt: createdAt };
  });
}
