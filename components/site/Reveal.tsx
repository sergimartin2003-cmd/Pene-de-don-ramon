"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** Retardo en ms para escalonar varios elementos de una misma fila. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
};

/**
 * Aparición al entrar en pantalla. Se dispara una sola vez y respeta
 * prefers-reduced-motion (en ese caso el contenido ya nace visible).
 */
export default function Reveal({ children, delay = 0, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // El tipo se fija a mano: la unión de props de div/li/section/article se
  // colapsaría a never y no dejaría pasar ni ref ni style.
  const Tag = as as unknown as React.FC<
    React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >;

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(28px)",
        transition: `opacity 0.85s var(--ease-out-expo) ${delay}ms, transform 0.85s var(--ease-out-expo) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
