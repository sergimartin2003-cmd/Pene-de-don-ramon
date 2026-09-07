import { randomUUID } from "node:crypto";

import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";

/**
 * Acceso a Vercel Blob.
 *
 * Es el almacén que se usa cuando la tienda vive en Vercel, donde el disco es de
 * sólo lectura. Guarda dos cosas distintas:
 *
 *  - El catálogo (`catalogo/products.json`) en modo privado: contiene los
 *    borradores, así que no debe poder leerlo cualquiera con la URL.
 *  - Las fotos de producto en modo público: tienen que poder cargarse desde el
 *    navegador de quien visita la tienda.
 *
 * Todas las llamadas llevan tiempo límite. Sin él, un Blob Store mal conectado
 * o caído no da error: se queda esperando, y con él se quedan esperando las
 * páginas de la tienda. Mejor fallar rápido y seguir en memoria.
 */

export const CATALOG_PATH = "catalogo/products.json";

const CATALOG_TIMEOUT_MS = 10_000;
const PHOTO_TIMEOUT_MS = 30_000;
const PROBE_TIMEOUT_MS = 8_000;

export class BlobTimeoutError extends Error {
  constructor() {
    super("Vercel Blob no ha respondido a tiempo.");
    this.name = "BlobTimeoutError";
  }
}

/**
 * Tiempo límite propio, además del abortSignal del SDK.
 *
 * El SDK reintenta por su cuenta ante fallos de red y esos reintentos no
 * atienden al abortSignal: una petición puede quedarse minutos dando vueltas.
 * Esto garantiza que la llamada vuelve, aunque la de dentro siga su camino.
 */
async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new BlobTimeoutError()), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Vercel inyecta esta variable al conectar un Blob Store al proyecto. */
export function blobIsConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type CatalogSnapshot = { text: string; etag: string };

/** Devuelve null si todavía no se ha guardado nunca el catálogo. */
export async function readCatalog(): Promise<CatalogSnapshot | null> {
  // useCache: false — si leyéramos de la CDN, un cambio recién guardado podría
  // no verse todavía y el siguiente guardado pisaría datos buenos.
  const found = await withTimeout(
    get(CATALOG_PATH, {
      access: "private",
      useCache: false,
      abortSignal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
    }),
    CATALOG_TIMEOUT_MS,
  );
  if (!found || found.statusCode !== 200) return null;

  return {
    text: await new Response(found.stream).text(),
    etag: found.blob.etag,
  };
}

/**
 * Guarda el catálogo. Si se pasa `etag`, la escritura sólo se aplica cuando
 * nadie lo ha cambiado mientras tanto; si alguien lo hizo, lanza Conflict.
 */
export async function writeCatalog(text: string, etag: string | null): Promise<void> {
  await withTimeout(
    put(CATALOG_PATH, text, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      abortSignal: AbortSignal.timeout(CATALOG_TIMEOUT_MS),
      ...(etag ? { ifMatch: etag } : { allowOverwrite: true }),
    }),
    CATALOG_TIMEOUT_MS,
  );
}

export function isConflict(error: unknown): boolean {
  return error instanceof BlobPreconditionFailedError;
}

/** Sube una foto de producto y devuelve su URL pública. */
export async function uploadPhoto(
  pathname: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const blob = await withTimeout(
    put(pathname, body, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      abortSignal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
    }),
    PHOTO_TIMEOUT_MS,
  );
  return blob.url;
}

/**
 * Escribe, lee y borra un fichero de prueba. Sirve para que el panel pueda
 * decir con seguridad si el Blob Store está bien conectado, en vez de dejarlo
 * a que falle el primer producto que se guarde.
 */
export async function probeBlob(): Promise<void> {
  const pathname = `diagnostico/prueba-${randomUUID()}.txt`;
  const expected = `ok ${Date.now()}`;

  const signal = AbortSignal.timeout(PROBE_TIMEOUT_MS);

  await withTimeout(
    put(pathname, expected, {
      access: "private",
      contentType: "text/plain",
      addRandomSuffix: false,
      allowOverwrite: true,
      abortSignal: signal,
    }),
    PROBE_TIMEOUT_MS,
  );

  const found = await withTimeout(
    get(pathname, { access: "private", useCache: false, abortSignal: signal }),
    PROBE_TIMEOUT_MS,
  );
  if (!found || found.statusCode !== 200) {
    throw new Error("se ha escrito pero no se ha podido volver a leer");
  }

  const text = await new Response(found.stream).text();
  if (text !== expected) {
    throw new Error("lo leído no coincide con lo escrito");
  }

  // Limpiar es lo deseable, pero no poder borrarlo no invalida la prueba.
  await withTimeout(del(pathname, { abortSignal: signal }), PROBE_TIMEOUT_MS).catch(
    () => undefined,
  );
}
