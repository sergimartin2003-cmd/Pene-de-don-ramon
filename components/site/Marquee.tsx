type Props = {
  items: string[];
  className?: string;
};

/** Cinta que se desplaza en bucle. El contenido va duplicado para el salto limpio. */
export default function Marquee({ items, className = "" }: Props) {
  const strip = [...items, ...items];

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <div className="flex w-max animate-[var(--animate-marquee)] items-center">
        {strip.map((item, index) => (
          <span key={index} className="label flex shrink-0 items-center gap-6 px-6 py-3">
            {item}
            <span className="text-ember">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
