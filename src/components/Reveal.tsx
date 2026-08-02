"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Atraso do stagger em ms (0 = sem atraso). */
  delayMs?: number;
  /** "up": fade + leve subida. "scale": mesmo efeito + escala sutil (telas/imagens). */
  variant?: "up" | "scale";
  /** Elemento HTML a renderizar (ex: "li" dentro de uma <ol>). Padrão: "div". */
  as?: ElementType;
};

/**
 * Revela o conteúdo (fade + slide-up) na primeira vez que ele entra no
 * viewport. Dispara uma única vez por elemento — não é uma animação de
 * scroll contínua.
 *
 * O IntersectionObserver só dispara quando a razão de interseção cruza o
 * threshold; um salto instantâneo de scroll (link âncora, "voltar" do
 * navegador) pode levar o elemento de "bem abaixo" pra "bem acima" do
 * viewport sem nunca cruzar esse threshold — nesse caso nenhum callback é
 * disparado e o elemento fica preso em opacity:0 pra sempre. Por isso, além
 * do observer, também checamos a posição manualmente no mount e a cada
 * scroll (via rAF) como rede de segurança.
 */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
  variant = "up",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    let cleanupScrollListener: (() => void) | null = null;

    const reveal = () => {
      setIsVisible(true);
      observer.disconnect();
      cleanupScrollListener?.();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const checkAlreadyPassed = () => {
      ticking = false;
      if (node.getBoundingClientRect().top < window.innerHeight) reveal();
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(checkAlreadyPassed);
    };

    observer.observe(node);
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanupScrollListener = () => window.removeEventListener("scroll", onScroll);
    checkAlreadyPassed();

    return () => {
      observer.disconnect();
      cleanupScrollListener?.();
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${variant === "scale" ? "reveal-scale" : ""} ${
        isVisible ? "reveal-visible" : ""
      } ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
