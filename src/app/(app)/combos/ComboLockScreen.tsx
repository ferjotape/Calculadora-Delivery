import Link from "next/link";
import type { SVGProps } from "react";

export function ComboLockScreen() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 px-6 py-16 text-center dark:border-neutral-700">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <LockIcon className="h-6 w-6" />
      </span>
      <p className="text-base font-medium">Disponível no plano Business</p>
      <p className="max-w-sm text-sm text-neutral-500">
        Monte combos com várias receitas do seu cardápio fazendo upgrade pro plano Business.
      </p>
      <Link
        href="/billing"
        className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-active"
      >
        Fazer upgrade
      </Link>
    </div>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4.5" y="9" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="12.7" r="1.1" fill="currentColor" />
    </svg>
  );
}
