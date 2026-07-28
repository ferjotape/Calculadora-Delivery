import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "@/lib/subscription";
import { RecipeDetailManager } from "./RecipeDetailManager";

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

  const subscriptionStatus = await getSubscriptionStatus(supabase, user.id);
  if (!subscriptionStatus.isActive) {
    redirect("/billing");
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recipe) {
    redirect("/onboarding/recipes");
  }

  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select("*")
    .eq("recipe_id", id);

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("id, name, unit, unit_cost")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const { data: costSettings } = await supabase
    .from("cost_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: platforms } = await supabase
    .from("delivery_platforms")
    .select("id, name, fee_pct")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-12">
      <div>
        <Link href="/onboarding/recipes" className="text-sm text-neutral-500 hover:underline">
          ← Voltar para receitas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{recipe.name}</h1>
      </div>

      <RecipeDetailManager
        recipe={recipe}
        initialItems={recipeIngredients ?? []}
        availableIngredients={ingredients ?? []}
        costSettings={costSettings ?? null}
        platforms={platforms ?? []}
      />
    </div>
  );
}
