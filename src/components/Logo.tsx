import type { SVGProps } from "react";

/**
 * Glifo CUSTTO: três colunas ascendentes — as duas primeiras (tinta neutra)
 * representam os custos que compõem o produto (insumo + operação); a
 * terceira, em coral, é a margem que fecha o preço final.
 */
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="1" y="1" width="42" height="42" rx="12" fill="var(--background)" stroke="var(--hairline)" />
      <rect x="12" y="24" width="6" height="9" rx="2" fill="var(--foreground)" />
      <rect x="19" y="18" width="6" height="15" rx="2" fill="var(--foreground)" />
      <rect x="26" y="10" width="6" height="23" rx="2" fill="#cc785c" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
};

export function Logo({ className = "", markClassName = "h-7 w-7", textClassName = "text-lg" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={`shrink-0 ${markClassName}`} />
      <span className={`font-heading tracking-tight ${textClassName}`}>CUSTTO</span>
    </span>
  );
}
