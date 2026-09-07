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
import {
  blobIsConfigured,
  isConflict,
  readCatalog,
  writeCatalog,
} from "./blob-store";

/**
 * Almacén de productos.
 *
 * Hay tres formas de guardar, y se elige sola según dónde esté desplegada la
 * tienda:
 *
 *  1. Vercel Blob, si existe BLOB_READ_WRITE_TOKEN. Es el caso de Vercel, donde
 *     el disco es de sólo lectura. Los cambios sobreviven a los reinicios.
 *  2. Un fichero JSON en data/, si el disco acepta escrituras. Es el caso de un
 *     VPS, Railway, Render o de tu propio ordenador.
 *  3. Sólo memoria, si ninguna de las dos funciona. La tienda no se cae: se
 *     puede navegar y probar el panel, pero lo que se cree se pierde al
 *     reiniciar. El panel avisa de ello.
 *
 * Todo el acceso al almacenamiento está detrás de la interfaz Driver: para
 * cambiarlo por una base de datos sólo hay que escribir otro driver.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");

type Db = { products: Product[] };

/** `version` sirve para detectar que otro ha escrito mientras tanto. */
type Snapshot = { db: Db; version: string | null };

type Driver = {
  label: string;
  read: () => Promise<Snapshot | null>;
  write: (db: Db, version: string | null) => Promise<void>;
};

class ConflictError extends Error {}

const blobDriver: Driver = {
  label: "Vercel Blob",
  async read() {
    const found = await readCatalog();
    if (!found) return null;
    return { db: parse(found.text), version: found.etag };
  },
  async write(db, version) {
    try {
      await writeCatalog(JSON.stringify(db, null, 2), version);
    } catch (cause) {
      if (isConflict(cause)) throw new ConflictError();
      throw cause;
    }
  },
};

const fileDriver: Driver = {
  label: "disco (data/products.json)",
  async read() {
    const raw = await fs.readFile(DATA_FILE, "utf8").catch(() => null);
    if (raw === null) return null;
    return { db: parse(raw), version: null };
  },
  async write(db) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    // Escritura atómica: si el proceso muere a media escritura, el fichero
    // bueno sigue intacto.
    const tmp = `${DATA_FILE}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, DATA_FILE);
  },
};

function parse(raw: string): Db {
  const parsed = JSON.parse(raw) as Db;
  if (!parsed || !Array.isArray(parsed.products)) throw new Error("formato inválido");
  return parsed;
}

/**
 * El estado vive en globalThis a propósito. Next puede empaquetar cada ruta por
 * separado, y entonces cada una tendría su propia copia de las variables de este
 * módulo: sin un almacén compartido, un producto creado desde el panel no lo
 * vería la ficha pública.
 */
type StoreState = {
  queue: Promise<unknown>;
  memory: Db | null;
  /** true cuando el driver falló al escribir y sólo queda la memoria. */
  degraded: boolean;
  warned: boolean;
};

const globalRef = globalThis as unknown as { __tiendaStore?: StoreState };

const state: StoreState = (globalRef.__tiendaStore ??= {
  queue: Promise.resolve(),
  memory: null,
  degraded: false,
  warned: false,
});

function driver(): Driver {
  return blobIsConfigured() ? blobDriver : fileDriver;
}

/** Qué almacén está usando la tienda ahora mismo. */
export function storageLabel(): string {
  return state.degraded ? "sólo memoria" : driver().label;
}

/** true si los cambios del panel se guardan de verdad. */
export function storageIsPersistent(): boolean {
  return !state.degraded;
}

function degrade(cause: unknown): void {
  state.degraded = true;
  if (state.warned) return;
  state.warned = true;
  console.warn(
    `[tienda] No se ha podido escribir en ${driver().label}: el catálogo ` +
      "funcionará sólo en memoria y los cambios se perderán al reiniciar. " +
      "En Vercel, conecta un Blob Store al proyecto (Storage → Blob) para que " +
      "se guarden de verdad.",
    cause,
  );
}

async function load(): Promise<Snapshot> {
  if (state.degraded) {
    return { db: state.memory ?? seed(), version: null };
  }

  try {
    const found = await driver().read();
    if (found) {
      state.memory = found.db;
      return found;
    }
  } catch (cause) {
    // Un fichero corrupto o un fallo de red: se sigue con lo que haya en memoria.
    degrade(cause);
    return { db: state.memory ?? seed(), version: null };
  }

  // Primer arranque: se siembra el catálogo de ejemplo y se intenta guardarlo.
  const db = seed();
  await save(db, null);
  return { db, version: null };
}

function seed(): Db {
  const db: Db = { products: seedProducts() };
  state.memory = db;
  return db;
}

async function save(db: Db, version: string | null): Promise<void> {
  state.memory = db;
  if (state.degraded) return;
  try {
    await driver().write(db, version);
  } catch (cause) {
    if (cause instanceof ConflictError) throw cause;
    degrade(cause);
  }
}

/**
 * Aplica un cambio sobre el catálogo. Las escrituras se serializan dentro de
 * una instancia, y en Blob se reintenta si otra instancia escribió a la vez.
 */
function mutate<T>(apply: (db: Db) => { db: Db; result: T }): Promise<T> {
  const run = state.queue.then(
    async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const snapshot = await load();
        const { db, result } = apply(structuredClone(snapshot.db));
        try {
          await save(db, snapshot.version);
          return result;
        } catch (cause) {
          if (!(cause instanceof ConflictError)) throw cause;
          // Otro escribió mientras tanto: se recarga y se vuelve a aplicar.
          state.memory = null;
        }
      }
      throw new Error("No se ha podido guardar: el catálogo cambió a la vez desde otro sitio.");
    },
    async () => {
      throw new Error("No se ha podido guardar.");
    },
  );

  state.queue = run.catch(() => undefined);
  return run;
}

function sortNewestFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listProducts(
  opts: { includeDrafts?: boolean } = {},
): Promise<Product[]> {
  const { db } = await load();
  const all = sortNewestFirst(db.products);
  return opts.includeDrafts ? all : all.filter((p) => p.published);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { db } = await load();
  return db.products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { db } = await load();
  return db.products.find((p) => p.id === id) ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return mutate((db) => {
    const now = new Date().toISOString();
    const product: Product = {
      ...normalize(input),
      id: randomUUID(),
      slug: uniqueSlug(input.slug || input.name, db.products.map((p) => p.slug)),
      createdAt: now,
      updatedAt: now,
    };
    db.products.push(product);
    return { db, result: product };
  });
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product | null> {
  return mutate((db) => {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return { db, result: null };

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
    return { db, result: updated };
  });
}

export async function deleteProduct(id: string): Promise<Product | null> {
  return mutate((db) => {
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) return { db, result: null };
    const [removed] = db.products.splice(index, 1);
    return { db, result: removed };
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
