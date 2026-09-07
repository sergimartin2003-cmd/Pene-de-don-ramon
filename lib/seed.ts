import { randomUUID } from "node:crypto";

import { DEFAULT_MODEL_3D, type Product, type SizeChart } from "./types";

/** Catálogo de arranque. Se puede vaciar entero desde /admin sin romper nada. */

const TOP_CHART = (rows: [string, string, string, string][]): SizeChart => ({
  columns: [
    { key: "chest", label: "Pecho", unit: "cm" },
    { key: "length", label: "Largo", unit: "cm" },
    { key: "sleeve", label: "Manga", unit: "cm" },
  ],
  rows: rows.map(([size, chest, length, sleeve]) => ({
    size,
    available: true,
    values: { chest, length, sleeve },
  })),
  note: "Medidas de la prenda en plano, con una tolerancia de ±1 cm.",
});

const PANT_CHART = (rows: [string, string, string, string][]): SizeChart => ({
  columns: [
    { key: "waist", label: "Cintura", unit: "cm" },
    { key: "hip", label: "Cadera", unit: "cm" },
    { key: "inseam", label: "Entrepierna", unit: "cm" },
  ],
  rows: rows.map(([size, waist, hip, inseam]) => ({
    size,
    available: true,
    values: { waist, hip, inseam },
  })),
  note: "Cintura medida en plano y multiplicada por dos. Tolerancia de ±1,5 cm.",
});

type SeedSpec = Omit<Product, "id" | "createdAt" | "updatedAt">;

