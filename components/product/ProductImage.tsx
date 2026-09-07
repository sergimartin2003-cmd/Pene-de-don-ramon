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
 * (el optimizador no los mejora) y las fotos reales pasan por AVIF/WebP.
 */
export default function ProductImage({ src, alt, sizes, className = "", priority }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.toLowerCase().endsWith(".svg")}
      className={className}
    />
  );
}
