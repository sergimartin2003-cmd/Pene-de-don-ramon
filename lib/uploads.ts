import path from "node:path";

/**
 * Dónde se guardan las fotos subidas desde el panel cuando hay disco.
 *
 * Fuera de /public a propósito: Next indexa esa carpeta al compilar y no sirve
 * lo que se añada después. Se sirven por /api/foto/<fichero>.
 */
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function photoUrl(filename: string): string {
  return `/api/foto/${filename}`;
}
