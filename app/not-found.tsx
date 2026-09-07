import Link from "next/link";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[70svh] flex-col justify-center py-24">
      <p className="label text-stone">Error 404</p>
      <h1 className="display-lg mt-5 max-w-2xl text-balance">
        Esta página ya no está aquí.
      </h1>
      <p className="mt-6 max-w-md text-pretty text-stone">
        Puede que la pieza se haya retirado del catálogo o que la dirección tenga
        algún carácter de más.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link
          href="/tienda"
          className="label bg-ink px-7 py-4.5 text-bone transition-colors duration-300 hover:bg-ember"
        >
          Ver la colección
        </Link>
        <Link
          href="/"
          className="label border border-ink/25 px-7 py-4.5 transition-colors duration-300 hover:border-ink"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
