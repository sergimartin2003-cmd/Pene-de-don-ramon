"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  /** Cuánto se desplaza respecto al scroll. Negativo = va más lento. */
  speed?: number;
  className?: string;
};

/** Desplazamiento suave ligado al scroll, sin librerías y con rAF. */
export default function Parallax({ children, speed = -0.08, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // Distancia del centro del elemento al centro de la ventana.
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      node.style.transform = `translate3d(0, ${(offset * speed).toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
