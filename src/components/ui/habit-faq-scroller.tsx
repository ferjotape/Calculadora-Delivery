import type { CSSProperties, ReactNode } from "react";

type FaqCardProps = {
  question: string;
  answer: string;
};

/** Card reutilizável pra um item de FAQ. */
export function FaqCard({ question, answer }: FaqCardProps) {
  return (
    <div className="flex flex-col items-start gap-4 p-6 bg-white rounded-lg shadow-lg w-96 flex-shrink-0 faq-card">
      <h3 className="text-xl font-bold text-black faq-title">{question}</h3>
      <p className="text-lg text-gray-700 faq-answer">{answer}</p>
    </div>
  );
}

type HorizontalScrollerProps = {
  children: ReactNode;
  speed?: string;
  direction?: "left" | "right";
};

type ScrollerStyle = CSSProperties & { "--scroll-duration"?: string };

/** Envolve children e cria um loop horizontal contínuo (duplica o conteúdo pra costurar o loop). */
export function HorizontalScroller({
  children,
  speed = "40s",
  direction = "left",
}: HorizontalScrollerProps) {
  const animationClass =
    direction === "right" ? "animate-scroll-horizontal-reverse" : "animate-scroll-horizontal";

  const style: ScrollerStyle = { "--scroll-duration": speed };

  return (
    <div className="w-full overflow-hidden group relative scroller-mask">
      <div className={`flex ${animationClass}`} style={style}>
        <div className="flex items-stretch justify-center flex-shrink-0 gap-8 px-4">{children}</div>
        {/* duplicata pro loop ficar contínuo */}
        <div
          className="flex items-stretch justify-center flex-shrink-0 gap-8 px-4"
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqRow = {
  id: string;
  speed?: string;
  direction?: "left" | "right";
  faqItems: FaqItem[];
};

export type FaqSectionData = {
  mainTitle: string;
  mainSubtitle: string;
  rows: FaqRow[];
};

type FaqSectionProps = {
  data: FaqSectionData;
};

/** Monta título, subtítulo e as linhas horizontais de FAQ. */
export default function FaqSection({ data }: FaqSectionProps) {
  return (
    <div className="relative flex flex-col items-center gap-12 p-10 w-full max-w-6xl">
      <div className="flex flex-col items-center gap-6 text-center z-10 max-w-2xl">
        <h2
          className="text-5xl font-bold text-black leading-tight"
          style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.2s forwards" }}
        >
          {data.mainTitle}
        </h2>
        <p
          className="text-lg text-gray-700"
          style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.4s forwards" }}
        >
          {data.mainSubtitle}
        </p>
      </div>

      <div className="flex flex-col gap-8 z-10 w-full">
        {data.rows.map((row) => (
          <HorizontalScroller key={row.id} speed={row.speed} direction={row.direction}>
            {row.faqItems.map((item) => (
              <FaqCard key={item.id} question={item.question} answer={item.answer} />
            ))}
          </HorizontalScroller>
        ))}
      </div>
    </div>
  );
}
