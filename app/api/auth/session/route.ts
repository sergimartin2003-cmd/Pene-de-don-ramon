import { isAdmin } from "@/lib/auth";
import { aiIsConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ admin: await isAdmin(), aiConfigured: aiIsConfigured() });
}
