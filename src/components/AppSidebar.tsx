"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";
import { logout } from "@/app/auth/actions";
import { LogoutButton } from "./LogoutButton";

type AppNavKey = "dashboard" | "recipes" | "ingredients" | "platforms" | "costs" | "billing";

const NAV_ITEMS: { key: AppNavKey; label: string; href: string; Icon: IconComponent }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", Icon: DashboardIcon },
  { key: "recipes", label: "Receitas", href: "/onboarding/recipes", Icon: RecipesIcon },
  { key: "ingredients", label: "Insumos", href: "/onboarding/ingredients", Icon: IngredientsIcon },
  { key: "platforms", label: "Plataformas", href: "/onboarding/platforms", Icon: PlatformsIcon },
  { key: "costs", label: "Custos", href: "/onboarding", Icon: CostsIcon },
  { key: "billing", label: "Assinatura", href: "/billing", Icon: BillingIcon },
];

function getActiveKey(pathname: string): AppNavKey | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/onboarding/recipes")) return "recipes";
  if (pathname.startsWith("/onboarding/ingredients")) return "ingredients";
  if (pathname.startsWith("/onboarding/platforms")) return "platforms";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname === "/onboarding") return "costs";
  return null;
}

export function AppSidebar() {
  const pathname = usePathname();
  const active = getActiveKey(pathname);

  return (
    <>
      {/* Desktop: sidebar fixa à esquerda */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 px-4 py-6 md:flex md:sticky md:top-0 md:h-screen dark:border-neutral-800">
        <span className="font-heading px-2 text-base font-bold tracking-tight text-accent">
          Precifica Delivery
        </span>

        <nav aria-label="Navegação principal" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.key} item={item} isActive={item.key === active} />
          ))}
        </nav>

        <div className="mt-auto border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <form action={logout}>
            <LogoutButton />
          </form>
        </div>
      </aside>

      {/* Mobile: barra superior com nav em pills roláveis */}
      <header className="flex flex-col gap-3 border-b border-neutral-200 px-4 py-4 md:hidden dark:border-neutral-800">
        <div className="flex items-center justify-between gap-4">
          <span className="font-heading text-sm font-bold tracking-tight text-accent">
            Precifica Delivery
          </span>
          <form action={logout}>
            <LogoutButton />
          </form>
        </div>

        <nav
          aria-label="Navegação principal"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.key === active ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                item.key === active
                  ? "bg-accent text-white"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}

function SidebarLink({
  item,
  isActive,
}: {
  item: { key: AppNavKey; label: string; href: string; Icon: IconComponent };
  isActive: boolean;
}) {
  const { href, label, Icon } = item;
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent text-white"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
}

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function RecipesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10 4.5C8.5 3.5 6 3.2 4 3.6V15.6C6 15.2 8.5 15.5 10 16.5C11.5 15.5 14 15.2 16 15.6V3.6C14 3.2 11.5 3.5 10 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 4.5V16.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IngredientsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 8H16L15 16.5C14.9 17.3 14.2 18 13.4 18H6.6C5.8 18 5.1 17.3 5 16.5L4 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 8V6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6V8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PlatformsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3 6.5L10 3L17 6.5L10 10L3 6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5L10 14L17 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 14.5L10 18L17 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CostsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3 6C3 4.9 3.9 4 5 4H14C15.1 4 16 4.9 16 6V15C16 16.1 15.1 17 14 17H5C3.9 17 3 16.1 3 15V6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.2H16.5V13.2H12C11.17 13.2 10.5 12.53 10.5 11.7C10.5 10.87 11.17 10.2 12 10.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BillingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6.2V13.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M12.1 8.1C12.1 7.27 11.16 6.6 10 6.6C8.84 6.6 7.9 7.27 7.9 8.1C7.9 8.93 8.66 9.3 10 9.6C11.34 9.9 12.1 10.27 12.1 11.1C12.1 11.93 11.16 12.6 10 12.6C8.84 12.6 7.9 11.93 7.9 11.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
