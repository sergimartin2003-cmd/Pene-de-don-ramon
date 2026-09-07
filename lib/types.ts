/** Modelo de datos de la tienda. Sin carrito: aquí no existe pedido ni checkout. */

export const CATEGORIES = [
  "camisetas",
  "sudaderas",
  "pantalones",
  "chaquetas",
  "accesorios",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  camisetas: "Camisetas",
  sudaderas: "Sudaderas",
  pantalones: "Pantalones",
  chaquetas: "Chaquetas",
  accesorios: "Accesorios",
};

export const FITS = ["slim", "regular", "oversize", "boxy"] as const;
export type Fit = (typeof FITS)[number];

export const FIT_LABELS: Record<Fit, string> = {
  slim: "Ajustado",
  regular: "Regular",
  oversize: "Oversize",
  boxy: "Boxy",
};

/** Una columna del tallaje, p. ej. "Pecho" en cm. */
export type SizeChartColumn = {
  key: string;
  label: string;
  unit: string;
};

/** Una talla concreta con sus medidas y su disponibilidad. */
export type SizeRow = {
  size: string;
  available: boolean;
  values: Record<string, string>;
};

/** El tallaje es propio de cada producto: columnas y filas se definen por producto. */
export type SizeChart = {
  columns: SizeChartColumn[];
  rows: SizeRow[];
  note: string;
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string;
};

/**
 * Configuración del visor 3D.
 * - "auto": la pieza se reconstruye en 3D a partir de la silueta de la foto.
 * - "glb": se usa un modelo GLB ya generado (por un servicio externo o subido).
 */
export type Model3DConfig = {
  enabled: boolean;
  source: "auto" | "glb";
  glbUrl: string | null;
  /** Grosor relativo de la pieza reconstruida (0.02 - 0.4). */
  depth: number;
  /** Índice de la foto que se usa como base para el 3D. */
  sourceImageIndex: number;
  /** Tolerancia al recortar el fondo de la foto (0 - 160). */
  backgroundTolerance: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price: number;
  compareAtPrice: number | null;
  colorName: string;
  colorHex: string;
  fit: Fit;
  materials: string[];
  care: string;
  /** Descripción corta redactada con IA. */
  description: string;
  /** true si la descripción actual la escribió la IA (y no una edición manual). */
  descriptionByAI: boolean;
  details: string[];
  images: ProductImage[];
  sizeChart: SizeChart;
  model3d: Model3DConfig;
  featured: boolean;
  published: boolean;
  badge: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Lo que envía el panel de admin al crear o editar. */
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "slug"> & {
  slug?: string;
};

export const DEFAULT_SIZE_CHART: SizeChart = {
  columns: [
    { key: "chest", label: "Pecho", unit: "cm" },
    { key: "length", label: "Largo", unit: "cm" },
    { key: "sleeve", label: "Manga", unit: "cm" },
  ],
  rows: [
    { size: "S", available: true, values: { chest: "52", length: "70", sleeve: "21" } },
    { size: "M", available: true, values: { chest: "55", length: "72", sleeve: "22" } },
    { size: "L", available: true, values: { chest: "58", length: "74", sleeve: "23" } },
    { size: "XL", available: true, values: { chest: "61", length: "76", sleeve: "24" } },
  ],
  note: "Medidas de la prenda en plano, con una tolerancia de ±1 cm.",
};

export const DEFAULT_MODEL_3D: Model3DConfig = {
  enabled: true,
  source: "auto",
  glbUrl: null,
  depth: 0.13,
  sourceImageIndex: 0,
  backgroundTolerance: 42,
};
