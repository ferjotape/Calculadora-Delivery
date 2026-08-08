import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/Card";

type Props = {
  title: string;
  lastUpdated: string;
  crossLinkHref: string;
  crossLinkLabel: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  lastUpdated,
  crossLinkHref,
  crossLinkLabel,
  children,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Logo markClassName="h-7 w-7" textClassName="text-lg" />
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">Última atualização: {lastUpdated}</p>
      </div>

      <Card>
        <div className="flex flex-col gap-6">{children}</div>
      </Card>

      <p className="text-center text-sm text-neutral-500">
        Veja também:{" "}
        <Link href={crossLinkHref} className="font-medium text-neutral-900 underline dark:text-white">
          {crossLinkLabel}
        </Link>
      </p>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg">
        {number}. {title}
      </h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-1.5 pl-5">{children}</ul>;
}

export function LegalListItem({ children }: { children: ReactNode }) {
  return <li className="list-disc">{children}</li>;
}
