import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  DEFAULT_MODEL_3D,
  DEFAULT_SIZE_CHART,
  type Product,
  type ProductInput,
} from "./types";
import { uniqueSlug } from "./slug";
import { seedProducts } from "./seed";

/**
 * Almacén de productos en fichero JSON.
 *
 * Se ha aislado tras esta interfaz a propósito: para mover la tienda a una base
 * de datos sólo hay que reescribir readAll/writeAll, nada más del proyecto
 * toca el disco.
 *
 * El catálogo se mantiene también en memoria. En un servidor normal el fichero
 * manda y la memoria es sólo una caché; en un alojamiento con el disco en modo
 * sólo lectura (Vercel y similares) la escritura falla, se avisa una vez y la
 * tienda sigue funcionando en memoria: se puede navegar y probar el panel, pero
 * los cambios se pierden al reiniciar. Es una degradación consciente, para que
 * un disco no escribible nunca tumbe la web.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");

type Db = { products: Product[] };

/**
 * El estado vive en globalThis a propósito. Next puede empaquetar cada ruta por
 * separado, y entonces cada una tendría su propia copia de las variables de este
 * módulo: sin disco donde sincronizarse, un producto creado desde el panel no lo
 * vería la ficha pública. Con un único objeto global comparten catálogo.
 */
type StoreState = {
  writeQueue: Promise<unknown>;
  cache: Db | null;
  diskWritable: boolean;
};

const globalRef = globalThis as unknown as { __tiendaStore?: StoreState };

const state: StoreState = (globalRef.__tiendaStore ??= {
  writeQueue: Promise.resolve(),
  cache: null,
  diskWritable: true,
});

async function readAll(): Promise<Db> {
  // Con disco, el fichero manda en cada lectura; sin él, la memoria es la fuente.
  if (state.cache && !state.diskWritable) return state.cache;

  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || !Array.isArray(parsed.products)) throw new Error("formato inválido");
    state.cache = parsed;
    return parsed;
  } catch {
    if (state.cache) return state.cache;
    // Primer arranque (o fichero corrupto): se siembra el catálogo de ejemplo.
    const db: Db = { products: seedProducts() };
    await writeAll(db);
    return db;
  }
}

async function writeAll(db: Db): Promise<void> {
  // La memoria se actualiza siempre: es lo que permite que la tienda siga en pie
  // aunque el disco no acepte escrituras.
  state.cache = db;
  if (!state.diskWritable) return;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DATA_FILE);
  } catch (cause) {
    state.diskWritable = false;
    console.warn(
      "[tienda] No se puede escribir en data/: el catálogo funcionará sólo en " +
        "memoria y los cambios se perderán al reiniciar. " +
        "Para conservarlos, despliega en un servidor con disco persistente o " +
        "cambia readAll/writeAll por una base de datos.",
      cause,
    );
  }
}

/** true si los cambios del panel se están guardando de verdad. */
export function storageIsPersistent(): boolean {
  return state.diskWritable;
}

/** Serializa las escrituras para que dos peticiones a la vez no se pisen. */
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = state.writeQueue.then(task, task);
  state.writeQueue = run.catch(() => undefined);
  return run;
}

function sortNewestFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listProducts(
  opts: { includeDrafts?: boolean } = {},
): Promise<Product[]> {
  const db = await readAll();
  const all = sortNewestFirst(db.products);
  return opts.includeDrafts ? all : all.filter((p) => p.published);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = await readAll();
  return db.products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await readAll();
  return db.products.find((p) => p.id === id) ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return serialize(async () => {
    const db = await readAll();
    const now = new Date().toISOString();
    const product: Product = {
      ...normalize(input),
      id: randomUUID(),
      slug: uniqueSlug(input.slug || input.name, db.products.map((p) => p.slug)),
      createdAt: now,
      updatedAt: now,
    };
    db.products.push(product);
    await writeAll(db);
    return product;
  });
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product | null> {
  return serialize(async () => {
    const db = await readAll();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const current = db.products[index];
    const taken = db.products.filter((p) => p.id !== id).map((p) => p.slug);
    const wanted = input.slug || current.slug;
    const updated: Product = {
      ...normalize(input),
      id: current.id,
      slug: wanted === current.slug ? current.slug : uniqueSlug(wanted, taken),
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    db.products[index] = updated;
    await writeAll(db);
    return updated;
  });
}

export async function deleteProduct(id: string): Promise<Product | null> {
  return serialize(async () => {
    const db = await readAll();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const [removed] = db.products.splice(index, 1);
    await writeAll(db);
    return removed;
  });
}

/** Rellena huecos y recorta valores fuera de rango antes de guardar. */
function normalize(input: ProductInput): Omit<Product, "id" | "slug" | "createdAt" | "updatedAt"> {
  const images = (input.images ?? []).filter((img) => img && img.url);
  const chart = input.sizeChart ?? DEFAULT_SIZE_CHART;
  const model3d = { ...DEFAULT_MODEL_3D, ...(input.model3d ?? {}) };

  return {
    name: (input.name ?? "").trim() || "Sin nombre",
    category: input.category,
    price: Math.max(0, Number(input.price) || 0),
    compareAtPrice:
      input.compareAtPrice === null || input.compareAtPrice === undefined
        ? null
        : Math.max(0, Number(input.compareAtPrice) || 0) || null,
    colorName: (input.colorName ?? "").trim(),
    colorHex: /^#[0-9a-f]{6}$/i.test(input.colorHex ?? "") ? input.colorHex : "#111113",
    fit: input.fit,
    sizeAdvice: (input.sizeAdvice ?? "").trim(),
    materials: (input.materials ?? []).map((m) => m.trim()).filter(Boolean),
    care: (input.care ?? "").trim(),
    description: (input.description ?? "").trim(),
    descriptionByAI: Boolean(input.descriptionByAI),
    details: (input.details ?? []).map((d) => d.trim()).filter(Boolean),
    images,
    sizeChart: {
      columns: chart.columns.filter((c) => c.key && c.label),
      rows: chart.rows.filter((r) => r.size.trim()),
      note: chart.note ?? "",
    },
    model3d: {
      ...model3d,
      depth: Math.min(0.6, Math.max(0.02, Number(model3d.depth) || 0.28)),
      backgroundTolerance: Math.min(
        160,
        Math.max(0, Number(model3d.backgroundTolerance) || 0),
      ),
      sourceImageIndex: Math.min(
        Math.max(0, images.length - 1),
        Math.max(0, Number(model3d.sourceImageIndex) || 0),
      ),
    },
    featured: Boolean(input.featured),
    published: input.published !== false,
    badge: (input.badge ?? "")?.toString().trim() || null,
  };
}
