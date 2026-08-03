import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  /** Conteúdo extra no header (shrink-0), abaixo do título/descrição — ex: busca, form de adicionar. */
  headerExtra?: ReactNode;
  /** Corpo rola internamente (overflow-y-auto) em vez de estourar a altura do card. */
  scrollable?: boolean;
  /** Fica fixo abaixo do corpo (ex: total, botão) — não rola junto com o corpo. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Bloco/card de grid usado nas telas internas do app. Nunca leva
 * overflow-hidden no frame externo — só o corpo (quando `scrollable`) recebe
 * overflow-y-auto, pra não clipar elementos posicionados (ex: dropdowns) que
 * moram no header/footer do card.
 */
export function Card({
  title,
  description,
  headerExtra,
  scrollable,
  footer,
  className = "",
  children,
}: Props) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col rounded-md border border-neutral-300 p-4 dark:border-neutral-700 ${className}`}
    >
      {(title || headerExtra) && (
        <div className="mb-3 flex shrink-0 flex-col gap-3">
          {title && (
            <div>
              <h2 className="text-base font-medium">{title}</h2>
              {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
            </div>
          )}
          {headerExtra}
        </div>
      )}
      <div
        className={`flex flex-col gap-3 ${scrollable ? "min-h-0 flex-1 overflow-y-auto" : ""}`}
      >
        {children}
      </div>
      {footer && (
        <div className="mt-3 shrink-0 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          {footer}
        </div>
      )}
    </div>
  );
}
