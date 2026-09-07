import { isAdmin, unauthorized } from "@/lib/auth";
import { createProduct, listProducts } from "@/lib/store";
import type { ProductInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await isAdmin();
  const wantsDrafts = new URL(request.url).searchParams.get("all") === "1";
  const products = await listProducts({ includeDrafts: admin && wantsDrafts });
  return Response.json({ products });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  let input: ProductInput;
  try {
    input = (await request.json()) as ProductInput;
  } catch {
    return Response.json({ error: "Petición no válida." }, { status: 400 });
  }

  if (!input?.name?.trim()) {
    return Response.json({ error: "El producto necesita un nombre." }, { status: 400 });
  }

  const product = await createProduct(input);
  return Response.json({ product }, { status: 201 });
}
