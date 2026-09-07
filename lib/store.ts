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
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");

type Db = { products: Product[] };

let writeQueue: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Db> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || !Array.isArray(parsed.products)) throw new Error("formato inválido");
    return parsed;
  } catch {
    // Primer arranque (o fichero corrupto): se siembra el catálogo de ejemplo.
    const db: Db = { products: seedProducts() };
    await writeAll(db);
    return db;
  }
}

async function writeAll(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DATA_FILE);
}

/** Serializa las escrituras para que dos peticiones a la vez no se pisen. */
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
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
      depth: Math.min(0.4, Math.max(0.02, Number(model3d.depth) || 0.13)),
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
