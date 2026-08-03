import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function ScreenHeader({ title, description, backHref, backLabel = "← Voltar" }: Props) {
  return (
    <div>
      {backHref && (
        <Link href={backHref} className="text-sm text-neutral-500 hover:underline">
          {backLabel}
        </Link>
      )}
      <h1 className={`text-xl sm:text-2xl ${backHref ? "mt-1" : ""}`}>{title}</h1>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
    </div>
  );
}
