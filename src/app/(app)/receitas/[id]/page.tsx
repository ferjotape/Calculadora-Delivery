import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadCostSettingsWithLiveRevenue } from "@/lib/monthly-revenue";
import { RecipeDetailManager } from "./RecipeDetailManager";
import { ScreenHeader } from "@/components/ScreenHeader";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: recipe },
    { data: recipeIngredients },
    { data: ingredients },
    costSettings,
    { data: platforms },
  ] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase.from("recipe_ingredients").select("*").eq("recipe_id", id),
    supabase
      .from("ingredients")
      .select("id, name, unit, unit_cost")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),
    loadCostSettingsWithLiveRevenue(supabase, user.id),
    supabase
      .from("delivery_platforms")
      .select("id, name, fee_pct")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (!recipe) {
    redirect("/receitas");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader title={recipe.name} backHref="/receitas" backLabel="← Voltar para receitas" />

      <RecipeDetailManager
        recipe={recipe}
        initialItems={recipeIngredients ?? []}
        availableIngredients={ingredients ?? []}
        costSettings={costSettings}
        platforms={platforms ?? []}
      />
    </div>
  );
}
