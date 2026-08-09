"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";

type FaqCarouselItem = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  items: FaqCarouselItem[];
};

/**
 * Carrossel horizontal de FAQ controlado pelo usuário (scroll-snap, arrastar
 * com o mouse no desktop, gesto nativo no touch) — ao contrário de um
 * marquee automático, aqui o card só troca quando o usuário rola.
 */
export function FaqCarousel({ items }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ potential: false, dragging: false, startX: 0, startScrollLeft: 0 });

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.scrollWidth / items.length;
    const index = step > 0 ? Math.round(el.scrollLeft / step) : 0;
    setActiveIndex(Math.min(items.length - 1, Math.max(0, index)));
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
  }, [items.length]);

  useEffect(() => {
    updateScrollState();
  }, [updateScrollState]);

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.scrollWidth / items.length;
    el.scrollTo({ left: step * index, behavior: "smooth" });
  };

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragState.current = { potential: true, dragging: false, startX: e.pageX, startScrollLeft: el.scrollLeft };
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !dragState.current.potential) return;
    const delta = e.pageX - dragState.current.startX;

    // Só assume que é um "arraste" depois de um pequeno threshold — assim um
    // clique simples (ou seleção de texto dentro do card) continua funcionando.
    if (!dragState.current.dragging && Math.abs(delta) > 5) {
      dragState.current.dragging = true;
      setIsDragging(true);
      // O navegador pode ter iniciado uma seleção de texto nos poucos px antes
      // do threshold — limpa antes de continuar o arraste.
      window.getSelection()?.removeAllRanges();
    }

    if (dragState.current.dragging) {
      e.preventDefault();
      el.scrollLeft = dragState.current.startScrollLeft - delta;
    }
  };

  const stopDragging = () => {
    dragState.current.potential = false;
    dragState.current.dragging = false;
    setIsDragging(false);
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className={`no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-1 ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {items.map((item) => (
          <div key={item.id} className="w-[85vw] shrink-0 snap-start sm:w-96">
            <div className="flex h-full flex-col items-start gap-4 rounded-xl border border-neutral-300 bg-background p-6 dark:border-neutral-700">
              <h3 className="text-xl font-medium">{item.question}</h3>
              <p className="text-base text-neutral-600 dark:text-neutral-400">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gradientes nas bordas sinalizando que há mais cards pra rolar. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
          atStart ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${
          atEnd ? "opacity-0" : "opacity-100"
        }`}
      />

      <div className="mt-4 flex justify-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollToIndex(index)}
            aria-label={`Ir para a pergunta ${index + 1}: ${item.question}`}
            aria-current={index === activeIndex}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === activeIndex ? "bg-accent" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
