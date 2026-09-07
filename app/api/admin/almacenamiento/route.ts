import { isAdmin, unauthorized } from "@/lib/auth";
import { checkStorage } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Diagnóstico del almacenamiento, sólo para el panel. */
export async function POST() {
  if (!(await isAdmin())) return unauthorized();
  return Response.json(await checkStorage());
}
