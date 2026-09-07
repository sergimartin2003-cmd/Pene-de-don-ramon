import type { Metadata } from "next";

import AdminDashboard from "@/components/admin/AdminDashboard";
import LoginForm from "@/components/admin/LoginForm";
import { aiIsConfigured } from "@/lib/ai";
import { isAdmin } from "@/lib/auth";
import { listProducts, storageIsPersistent, storageLabel } from "@/lib/store";
import { blobIsConfigured } from "@/lib/blob-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) return <LoginForm />;

  // Con sesión abierta se ven también los borradores.
  const products = await listProducts({ includeDrafts: true });
  return (
    <AdminDashboard
      initialProducts={products}
      aiConfigured={aiIsConfigured()}
      persistent={storageIsPersistent()}
      storage={storageLabel()}
      directUpload={blobIsConfigured()}
    />
  );
}
