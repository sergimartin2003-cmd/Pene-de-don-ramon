import { isAdmin, unauthorized } from "@/lib/auth";
import { generateDescription, type DescriptionBrief } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  let brief: DescriptionBrief;
  try {
    brief = (await request.json()) as DescriptionBrief;
  } catch {
    return Response.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!brief?.name?.trim()) {
    return Response.json(
      { error: "Pon al menos el nombre de la prenda antes de generar el texto." },
      { status: 400 },
    );
  }

  const result = await generateDescription(brief);
  return Response.json(result);
}
