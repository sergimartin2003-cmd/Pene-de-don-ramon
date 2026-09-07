"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Barra que sólo ve quien tiene la sesión de administrador abierta, para saltar
 * al panel desde cualquier página de la tienda sin escribir la URL a mano.
 */
export default function AdminBarShell({ storage }: { storage: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Dentro del panel sobra: ya tiene su propia cabecera.
  if (pathname?.startsWith("/admin")) return null;

  const logout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-bone/15 bg-ink/95 text-bone backdrop-blur-xl">
      <div className="shell flex items-center justify-between gap-4 py-2.5">
        <p className="label truncate text-bone/55">
          <span className="text-ember">●</span> Sesión de admin
          <span className="hidden sm:inline"> · guardando en {storage}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin"
            className="label bg-bone px-4 py-2.5 text-ink transition-colors hover:bg-ember hover:text-bone"
          >
            Ir al panel
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={busy}
            className="label px-3 py-2.5 text-bone/60 transition-colors hover:text-bone disabled:opacity-50"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
