import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { LogoutButton } from "./LogoutButton";

export type AppNavKey =
  | "dashboard"
  | "recipes"
  | "ingredients"
  | "platforms"
  | "costs"
  | "billing";

const NAV_ITEMS: { key: AppNavKey; label: string; href: string }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "recipes", label: "Receitas", href: "/onboarding/recipes" },
  { key: "ingredients", label: "Insumos", href: "/onboarding/ingredients" },
  { key: "platforms", label: "Plataformas", href: "/onboarding/platforms" },
  { key: "costs", label: "Custos", href: "/onboarding" },
  { key: "billing", label: "Assinatura", href: "/billing" },
];

export function AppHeader({ active }: { active: AppNavKey }) {
  return (
    <header className="flex flex-col gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
          Precifica Delivery
        </span>
        <form action={logout}>
          <LogoutButton />
        </form>
      </div>

      <nav
        aria-label="Navegação principal"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              item.key === active
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
