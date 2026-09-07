import { isAdmin, unauthorized } from "@/lib/auth";
import { deleteProduct, getProductById, updateProduct } from "@/lib/store";
import type { ProductInput } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return Response.json({ error: "No existe ese producto." }, { status: 404 });
  if (!product.published && !(await isAdmin())) {
    return Response.json({ error: "No existe ese producto." }, { status: 404 });
  }
  return Response.json({ product });
}

export async function PUT(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;

  let input: ProductInput;
  try {
    input = (await request.json()) as ProductInput;
  } catch {
    return Response.json({ error: "Petición no válida." }, { status: 400 });
  }

  const product = await updateProduct(id, input);
  if (!product) return Response.json({ error: "No existe ese producto." }, { status: 404 });
  return Response.json({ product });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  const removed = await deleteProduct(id);
  if (!removed) return Response.json({ error: "No existe ese producto." }, { status: 404 });
  return Response.json({ ok: true, removed: removed.name });
}
