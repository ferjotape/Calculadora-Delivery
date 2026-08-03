import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  /** Conteúdo extra no header, abaixo do título/descrição — ex: busca, form de adicionar. */
  headerExtra?: ReactNode;
  /** Fica visualmente separado abaixo do corpo (ex: total, botão), com uma borda no topo. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Bloco/card usado nas telas internas do app pra organizar conteúdo em
 * grid. Altura sempre natural (baseada no conteúdo) — nunca corta nem
 * força scroll interno; se o conteúdo for grande, o card cresce e a
 * página rola normalmente.
 */
export function Card({ title, description, headerExtra, footer, className = "", children }: Props) {
  return (
    <div
      className={`flex flex-col rounded-md border border-neutral-300 p-4 dark:border-neutral-700 ${className}`}
    >
      {(title || headerExtra) && (
        <div className="mb-3 flex flex-col gap-3">
          {title && (
            <div>
              <h2 className="text-base font-medium">{title}</h2>
              {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
            </div>
          )}
          {headerExtra}
        </div>
      )}
      <div className="flex flex-col gap-3">{children}</div>
      {footer && (
        <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          {footer}
        </div>
      )}
    </div>
  );
}