const SPECS: SeedSpec[] = [
  {
    slug: "camiseta-onix",
    name: "Camiseta Ónix",
    category: "camisetas",
    price: 39,
    compareAtPrice: null,
    colorName: "Negro ónix",
    colorHex: "#16161A",
    fit: "oversize",
    materials: ["Algodón orgánico 100%", "Punto de 240 g/m²"],
    care: "Lavar a 30°, del revés. No usar secadora.",
    description:
      "Punto de 240 gramos que cae plomo desde el hombro y no se transparenta. El patrón oversize baja la costura del hombro y ensancha el cuerpo sin alargar el bajo. Negro profundo que aguanta el lavado.",
    descriptionByAI: true,
    details: ["Cuello acanalado reforzado", "Costura lateral abierta", "Etiqueta tejida en el bajo"],
    images: [
      { id: "onix-1", url: "/uploads/seed/onix-1.svg", alt: "Camiseta Ónix, vista frontal" },
      { id: "onix-2", url: "/uploads/seed/onix-2.svg", alt: "Camiseta Ónix, vista trasera" },
      { id: "onix-3", url: "/uploads/seed/onix-3.svg", alt: "Detalle del tejido de la Camiseta Ónix" },
    ],
    sizeChart: TOP_CHART([
      ["S", "54", "70", "22"],
      ["M", "57", "72", "23"],
      ["L", "60", "74", "24"],
      ["XL", "63", "76", "25"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.1 },
    featured: true,
    published: true,
    badge: "Básico de casa",
  },
  {
    slug: "camiseta-hueso",
    name: "Camiseta Hueso",
    category: "camisetas",
    price: 39,
    compareAtPrice: null,
    colorName: "Hueso",
    colorHex: "#E8E1D3",
    fit: "boxy",
    materials: ["Algodón peinado 100%", "Punto de 220 g/m²"],
    care: "Lavar a 30° con prendas de color claro.",
    description:
      "Algodón peinado con un tacto seco que gana suavidad con cada lavado. El patrón boxy acorta el largo y ensancha el pecho, así que se queda quieta al levantar el brazo. Tono hueso cálido, nada clínico.",
    descriptionByAI: true,
    details: ["Cuello de 2 cm", "Hombro caído", "Bajo recto"],
    images: [
      { id: "hueso-1", url: "/uploads/seed/hueso-1.svg", alt: "Camiseta Hueso, vista frontal" },
      { id: "hueso-2", url: "/uploads/seed/hueso-2.svg", alt: "Camiseta Hueso, vista trasera" },
      { id: "hueso-3", url: "/uploads/seed/hueso-3.svg", alt: "Detalle del tejido de la Camiseta Hueso" },
    ],
    sizeChart: TOP_CHART([
      ["S", "55", "66", "21"],
      ["M", "58", "68", "22"],
      ["L", "61", "70", "23"],
      ["XL", "64", "72", "24"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.1 },
    featured: false,
    published: true,
    badge: null,
  },
  {
    slug: "sudadera-bruma",
    name: "Sudadera Bruma",
    category: "sudaderas",
    price: 79,
    compareAtPrice: 95,
    colorName: "Gris bruma",
    colorHex: "#8C8880",
    fit: "oversize",
    materials: ["Felpa perchada 420 g/m²", "80% algodón, 20% poliéster reciclado"],
    care: "Lavar a 30° del revés. Secar en horizontal.",
    description:
      "Felpa de 420 gramos con el interior perchado: pesa en la mano y abriga sin hacer bulto. La capucha lleva doble tela, así que se mantiene levantada. Gris bruma con un punto cálido, no azulado.",
    descriptionByAI: true,
    details: ["Capucha forrada de doble tela", "Bolsillo canguro con costura oculta", "Puños acanalados de 8 cm"],
    images: [
      { id: "bruma-1", url: "/uploads/seed/bruma-1.svg", alt: "Sudadera Bruma, vista frontal" },
      { id: "bruma-2", url: "/uploads/seed/bruma-2.svg", alt: "Sudadera Bruma, vista trasera" },
      { id: "bruma-3", url: "/uploads/seed/bruma-3.svg", alt: "Detalle de la felpa de la Sudadera Bruma" },
    ],
    sizeChart: TOP_CHART([
      ["S", "58", "68", "58"],
      ["M", "61", "70", "59"],
      ["L", "64", "72", "60"],
      ["XL", "67", "74", "61"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.16 },
    featured: true,
    published: true,
    badge: "Última talla L",
  },
  {
    slug: "sudadera-brasa",
    name: "Sudadera Brasa",
    category: "sudaderas",
    price: 85,
    compareAtPrice: null,
    colorName: "Rojo brasa",
    colorHex: "#B4441F",
    fit: "regular",
    materials: ["Felpa perchada 400 g/m²", "Algodón 100%"],
    care: "Lavar a 30° del revés, sola las dos primeras veces.",
    description:
      "Un rojo brasa teñido en prenda, con esa irregularidad leve que hace que dos unidades nunca sean idénticas. Corte regular, con sitio para moverse pero sin sobrar tela en el cuerpo. Felpa densa de 400 gramos.",
    descriptionByAI: true,
    details: ["Teñido en prenda", "Cordón plano de algodón", "Costura de refuerzo en el cuello"],
    images: [
      { id: "brasa-1", url: "/uploads/seed/brasa-1.svg", alt: "Sudadera Brasa, vista frontal" },
      { id: "brasa-2", url: "/uploads/seed/brasa-2.svg", alt: "Sudadera Brasa, vista trasera" },
      { id: "brasa-3", url: "/uploads/seed/brasa-3.svg", alt: "Detalle del teñido de la Sudadera Brasa" },
    ],
    sizeChart: TOP_CHART([
      ["S", "55", "66", "57"],
      ["M", "58", "68", "58"],
      ["L", "61", "70", "59"],
      ["XL", "64", "72", "60"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.16 },
    featured: true,
    published: true,
    badge: "Nuevo",
  },
  {
    slug: "cargo-sombra",
    name: "Cargo Sombra",
    category: "pantalones",
    price: 95,
    compareAtPrice: null,
    colorName: "Verde sombra",
    colorHex: "#4A4E3D",
    fit: "regular",
    materials: ["Sarga de algodón 320 g/m²", "Tratamiento repelente al agua"],
    care: "Lavar a 30°. No planchar sobre los bolsillos.",
    description:
      "Sarga de algodón con cuerpo suficiente para que la pierna caiga recta desde la cadera. Los bolsillos laterales van cosidos en diagonal para que no bailen al andar. Verde sombra apagado, fácil de combinar.",
    descriptionByAI: true,
    details: ["Cintura elástica en la espalda", "Seis bolsillos", "Bajo con cordón ajustable"],
    images: [
      { id: "sombra-1", url: "/uploads/seed/sombra-1.svg", alt: "Cargo Sombra, vista frontal" },
      { id: "sombra-2", url: "/uploads/seed/sombra-2.svg", alt: "Cargo Sombra, vista trasera" },
      { id: "sombra-3", url: "/uploads/seed/sombra-3.svg", alt: "Detalle del bolsillo del Cargo Sombra" },
    ],
    sizeChart: PANT_CHART([
      ["S", "76", "104", "74"],
      ["M", "82", "110", "76"],
      ["L", "88", "116", "78"],
      ["XL", "94", "122", "80"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.14 },
    featured: true,
    published: true,
    badge: null,
  },
  {
    slug: "pantalon-duna",
    name: "Pantalón Duna",
    category: "pantalones",
    price: 89,
    compareAtPrice: null,
    colorName: "Arena duna",
    colorHex: "#B9A88C",
    fit: "slim",
    materials: ["Twill de algodón 280 g/m²", "2% elastano"],
    care: "Lavar a 30°. Planchar del revés.",
    description:
      "Twill con un punto de elastano que sigue la pierna sin marcarla. El tiro es medio y la cintura queda plana bajo una camiseta metida por dentro. Arena cálida, con más beige que gris.",
    descriptionByAI: true,
    details: ["Tiro medio", "Bolsillos franceses", "Bajo sin dobladillo"],
    images: [
      { id: "duna-1", url: "/uploads/seed/duna-1.svg", alt: "Pantalón Duna, vista frontal" },
      { id: "duna-2", url: "/uploads/seed/duna-2.svg", alt: "Pantalón Duna, vista trasera" },
    ],
    sizeChart: PANT_CHART([
      ["S", "74", "98", "76"],
      ["M", "80", "104", "78"],
      ["L", "86", "110", "80"],
      ["XL", "92", "116", "82"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.12 },
    featured: false,
    published: true,
    badge: null,
  },
  {
    slug: "chaqueta-taller",
    name: "Chaqueta Taller",
    category: "chaquetas",
    price: 145,
    compareAtPrice: null,
    colorName: "Azul taller",
    colorHex: "#232B33",
    fit: "boxy",
    materials: ["Lona de algodón 380 g/m²", "Forro de popelín"],
    care: "Lavar a 30° en programa corto. Secar al aire.",
    description:
      "Lona de algodón que empieza rígida y se ablanda con el uso, marcando el pliegue del codo a los pocos meses. El patrón boxy deja sitio para una sudadera debajo. Azul taller profundo, casi negro con luz baja.",
    descriptionByAI: true,
    details: ["Botonadura de metal mate", "Dos bolsillos de parche", "Espalda con canesú"],
    images: [
      { id: "taller-1", url: "/uploads/seed/taller-1.svg", alt: "Chaqueta Taller, vista frontal" },
      { id: "taller-2", url: "/uploads/seed/taller-2.svg", alt: "Chaqueta Taller, vista trasera" },
      { id: "taller-3", url: "/uploads/seed/taller-3.svg", alt: "Detalle del bolsillo de la Chaqueta Taller" },
    ],
    sizeChart: TOP_CHART([
      ["S", "58", "68", "60"],
      ["M", "61", "70", "61"],
      ["L", "64", "72", "62"],
      ["XL", "67", "74", "63"],
    ]),
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.18 },
    featured: true,
    published: true,
    badge: "Edición corta",
  },
  {
    slug: "gorra-sello",
    name: "Gorra Sello",
    category: "accesorios",
    price: 32,
    compareAtPrice: null,
    colorName: "Negro ónix",
    colorHex: "#16161A",
    fit: "regular",
    materials: ["Sarga de algodón lavada", "Visera preformada"],
    care: "Limpiar en seco con un paño húmedo.",
    description:
      "Sarga lavada que ya viene con la visera curvada, sin fase de romperla. El cierre metálico deja ajustar el contorno al milímetro. Negro ónix con el sello bordado en hilo del mismo tono.",
    descriptionByAI: true,
    details: ["Bordado tono sobre tono", "Cierre metálico regulable", "Seis paneles con ojales"],
    images: [
      { id: "sello-1", url: "/uploads/seed/sello-1.svg", alt: "Gorra Sello, vista frontal" },
      { id: "sello-2", url: "/uploads/seed/sello-2.svg", alt: "Gorra Sello, vista lateral" },
    ],
    sizeChart: {
      columns: [{ key: "head", label: "Contorno de cabeza", unit: "cm" }],
      rows: [
        { size: "Única", available: true, values: { head: "54 - 60 (ajustable)" } },
      ],
      note: "Talla única con cierre regulable en la parte trasera.",
    },
    model3d: { ...DEFAULT_MODEL_3D, depth: 0.22 },
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
