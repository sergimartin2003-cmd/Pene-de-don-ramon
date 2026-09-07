"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { inputClass } from "@/components/admin/Field";
import { site } from "@/lib/site";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se ha podido entrar.");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se ha podido entrar.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-bone px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-display text-2xl tracking-[-0.03em]">
          {site.name}
          <span className="text-ember">.</span>
        </p>
        <h1 className="display-md mt-6">Panel de gestión</h1>
        <p className="mt-4 text-pretty text-stone">
          Desde aquí se añaden, editan y retiran los productos de la tienda.
        </p>

        <form onSubmit={submit} className="mt-9">
          <label htmlFor="password" className="label block text-stone">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            className={`${inputClass} mt-2`}
            required
          />

          {error && <p className="mt-3 text-sm text-ember-dark">{error}</p>}

          <button
            type="submit"
            disabled={busy || !password}
            className="label mt-5 w-full bg-ink px-6 py-4 text-bone transition-colors hover:bg-ember disabled:opacity-40"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-8 border-t border-ink/12 pt-5 text-xs leading-relaxed text-stone">
          La contraseña se define en la variable de entorno <code>ADMIN_PASSWORD</code>.
          Si no se ha configurado ninguna, se usa <code>bora-admin-2026</code>: cámbiala
          antes de publicar la tienda.
        </p>
      </div>
    </div>
  );
}
