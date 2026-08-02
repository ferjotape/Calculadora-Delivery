import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aggregateRecipeCosts } from "@/lib/pricing";
import { getSubscriptionStatus } from "@/lib/subscription";
import { RecipesManager, type RecipeSummary } from "./RecipesManager";

export default async function RecipesPage() {
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

  const [{ data: recipes }, { data: ingredients }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("ingredients").select("id, unit_cost").eq("user_id", user.id),
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div>
        <h1 className="text-2xl">Minhas receitas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Monte seus pratos a partir dos insumos já cadastrados e acompanhe o custo de cada
          receita.
        </p>
      </div>

      <RecipesManager initialRecipes={summaries} />

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <Link
          href="/dashboard"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-active"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
