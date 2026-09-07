/** Modelo de datos de la tienda de zapatillas. Sin carrito: aquí no hay pedido ni checkout. */

export const CATEGORIES = [
  "lifestyle",
  "running",
  "skate",
  "basket",
  "accesorios",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  lifestyle: "Lifestyle",
  running: "Running",
  skate: "Skate",
  basket: "Baloncesto",
  accesorios: "Accesorios",
};

/** Horma: cómo de ancha va la zapatilla por el antepié. */
export const FITS = ["estrecha", "normal", "ancha"] as const;
export type Fit = (typeof FITS)[number];

export const FIT_LABELS: Record<Fit, string> = {
  estrecha: "Horma estrecha",
  normal: "Horma normal",
  ancha: "Horma ancha",
};

/** Una columna del tallaje, p. ej. "Pie" en cm. */
export type SizeChartColumn = {
  key: string;
  label: string;
  unit: string;
};

/** Una talla concreta con sus equivalencias y su disponibilidad. */
export type SizeRow = {
  size: string;
  available: boolean;
  values: Record<string, string>;
};

/** El tallaje es propio de cada modelo: columnas y filas se definen por producto. */
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
 * - "auto": la zapatilla se reconstruye en 3D a partir de la silueta de la foto.
 * - "glb": se usa un modelo GLB ya generado (por un escaneo o un servicio externo).
 */
export type Model3DConfig = {
  enabled: boolean;
  source: "auto" | "glb";
  glbUrl: string | null;
  /** Grosor relativo de la pieza reconstruida (0.02 - 0.6). */
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
  /** Aviso de tallaje: "Talla normal", "Pide media talla más"… */
  sizeAdvice: string;
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

/** Equivalencias de tallas europeas para el tallaje por defecto. */
export const DEFAULT_SIZE_CHART: SizeChart = {
  columns: [
    { key: "us", label: "US", unit: "" },
    { key: "uk", label: "UK", unit: "" },
    { key: "foot", label: "Pie", unit: "cm" },
  ],
  rows: [
    { size: "40", available: true, values: { us: "7", uk: "6", foot: "25,0" } },
    { size: "41", available: true, values: { us: "8", uk: "7", foot: "25,5" } },
    { size: "42", available: true, values: { us: "8,5", uk: "7,5", foot: "26,5" } },
    { size: "43", available: true, values: { us: "9,5", uk: "8,5", foot: "27,5" } },
    { size: "44", available: true, values: { us: "10", uk: "9", foot: "28,0" } },
    { size: "45", available: true, values: { us: "11", uk: "10", foot: "29,0" } },
  ],
  note: "Talla europea. La medida del pie es de talón a dedo más largo, de pie y por la tarde.",
};

export const DEFAULT_MODEL_3D: Model3DConfig = {
  enabled: true,
  source: "auto",
  glbUrl: null,
  depth: 0.28,
  sourceImageIndex: 0,
  backgroundTolerance: 42,
};
