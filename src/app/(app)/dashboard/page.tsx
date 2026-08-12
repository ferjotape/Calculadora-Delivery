import Link from "next/link";
import { redirect } from "next/navigation";
import type { SVGProps } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  aggregateRecipeCosts,
  computeCostSettingsSummary,
  computeCurrentMarkup,
  computePriceMetrics,
  computeRecipePricing,
  getMarkupBenchmark,
  getPracticedPriceStatus,
  type MarkupBenchmark,
  type PracticedPriceStatus,
} from "@/lib/pricing";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";

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

  const [{ data: recipes }, { data: ingredients }, { data: costSettings }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, name, loss_pct, practiced_price")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    supabase.from("ingredients").select("id, unit_cost").eq("user_id", user.id),
    supabase.from("cost_settings").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const recipeIds = (recipes ?? []).map((recipe) => recipe.id);
  const { data: recipeIngredients } =
    recipeIds.length > 0
      ? await supabase
          .from("recipe_ingredients")
          .select("recipe_id, ingredient_id, quantity_used")
          .in("recipe_id", recipeIds)
      : { data: [] };

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
  const currentMarkup = computeCurrentMarkup(costSettings ?? null);
  const markupBenchmark = currentMarkup !== null ? getMarkupBenchmark(currentMarkup) : null;

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader title="Dashboard" description="Visão geral da precificação do seu cardápio." />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Card title="Visão geral">
          <div className="grid grid-cols-2 gap-3">
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
            <ResumoCard
              icon={<GaugeIcon className="h-5 w-5" />}
              label="Markup atual"
              value={
                currentMarkup !== null
                  ? formatNumber(currentMarkup, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"
              }
              valueClassName={markupBenchmark ? MARKUP_BENCHMARK_COLOR[markupBenchmark] : undefined}
              caption={
                currentMarkup === null
                  ? "Complete as configurações de custo para ver seu markup"
                  : undefined
              }
            />
          </div>

          {!costSettings && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Configure seus custos em{" "}
              <Link href="/custos" className="underline">
                Configurações de Custos
              </Link>{" "}
              para calcular o preço sugerido das suas receitas.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            <SummaryStat
              label="Lucro médio"
              value={
                avgProfitPct !== null
                  ? `${formatNumber(avgProfitPct, { maximumFractionDigits: 1 })}%`
                  : "—"
              }
            />
            <SummaryStat
              label="Preço abaixo do ideal"
              value={String(belowCount)}
              highlight={belowCount > 0}
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Link
              href="/receitas"
              className="rounded-md bg-accent px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-accent-active"
            >
              + Nova Receita
            </Link>
            <Link
              href="/insumos"
              className="rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              Insumos
            </Link>
            <Link
              href="/plataformas"
              className="rounded-md border border-neutral-300 px-4 py-3 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              Plataformas
            </Link>
          </div>
        </Card>

        <Card title="Minhas receitas">
          {dashboardRecipes.length === 0 ? (
            <p className="rounded-md border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
              Nenhuma receita cadastrada ainda.{" "}
              <Link href="/receitas" className="underline">
                Crie sua primeira receita
              </Link>
              .
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dashboardRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </Card>
      </div>
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
        className={`mt-1 font-mono text-2xl font-semibold ${
          highlight ? "text-red-600 dark:text-red-500" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const MARKUP_BENCHMARK_COLOR: Record<MarkupBenchmark, string> = {
  excellent: "text-green-600 dark:text-green-500",
  good: "text-green-600 dark:text-green-500",
  medium: "text-amber-600 dark:text-amber-500",
  high: "text-red-600 dark:text-red-500",
};

function ResumoCard({
  icon,
  label,
  value,
  valueClassName,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4 dark:border-neutral-700">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
        {icon}
      </span>
      <div>
        <p className={`font-mono text-xl font-semibold sm:text-2xl ${valueClassName ?? ""}`}>
          {value}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{label}</p>
        {caption && <p className="mt-1 text-xs normal-case text-neutral-400">{caption}</p>}
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

function GaugeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 14A6 6 0 0 1 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 14L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}

function RecipeCard({ recipe }: { recipe: DashboardRecipe }) {
  const isBelow = recipe.status === "below";

  return (
    <Link
      href={`/receitas/${recipe.id}`}
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
          <dd className="font-mono">{formatCurrency(recipe.cost)}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Preço sugerido</dt>
          <dd className="font-mono font-semibold">
            {recipe.suggestedPrice !== null ? formatCurrency(recipe.suggestedPrice) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Preço praticado</dt>
          <dd className="font-mono">
            {recipe.practicedPrice !== null ? formatCurrency(recipe.practicedPrice) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Lucro</dt>
          <dd
            className={
              recipe.profitPct !== null && recipe.profitPct < 0
                ? "font-mono font-medium text-red-600 dark:text-red-500"
                : "font-mono font-medium"
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
