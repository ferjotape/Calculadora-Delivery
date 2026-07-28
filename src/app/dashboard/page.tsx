import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  aggregateRecipeCosts,
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Visão geral da precificação do seu cardápio.
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Sair
          </button>
        </form>
      </header>

      {!costSettings && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Configure seus custos em{" "}
          <Link href="/onboarding" className="underline">
            Configurações de Custos
          </Link>{" "}
          para calcular o preço sugerido das suas receitas.
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryStat label="Receitas cadastradas" value={String(totalRecipes)} />
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
          <dd>{recipe.suggestedPrice !== null ? formatCurrency(recipe.suggestedPrice) : "—"}</dd>
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
