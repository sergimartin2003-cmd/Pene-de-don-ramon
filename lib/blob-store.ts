import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

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
 */

export const CATALOG_PATH = "catalogo/products.json";

/** Vercel inyecta esta variable al conectar un Blob Store al proyecto. */
export function blobIsConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type CatalogSnapshot = { text: string; etag: string };

/** Devuelve null si todavía no se ha guardado nunca el catálogo. */
export async function readCatalog(): Promise<CatalogSnapshot | null> {
  // useCache: false — si leyéramos de la CDN, un cambio recién guardado podría
  // no verse todavía y el siguiente guardado pisaría datos buenos.
  const found = await get(CATALOG_PATH, { access: "private", useCache: false });
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
  await put(CATALOG_PATH, text, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    ...(etag ? { ifMatch: etag } : { allowOverwrite: true }),
  });
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
  const blob = await put(pathname, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
