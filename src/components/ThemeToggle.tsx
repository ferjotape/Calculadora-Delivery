"use client";

import { useEffect, useState, type SVGProps } from "react";
import { useTheme } from "next-themes";

type Props = {
  className?: string;
};

/**
 * Alterna direto entre claro e escuro (sem expor "sistema" como opção
 * visível — a preferência do SO só é usada como padrão na 1ª visita).
 * Renderiza um placeholder até montar no client: antes disso não dá pra
 * saber com segurança qual ícone mostrar sem arriscar mismatch de hidratação.
 */
export function ThemeToggle({ className = "" }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Padrão recomendado pelo next-themes: no server não dá pra saber o tema
    // resolvido, então só se decide qual ícone mostrar depois de montar no client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${className}`}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900 ${className}`}
    >
      {isDark ? (
        <SunIcon className="h-[18px] w-[18px]" />
      ) : (
        <MoonIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5V4.2M10 15.8V17.5M17.5 10H15.8M4.2 10H2.5M15.3 4.7L14.1 5.9M5.9 14.1L4.7 15.3M15.3 15.3L14.1 14.1M5.9 5.9L4.7 4.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M17 12.5C15.9 13 14.7 13.3 13.4 13.1C10.1 12.7 7.5 10 7.2 6.7C7.1 5.4 7.3 4.1 7.8 3C4.9 3.9 2.8 6.6 2.8 9.8C2.8 13.8 6 17 10 17C13 17 15.6 15.2 16.7 12.6C16.8 12.5 16.9 12.5 17 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
