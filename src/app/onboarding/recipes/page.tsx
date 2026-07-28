import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { RecipesManager, type RecipeSummary } from "./RecipesManager";

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, ingredient_id, quantity_used");

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, unit_cost")
    .eq("user_id", user.id);

  const unitCostById = new Map((ingredients ?? []).map((i) => [i.id, i.unit_cost]));

  const costByRecipe = new Map<string, { totalCost: number; ingredientCount: number }>();
  for (const item of recipeIngredients ?? []) {
    const unitCost = unitCostById.get(item.ingredient_id) ?? 0;
    const current = costByRecipe.get(item.recipe_id) ?? { totalCost: 0, ingredientCount: 0 };
    current.totalCost += item.quantity_used * unitCost;
    current.ingredientCount += 1;
    costByRecipe.set(item.recipe_id, current);
  }

  const summaries: RecipeSummary[] = (recipes ?? []).map((recipe) => {
    const agg = costByRecipe.get(recipe.id);
    return {
      id: recipe.id,
      name: recipe.name,
      loss_pct: recipe.loss_pct,
      totalCost: agg?.totalCost ?? 0,
      ingredientCount: agg?.ingredientCount ?? 0,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Minhas receitas</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Monte seus pratos a partir dos insumos já cadastrados e acompanhe o custo de cada
            receita.
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

      <RecipesManager initialRecipes={summaries} />

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/onboarding"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
