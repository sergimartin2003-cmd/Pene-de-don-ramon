import AdminBarShell from "@/components/site/AdminBarShell";
import { isAdmin } from "@/lib/auth";
import { storageLabel } from "@/lib/store";

/** No renderiza nada para quien visita la tienda sin sesión. */
export default async function AdminBar() {
  if (!(await isAdmin())) return null;
  return <AdminBarShell storage={storageLabel()} />;
}
