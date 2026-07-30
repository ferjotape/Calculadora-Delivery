import Link from "next/link";
import { redirect } from "next/navigation";
import type { SVGProps } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  aggregateRecipeCosts,
  computeCostSettingsSummary,
  computePriceMetrics,
  computeRecipePricing,
  getPracticedPriceStatus,
  type PracticedPriceStatus,
} from "@/lib/pricing";
import { getSubscriptionStatus } from "@/lib/subscription";

type DashboardRecipe = {
  id: string;
  name: string;
  cost: number;
  suggestedPrice: number | null;
  practicedPrice: number | null;
  profitPct: number | null;
  status: PracticedPriceStatus | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscriptionStatus = await getSubscriptionStatus(supabase, user.id);
  if (!subscriptionStatus.isActive) {
    redirect("/billing");
  }

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, name, loss_pct, practiced_price")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, ingredient_id, quantity_used");

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, unit_cost")
    .eq("user_id", user.id);

  const { data: costSettings } = await supabase
    .from("cost_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const costByRecipe = aggregateRecipeCosts(recipeIngredients ?? [], ingredients ?? []);

  const dashboardRecipes: DashboardRecipe[] = (recipes ?? []).map((recipe) => {
    const cost = costByRecipe.get(recipe.id)?.totalCost ?? 0;
    const pricing = computeRecipePricing({
      recipeCost: cost,
      lossPct: recipe.loss_pct,
      costSettings: costSettings ?? null,
    });

    const practicedPrice = recipe.practiced_price;
    const status =
      practicedPrice !== null && pricing.suggestedPrice !== null
        ? getPracticedPriceStatus(practicedPrice, pricing.suggestedPrice)
        : null;

    const profitPct =
      practicedPrice !== null && pricing.costWithLoss !== null
        ? computePriceMetrics(practicedPrice, pricing.costWithLoss, pricing.variablePct).profitPct
        : pricing.approxProfitPct;

    return {
      id: recipe.id,
      name: recipe.name,
      cost,
      suggestedPrice: pricing.suggestedPrice,
      practicedPrice,
      profitPct,
      status,
    };
  });

  const costSummary = computeCostSettingsSummary(costSettings ?? null);

  const totalRecipes = dashboardRecipes.length;
  const profitValues = dashboardRecipes
    .map((r) => r.profitPct)
    .filter((value): value is number => value !== null);
  const avgProfitPct =
    profitValues.length > 0
      ? profitValues.reduce((sum, value) => sum + value, 0) / profitValues.length
      : null;
  const belowCount = dashboardRecipes.filter((r) => r.status === "below").length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Visão geral da precificação do seu cardápio.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <ResumoCard
          icon={<RecipeBookIcon className="h-5 w-5" />}
          label="Receitas cadastradas"
          value={String(totalRecipes)}
        />
        <ResumoCard
          icon={<CoinIcon className="h-5 w-5" />}
          label="Custos totais (R$)"
          value={
            costSummary.totalCostsValue !== null
              ? formatCurrency(costSummary.totalCostsValue)
              : "—"
          }
        />
        <ResumoCard
          icon={<PercentIcon className="h-5 w-5" />}
          label="Custos totais (%)"
          value={`${formatNumber(costSummary.totalCostsPct, { maximumFractionDigits: 1 })}%`}
        />
      </section>

      {!costSettings && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Configure seus custos em{" "}
          <Link href="/onboarding" className="underline">
            Configurações de Custos
          </Link>{" "}
          para calcular o preço sugerido das suas receitas.
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryStat
          label="Lucro médio"
          value={avgProfitPct !== null ? `${formatNumber(avgProfitPct, { maximumFractionDigits: 1 })}%` : "—"}
        />
        <SummaryStat
          label="Preço abaixo do ideal"
          value={String(belowCount)}
          highlight={belowCount > 0}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/onboarding/recipes"
          className="rounded-md bg-neutral-900 px-4 py-3 text-center text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          + Nova Receita
        </Link>
        <Link
          href="/onboarding/ingredients"
          className="rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          Insumos
        </Link>
        <Link
          href="/onboarding/platforms"
          className="rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          Plataformas
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Minhas receitas</h2>

        {dashboardRecipes.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
            Nenhuma receita cadastrada ainda.{" "}
            <Link href="/onboarding/recipes" className="underline">
              Crie sua primeira receita
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          highlight ? "text-red-600 dark:text-red-500" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ResumoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
        {icon}
      </span>
      <div>
        <p className="font-heading text-xl font-bold sm:text-2xl">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function RecipeBookIcon(props: SVGProps<SVGSVGElement>) {
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

function CoinIcon(props: SVGProps<SVGSVGElement>) {
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

function PercentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="14" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function RecipeCard({ recipe }: { recipe: DashboardRecipe }) {
  const isBelow = recipe.status === "below";

  return (
    <Link
      href={`/onboarding/recipes/${recipe.id}`}
      className={`flex flex-col gap-3 rounded-md border p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 ${
        isBelow
          ? "border-red-300 dark:border-red-900"
          : "border-neutral-300 dark:border-neutral-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{recipe.name}</h3>
        {isBelow && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
            ⚠ Margem apertada
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-500">Custo</dt>
          <dd>{formatCurrency(recipe.cost)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Preço sugerido</dt>
          <dd className="font-heading font-bold text-accent">
            {recipe.suggestedPrice !== null ? formatCurrency(recipe.suggestedPrice) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Preço praticado</dt>
          <dd>{recipe.practicedPrice !== null ? formatCurrency(recipe.practicedPrice) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Lucro</dt>
          <dd
            className={
              recipe.profitPct !== null && recipe.profitPct < 0
                ? "font-medium text-red-600 dark:text-red-500"
                : "font-medium"
            }
          >
            {recipe.profitPct !== null
              ? `${formatNumber(recipe.profitPct, { maximumFractionDigits: 1 })}%`
              : "—"}
          </dd>
        </div>
      </dl>
    </Link>
  );
}
