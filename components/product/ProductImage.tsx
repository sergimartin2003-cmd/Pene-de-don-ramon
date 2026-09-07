import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/**
 * Envoltorio de next/image. Los SVG del catálogo de ejemplo se sirven tal cual
 * (el optimizador no los mejora), igual que las fotos incrustadas como data URI
 * en alojamientos sin disco; las fotos reales pasan por AVIF/WebP.
 */
export default function ProductImage({ src, alt, sizes, className = "", priority }: Props) {
  const raw = src.toLowerCase().endsWith(".svg") || src.startsWith("data:");

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={raw}
      className={className}
    />
  );
}
